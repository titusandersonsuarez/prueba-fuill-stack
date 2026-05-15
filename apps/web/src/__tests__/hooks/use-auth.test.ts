import { renderHook, act } from '@testing-library/react';
import { useAuth } from '@/hooks/use-auth';
import { useAuthStore } from '@/store/auth.store';
import { Role } from '@prescriptions/shared';

jest.mock('@/lib/api-client', () => ({
  setAccessToken: jest.fn(),
  removeAccessToken: jest.fn(),
}));

describe('useAuth', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, accessToken: null, isHydrated: false });
    jest.clearAllMocks();
  });

  it('isAuthenticated=false and user=null when not logged in', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('isHydrated reflects store hydration state', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.isHydrated).toBe(false);
    act(() => useAuthStore.getState().setHydrated());
    expect(result.current.isHydrated).toBe(true);
  });

  it('role flags for ADMIN user', () => {
    act(() =>
      useAuthStore.setState({ user: { id: '1', email: 'admin@test.com', role: Role.ADMIN } }),
    );
    const { result } = renderHook(() => useAuth());
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.isDoctor).toBe(false);
    expect(result.current.isPatient).toBe(false);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('role flags for DOCTOR user', () => {
    act(() =>
      useAuthStore.setState({ user: { id: '2', email: 'doc@test.com', role: Role.DOCTOR } }),
    );
    const { result } = renderHook(() => useAuth());
    expect(result.current.isDoctor).toBe(true);
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isPatient).toBe(false);
  });

  it('role flags for PATIENT user', () => {
    act(() =>
      useAuthStore.setState({ user: { id: '3', email: 'pat@test.com', role: Role.PATIENT } }),
    );
    const { result } = renderHook(() => useAuth());
    expect(result.current.isPatient).toBe(true);
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isDoctor).toBe(false);
  });

  it('isAuthenticated becomes false after clearAuth', () => {
    act(() => useAuthStore.setState({ user: { id: '1', email: 'a@test.com', role: Role.ADMIN } }));
    const { result } = renderHook(() => useAuth());
    expect(result.current.isAuthenticated).toBe(true);

    act(() => result.current.clearAuth());
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });
});
