'use client';

import Cookies from 'js-cookie';
import type { ApiErrorResponse } from '@prescriptions/shared';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const COOKIE_NAME = 'access_token';
const COOKIE_TTL_MS = 14 * 60 * 1000; // 14 min (JWT expires at 15)

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: ApiErrorResponse,
  ) {
    super(body.message);
    this.name = 'ApiError';
  }
}

export function getAccessToken(): string | undefined {
  return Cookies.get(COOKIE_NAME);
}

export function setAccessToken(token: string): void {
  Cookies.set(COOKIE_NAME, token, {
    expires: new Date(Date.now() + COOKIE_TTL_MS),
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
  });
}

export function removeAccessToken(): void {
  Cookies.remove(COOKIE_NAME);
}

async function tryRefresh(): Promise<string | null> {
  try {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { accessToken: string };
    setAccessToken(data.accessToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const token = getAccessToken();

  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });

  if (res.status === 401 && retry) {
    const newToken = await tryRefresh();
    if (newToken) return request<T>(path, init, false);
    removeAccessToken();
    if (typeof window !== 'undefined') window.location.href = '/login';
    throw new ApiError(401, { message: 'Sesión expirada', code: 'UNAUTHORIZED' });
  }

  if (res.status === 204) return null as T;

  const json = await res
    .json()
    .catch(() => ({ message: 'Error de servidor', code: 'INTERNAL_SERVER_ERROR' }));

  if (!res.ok) throw new ApiError(res.status, json as ApiErrorResponse);

  return json as T;
}

export const apiClient = {
  get: <T>(path: string, init?: RequestInit) => request<T>(path, { ...init, method: 'GET' }),

  post: <T>(path: string, body?: unknown, init?: RequestInit) =>
    request<T>(path, {
      ...init,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(path: string, body?: unknown, init?: RequestInit) =>
    request<T>(path, {
      ...init,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  delete: <T = void>(path: string, init?: RequestInit) =>
    request<T>(path, { ...init, method: 'DELETE' }),
};
