import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '@/components/auth/login-form';
import { authService } from '@/services/auth.service';
import { ApiError } from '@/lib/api-client';
import { Role } from '@prescriptions/shared';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: jest.fn() }),
  useSearchParams: () => ({ get: () => null }),
}));

jest.mock('@/services/auth.service', () => ({
  authService: { login: jest.fn() },
}));

// Mock store so setAuth is a no-op (avoids cookie side effects)
jest.mock('@/store/auth.store', () => ({
  useAuthStore: (selector: (s: { setAuth: jest.Mock }) => unknown) =>
    selector({ setAuth: jest.fn() }),
}));

// Keep ApiError real so instanceof check in the component works
jest.mock('@/lib/api-client', () => {
  class ApiError extends Error {
    status: number;
    body: { message: string; code: string };
    constructor(status: number, body: { message: string; code: string }) {
      super(body.message);
      this.name = 'ApiError';
      this.status = status;
      this.body = body;
    }
  }
  return { ApiError };
});

describe('LoginForm', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders email input, password input and submit button', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('shows ApiError message when login fails', async () => {
    const user = userEvent.setup();
    jest
      .mocked(authService.login)
      .mockRejectedValue(
        new ApiError(401, { message: 'Credenciales inválidas', code: 'UNAUTHORIZED' }),
      );

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), 'wrong@test.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(screen.getByText('Credenciales inválidas')).toBeInTheDocument();
    });
  });

  it('shows generic error message on unexpected failure', async () => {
    const user = userEvent.setup();
    jest.mocked(authService.login).mockRejectedValue(new Error('Network error'));

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), 'a@test.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'password1');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(screen.getByText('Error de conexión con el servidor')).toBeInTheDocument();
    });
  });

  it('redirects to /dashboard on successful login', async () => {
    const user = userEvent.setup();
    jest.mocked(authService.login).mockResolvedValue({
      accessToken: 'tok123',
      user: { id: '1', email: 'admin@test.com', role: Role.ADMIN },
    });

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), 'admin@test.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'admin1234');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('disables submit button while login is in progress', async () => {
    const user = userEvent.setup();
    // Never-resolving promise keeps the component in loading state
    jest
      .mocked(authService.login)
      .mockImplementation(
        () =>
          new Promise<{ accessToken: string; user: { id: string; email: string; role: Role } }>(
            () => {},
          ),
      );

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), 'a@test.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'password1');
    // Start the click but do not await so we can inspect the loading state
    void user.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /entrar/i })).toBeDisabled();
    });
  });
});
