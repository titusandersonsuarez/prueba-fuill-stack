import { Role } from '@prescriptions/shared';

jest.mock('@/lib/api-client', () => ({
  setAccessToken: jest.fn(),
  removeAccessToken: jest.fn(),
  getAccessToken: jest.fn(),
}));

import { useAuthStore } from '@/store/auth.store';
import { setAccessToken, removeAccessToken } from '@/lib/api-client';

const ADMIN_USER = { id: '1', email: 'admin@test.com', role: Role.ADMIN };

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, accessToken: null, isHydrated: false });
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('initial state has no user', () => {
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('setAuth stores user and accessToken in state', () => {
    useAuthStore.getState().setAuth(ADMIN_USER, 'tok-abc');
    const { user, accessToken } = useAuthStore.getState();
    expect(user).toEqual(ADMIN_USER);
    expect(accessToken).toBe('tok-abc');
  });

  it('setAuth calls setAccessToken with the token', () => {
    useAuthStore.getState().setAuth(ADMIN_USER, 'tok-abc');
    expect(setAccessToken).toHaveBeenCalledWith('tok-abc');
  });

  it('clearAuth resets user and accessToken to null', () => {
    useAuthStore.setState({ user: ADMIN_USER, accessToken: 'tok-abc' });
    useAuthStore.getState().clearAuth();
    const { user, accessToken } = useAuthStore.getState();
    expect(user).toBeNull();
    expect(accessToken).toBeNull();
  });

  it('clearAuth calls removeAccessToken', () => {
    useAuthStore.getState().clearAuth();
    expect(removeAccessToken).toHaveBeenCalled();
  });

  it('setHydrated sets isHydrated to true', () => {
    expect(useAuthStore.getState().isHydrated).toBe(false);
    useAuthStore.getState().setHydrated();
    expect(useAuthStore.getState().isHydrated).toBe(true);
  });

  it('does not persist accessToken to localStorage (partialize)', () => {
    useAuthStore.getState().setAuth(ADMIN_USER, 'secret-token');
    const stored = JSON.parse(localStorage.getItem('auth-store') ?? '{}') as {
      state?: { accessToken?: string; user?: object };
    };
    expect(stored.state?.user).toBeDefined();
    expect(stored.state?.accessToken).toBeUndefined();
  });
});
