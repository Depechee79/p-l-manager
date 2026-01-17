import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppProvider, useApp } from './AppContext';

// Test component that uses the context
const TestComponent = () => {
  const { user, isAuthenticated, error, clearError, login, logout } = useApp();
  
  return (
    <div>
      <div>Auth Status: {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>
      {user && <div>User: {user.name}</div>}
      {error && (
        <div>
          <div>Error: {error}</div>
          <button onClick={clearError}>Clear Error</button>
        </div>
      )}
      <button onClick={() => login('Test User')}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('AppContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('provides default unauthenticated state', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    expect(screen.getByText('Auth Status: Not Authenticated')).toBeInTheDocument();
    expect(screen.queryByText(/User:/)).not.toBeInTheDocument();
  });

  it('allows user to login', async () => {
    const user = userEvent.setup();
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    await user.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(screen.getByText('Auth Status: Authenticated')).toBeInTheDocument();
      expect(screen.getByText('User: Test User')).toBeInTheDocument();
    });
  });

  it('allows user to logout', async () => {
    const user = userEvent.setup();
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    await user.click(screen.getByText('Login'));
    await waitFor(() => {
      expect(screen.getByText('Auth Status: Authenticated')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Logout'));
    await waitFor(() => {
      expect(screen.getByText('Auth Status: Not Authenticated')).toBeInTheDocument();
      expect(screen.queryByText(/User:/)).not.toBeInTheDocument();
    });
  });

  it('persists user data in localStorage on login', async () => {
    const user = userEvent.setup();
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    await user.click(screen.getByText('Login'));

    await waitFor(() => {
      const stored = localStorage.getItem('app_user');
      expect(stored).toBeTruthy();
      const userData = JSON.parse(stored!);
      expect(userData.name).toBe('Test User');
    });
  });

  it('loads user from localStorage on mount', () => {
    localStorage.setItem('app_user', JSON.stringify({ name: 'Stored User' }));

    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    expect(screen.getByText('Auth Status: Authenticated')).toBeInTheDocument();
    expect(screen.getByText('User: Stored User')).toBeInTheDocument();
  });

  it('clears user from localStorage on logout', async () => {
    const user = userEvent.setup();
    localStorage.setItem('app_user', JSON.stringify({ name: 'Stored User' }));

    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    await user.click(screen.getByText('Logout'));

    await waitFor(() => {
      expect(localStorage.getItem('app_user')).toBeNull();
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
        <TestComponent />
      </AppProvider>
    );

    // Manually set error using a helper component
    const TestErrorSetter = () => {
      const { setError } = useApp();
      return <button onClick={() => setError('Test error')}>Set Error</button>;
    };

    const { rerender } = render(
      <AppProvider>
        <div>
          <TestComponent />
          <TestErrorSetter />
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

  it('throws error when useApp is used outside AppProvider', () => {
    // Suppress console.error for this test
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useApp must be used within AppProvider');

    consoleError.mockRestore();
  });
});
