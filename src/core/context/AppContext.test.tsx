import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppProvider, useApp } from './AppContext';
import type { AppUser } from '@types';

// Track the callback registered by onAuthStateChange
let authStateCallback: ((user: AppUser | null) => void) | null = null;
const mockLogoutUser = vi.fn().mockResolvedValue(undefined);

// Mock AuthService
vi.mock('../services/AuthService', () => ({
  onAuthStateChange: vi.fn((callback: (user: AppUser | null) => void) => {
    authStateCallback = callback;
    return vi.fn(); // unsubscribe
  }),
  logoutUser: () => mockLogoutUser(),
}));

// Mock firebase.config
vi.mock('../../config/firebase.config', () => ({
  isFirebaseConfigured: vi.fn().mockReturnValue(true),
}));

// Mock LoggerService
vi.mock('../services/LoggerService', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

const mockAppUser: AppUser = {
  id: 'test-uid-123',
  uid: 'test-uid-123',
  nombre: 'Test User',
  email: 'test@example.com',
  rolId: 'director_operaciones',
  restaurantIds: ['rest-1'],
  activo: true,
  fechaCreacion: '2026-01-01T00:00:00Z',
  ultimoAcceso: '2026-03-29T00:00:00Z',
};

// Test component that uses the context
const TestComponent = () => {
  const { user, isAuthenticated, authLoading, error, clearError, logout } = useApp();

  return (
    <div>
      <div>Auth Status: {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>
      <div>Loading: {authLoading ? 'true' : 'false'}</div>
      {user && <div>User: {user.name}</div>}
      {user && <div>UID: {user.uid}</div>}
      {error && (
        <div>
          <div>Error: {error}</div>
          <button onClick={clearError}>Clear Error</button>
        </div>
      )}
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('AppContext', () => {
  beforeEach(() => {
    authStateCallback = null;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts in loading state', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    expect(screen.getByText('Loading: true')).toBeInTheDocument();
    expect(screen.getByText('Auth Status: Not Authenticated')).toBeInTheDocument();
  });

  it('sets user when auth state fires with a user', async () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    // Simulate Firebase auth state change
    await act(async () => {
      authStateCallback?.(mockAppUser);
    });

    await waitFor(() => {
      expect(screen.getByText('Auth Status: Authenticated')).toBeInTheDocument();
      expect(screen.getByText('User: Test User')).toBeInTheDocument();
      expect(screen.getByText('UID: test-uid-123')).toBeInTheDocument();
      expect(screen.getByText('Loading: false')).toBeInTheDocument();
    });
  });

  it('sets unauthenticated when auth state fires with null', async () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    await act(async () => {
      authStateCallback?.(null);
    });

    await waitFor(() => {
      expect(screen.getByText('Auth Status: Not Authenticated')).toBeInTheDocument();
      expect(screen.getByText('Loading: false')).toBeInTheDocument();
      expect(screen.queryByText(/User:/)).not.toBeInTheDocument();
    });
  });

  it('calls logoutUser and clears user on logout', async () => {
    const user = userEvent.setup();
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    // First, set a user
    await act(async () => {
      authStateCallback?.(mockAppUser);
    });

    await waitFor(() => {
      expect(screen.getByText('Auth Status: Authenticated')).toBeInTheDocument();
    });

    // Then logout
    await user.click(screen.getByText('Logout'));

    await waitFor(() => {
      expect(mockLogoutUser).toHaveBeenCalled();
    });
  });

  it('displays error messages', async () => {
    const TestErrorComponent = () => {
      const { error, setError } = useApp();

      return (
        <div>
          {error && <div>Error: {error}</div>}
          <button onClick={() => setError('Test error message')}>Trigger Error</button>
        </div>
      );
    };

    const user = userEvent.setup();
    render(
      <AppProvider>
        <TestErrorComponent />
      </AppProvider>
    );

    await user.click(screen.getByText('Trigger Error'));

    await waitFor(() => {
      expect(screen.getByText('Error: Test error message')).toBeInTheDocument();
    });
  });

  it('clears error messages', async () => {
    const user = userEvent.setup();

    render(
      <AppProvider>
        <div>
          <TestComponent />
          {/* Helper to set error */}
          <SetErrorHelper />
        </div>
      </AppProvider>
    );

    await user.click(screen.getByText('Set Error'));
    await waitFor(() => {
      expect(screen.getByText('Error: Test error')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Clear Error'));
    await waitFor(() => {
      expect(screen.queryByText('Error: Test error')).not.toBeInTheDocument();
    });
  });

  it('recovers when onAuthStateChange callback throws — authLoading becomes false, user is null', async () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    // Simulate the callback throwing an error
    await act(async () => {
      if (authStateCallback) {
        // Pass an object that will cause the mapping to throw
        const badUser = null as unknown as AppUser;
        // We need to trigger the catch path: pass an object whose property access throws
        const trap = new Proxy({} as AppUser, {
          get(_target, prop) {
            if (prop === 'uid' || prop === 'id' || prop === 'nombre') {
              throw new Error('Simulated auth processing error');
            }
            return undefined;
          },
        });
        authStateCallback(trap);
      }
    });

    await waitFor(() => {
      expect(screen.getByText('Loading: false')).toBeInTheDocument();
      expect(screen.getByText('Auth Status: Not Authenticated')).toBeInTheDocument();
    });
  });

  it('warns when user has no restaurantIds', async () => {
    const { logger: mockLogger } = await import('../services/LoggerService');

    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    const userWithoutRestaurants: AppUser = {
      ...mockAppUser,
      restaurantIds: [],
    };

    await act(async () => {
      authStateCallback?.(userWithoutRestaurants);
    });

    await waitFor(() => {
      expect(screen.getByText('Auth Status: Authenticated')).toBeInTheDocument();
      expect(screen.getByText('Loading: false')).toBeInTheDocument();
    });

    expect(mockLogger.warn).toHaveBeenCalledWith(
      'User has no restaurantIds assigned',
      expect.objectContaining({ uid: 'test-uid-123' })
    );
  });

  it('throws error when useApp is used outside AppProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useApp must be used within AppProvider');

    consoleError.mockRestore();
  });
});

// Helper component
const SetErrorHelper = () => {
  const { setError } = useApp();
  return <button onClick={() => setError('Test error')}>Set Error</button>;
};
