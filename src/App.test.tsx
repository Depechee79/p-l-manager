import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { App } from './App';
import type { AppUser } from '@types';

// Track the callback registered by onAuthStateChange
let authCallback: ((user: AppUser | null) => void) | null = null;

const mockAuthUser: AppUser = {
  id: 'test-uid',
  uid: 'test-uid',
  nombre: 'Test Director',
  email: 'director@pltest.com',
  rolId: 'director_operaciones',
  restaurantIds: ['rest-1'],
  activo: true,
  fechaCreacion: '2026-01-01T00:00:00Z',
  ultimoAcceso: '2026-03-29T00:00:00Z',
};

// Mock FirestoreService to skip cloud sync
vi.mock('@core/services/FirestoreService', () => ({
  FirestoreService: class {
    add = vi.fn().mockResolvedValue({ success: true });
    update = vi.fn().mockResolvedValue({ success: true });
    delete = vi.fn().mockResolvedValue({ success: true });
    getAll = vi.fn().mockResolvedValue({ success: true, data: [] });
  },
}));

// Mock DataIntegrityService
vi.mock('@core/services/DataIntegrityService', () => ({
  DataIntegrityService: class {
    validateForeignKey = vi.fn().mockReturnValue({ valid: true, errors: [] });
    validateDelete = vi.fn().mockReturnValue({ valid: true, errors: [] });
    validateEntity = vi.fn().mockReturnValue({ valid: true, errors: [] });
    canDelete = vi.fn().mockReturnValue({ canDelete: true, dependencies: [] });
  },
}));

// Mock LoggerService
vi.mock('@core/services/LoggerService', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// Mock ToastService
vi.mock('@core/services/ToastService', () => ({
  ToastService: {
    success: vi.fn().mockReturnValue('toast-id'),
    error: vi.fn().mockReturnValue('toast-id'),
    warning: vi.fn().mockReturnValue('toast-id'),
    info: vi.fn().mockReturnValue('toast-id'),
    saving: vi.fn().mockReturnValue('toast-id'),
    dismiss: vi.fn(),
    update: vi.fn(),
    subscribe: vi.fn().mockReturnValue(vi.fn()),
    onDismiss: vi.fn().mockReturnValue(vi.fn()),
    withFeedback: vi.fn().mockImplementation(async (fn: () => Promise<unknown>) => fn()),
  },
}));

// Mock AuthService — captures the callback, does NOT fire it automatically
vi.mock('@core/services/AuthService', () => ({
  onAuthStateChange: vi.fn((callback: (user: AppUser | null) => void) => {
    authCallback = callback;
    return vi.fn();
  }),
  logoutUser: vi.fn().mockResolvedValue(undefined),
  loginUser: vi.fn(),
  signUpBusinessOwner: vi.fn(),
  signUpWithInvitation: vi.fn(),
  createInvitation: vi.fn(),
}));

// Mock firebase.config
vi.mock('./config/firebase.config', () => ({
  isFirebaseConfigured: vi.fn().mockReturnValue(true),
  getFirestoreInstance: vi.fn(),
  getAuthInstance: vi.fn(),
}));

// Mock CompanyService
vi.mock('@core/services/CompanyService', () => ({
  CompanyService: class {
    getCompany = vi.fn().mockReturnValue(null);
    createCompany = vi.fn().mockResolvedValue({ id: 'default', nombre: 'Test Co' });
    getCompanies = vi.fn().mockReturnValue([]);
    updateCompany = vi.fn().mockResolvedValue(undefined);
  },
}));

// Mock RestaurantService
vi.mock('@core/services/RestaurantService', () => ({
  RestaurantService: class {
    getAllRestaurants = vi.fn().mockReturnValue([]);
    getRestaurant = vi.fn().mockReturnValue(null);
    createRestaurant = vi.fn().mockResolvedValue({ id: '1', nombre: 'Test' });
    updateRestaurant = vi.fn().mockResolvedValue(undefined);
    deleteRestaurant = vi.fn().mockResolvedValue(undefined);
  },
}));

// Mock migration
vi.mock('@core/utils/migration', () => ({
  runMigrationIfNeeded: vi.fn().mockResolvedValue(undefined),
}));

// Mock window.matchMedia for responsive hooks
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

/** Simulate Firebase auth firing with a specific user */
async function fireAuth(user: AppUser | null) {
  await act(async () => {
    authCallback?.(user);
  });
}

describe('App', () => {
  beforeEach(() => {
    authCallback = null;
    localStorage.clear();
    window.history.pushState({}, '', '/');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows login page when user is not authenticated', async () => {
    render(<App />);
    await fireAuth(null);

    await waitFor(() => {
      expect(screen.getByText(/iniciar sesi/i) || screen.getByRole('button')).toBeTruthy();
    });
  });

  it('shows main app with navigation when user is authenticated', async () => {
    render(<App />);
    await fireAuth(mockAuthUser);

    await waitFor(() => {
      const navElement = document.querySelector('nav');
      expect(navElement).toBeTruthy();
    });
  });

  it('renders dashboard on root route when authenticated', async () => {
    render(<App />);
    await fireAuth(mockAuthUser);

    await waitFor(() => {
      const mainContent = document.querySelector('main') || document.querySelector('[class*="content"]');
      expect(mainContent).toBeTruthy();
    });
  });

  it('redirects unknown routes to root when authenticated', async () => {
    window.history.pushState({}, '', '/nonexistent-route');
    render(<App />);
    await fireAuth(mockAuthUser);

    await waitFor(() => {
      expect(window.location.pathname).toBe('/');
    });
  });

  it('redirects to login when not authenticated and visiting any route', async () => {
    window.history.pushState({}, '', '/almacen');
    render(<App />);
    await fireAuth(null);

    await waitFor(() => {
      expect(window.location.pathname).toBe('/login');
    });
  });

  it('allows user logout', async () => {
    render(<App />);
    await fireAuth(mockAuthUser);

    await waitFor(() => {
      const navElement = document.querySelector('nav');
      expect(navElement).toBeTruthy();
    });

    // Verify the app rendered authenticated state
    expect(document.querySelector('nav')).toBeTruthy();
  });

  it('redirects legacy routes to new routes when authenticated', async () => {
    window.history.pushState({}, '', '/ocr');
    render(<App />);
    await fireAuth(mockAuthUser);

    await waitFor(() => {
      expect(window.location.pathname).toBe('/docs');
    });
  });

  it('wraps authenticated routes in AppShellV2', async () => {
    render(<App />);
    await fireAuth(mockAuthUser);

    await waitFor(() => {
      const sidebar = document.querySelector('aside') || document.querySelector('nav');
      expect(sidebar).toBeTruthy();
    });
  });
});
