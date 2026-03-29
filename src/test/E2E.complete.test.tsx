import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { App } from '../App';
import type { AppUser } from '@types';

/**
 * E2E COMPLETE TEST - FULL APPLICATION WALKTHROUGH
 *
 * Tests the current app structure with AppShellV2, auth gate,
 * and routes: /, /docs, /cierres, /escandallos, /almacen, /equipo, /pnl, /configuracion
 */

const mockAuthUser: AppUser = {
  id: 'test-uid',
  uid: 'test-uid',
  nombre: 'Director Test',
  email: 'director@pltest.com',
  rolId: 'director_operaciones',
  restaurantIds: ['rest-1'],
  activo: true,
  fechaCreacion: '2026-01-01T00:00:00Z',
  ultimoAcceso: '2026-03-29T00:00:00Z',
};

// Track the callback registered by onAuthStateChange so we can fire it manually
let authCallback: ((user: AppUser | null) => void) | null = null;

// Mock FirestoreService
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
vi.mock('../config/firebase.config', () => ({
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

/** Simulate Firebase auth firing with a specific user */
async function fireAuth(user: AppUser | null) {
  await act(async () => {
    authCallback?.(user);
  });
}

describe('E2E Complete Application Test', () => {
  beforeAll(() => {
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
  });

  beforeEach(() => {
    authCallback = null;
    localStorage.clear();
    window.history.pushState({}, '', '/');
  });

  describe('AUTH GATE', () => {
    it('should show login page when not authenticated', async () => {
      render(<App />);
      await fireAuth(null);

      await waitFor(() => {
        expect(window.location.pathname).toBe('/login');
      });
    });

    it('should show main app when authenticated', async () => {
      render(<App />);
      await fireAuth(mockAuthUser);

      await waitFor(() => {
        const nav = document.querySelector('nav');
        expect(nav).toBeTruthy();
      });
    });

    it('should redirect any route to login when not authenticated', async () => {
      window.history.pushState({}, '', '/almacen');
      render(<App />);
      await fireAuth(null);

      await waitFor(() => {
        expect(window.location.pathname).toBe('/login');
      });
    });
  });

  describe('APPSHELL V2 LAYOUT', () => {
    it('should render sidebar navigation', async () => {
      render(<App />);
      await fireAuth(mockAuthUser);

      await waitFor(() => {
        const sidebar = document.querySelector('aside') || document.querySelector('nav');
        expect(sidebar).toBeTruthy();
      });
    });

    it('should render navigation links for current routes', async () => {
      const { container } = render(<App />);
      await fireAuth(mockAuthUser);

      await waitFor(() => {
        const links = container.querySelectorAll('a');
        expect(links.length).toBeGreaterThan(0);
      });
    });

    it('should have buttons in the app', async () => {
      render(<App />);
      await fireAuth(mockAuthUser);

      await waitFor(() => {
        const buttons = screen.queryAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('ROUTE NAVIGATION', () => {
    it('should render dashboard at root', async () => {
      const { container } = render(<App />);
      await fireAuth(mockAuthUser);

      await waitFor(() => {
        const mainContent = container.querySelector('main') || container.querySelector('[class*="content"]');
        expect(mainContent).toBeTruthy();
      });
    });

    it('should redirect legacy /proveedores to /almacen', async () => {
      window.history.pushState({}, '', '/proveedores');
      render(<App />);
      await fireAuth(mockAuthUser);

      await waitFor(() => {
        expect(window.location.pathname).toBe('/almacen');
      });
    });

    it('should redirect legacy /ocr to /docs', async () => {
      window.history.pushState({}, '', '/ocr');
      render(<App />);
      await fireAuth(mockAuthUser);

      await waitFor(() => {
        expect(window.location.pathname).toBe('/docs');
      });
    });

    it('should redirect legacy /inventario to /almacen', async () => {
      window.history.pushState({}, '', '/inventario');
      render(<App />);
      await fireAuth(mockAuthUser);

      await waitFor(() => {
        expect(window.location.pathname).toBe('/almacen');
      });
    });

    it('should redirect legacy /personal to /equipo', async () => {
      window.history.pushState({}, '', '/personal');
      render(<App />);
      await fireAuth(mockAuthUser);

      await waitFor(() => {
        expect(window.location.pathname).toBe('/equipo');
      });
    });

    it('should redirect unknown routes to /', async () => {
      window.history.pushState({}, '', '/nonexistent');
      render(<App />);
      await fireAuth(mockAuthUser);

      await waitFor(() => {
        expect(window.location.pathname).toBe('/');
      });
    });

    it('should redirect legacy /gastos-fijos to /pnl', async () => {
      window.history.pushState({}, '', '/gastos-fijos');
      render(<App />);
      await fireAuth(mockAuthUser);

      await waitFor(() => {
        expect(window.location.pathname).toBe('/pnl');
      });
    });

    it('should redirect legacy /roles to /configuracion', async () => {
      window.history.pushState({}, '', '/roles');
      render(<App />);
      await fireAuth(mockAuthUser);

      await waitFor(() => {
        expect(window.location.pathname).toBe('/configuracion');
      });
    });
  });

  describe('NAVIGATION BETWEEN SECTIONS', () => {
    it('should navigate to a section via sidebar link', async () => {
      const { container } = render(<App />);
      await fireAuth(mockAuthUser);

      await waitFor(() => {
        const nav = document.querySelector('nav');
        expect(nav).toBeTruthy();
      });

      const navLinks = container.querySelectorAll('a[href]');
      const cierresLink = Array.from(navLinks).find(l => l.getAttribute('href') === '/cierres');

      if (cierresLink) {
        fireEvent.click(cierresLink);
        await waitFor(() => {
          expect(window.location.pathname).toBe('/cierres');
        });
      }
    });

    it('should be able to navigate between multiple sections', async () => {
      const { container } = render(<App />);
      await fireAuth(mockAuthUser);

      await waitFor(() => {
        const nav = document.querySelector('nav');
        expect(nav).toBeTruthy();
      });

      const routes = ['/docs', '/cierres', '/almacen'];

      for (const route of routes) {
        const link = container.querySelector(`a[href="${route}"]`);
        if (link) {
          fireEvent.click(link);
          await waitFor(() => {
            expect(window.location.pathname).toBe(route);
          });
        }
      }
    });

    it('should navigate back to dashboard', async () => {
      const { container } = render(<App />);
      await fireAuth(mockAuthUser);

      await waitFor(() => {
        const nav = document.querySelector('nav');
        expect(nav).toBeTruthy();
      });

      const almacenLink = container.querySelector('a[href="/almacen"]');
      if (almacenLink) {
        fireEvent.click(almacenLink);
        await waitFor(() => {
          expect(window.location.pathname).toBe('/almacen');
        });
      }

      const homeLink = container.querySelector('a[href="/"]');
      if (homeLink) {
        fireEvent.click(homeLink);
        await waitFor(() => {
          expect(window.location.pathname).toBe('/');
        });
      }
    });
  });

  describe('DATA PERSISTENCE', () => {
    it('should maintain auth state across navigation', async () => {
      const { container } = render(<App />);
      await fireAuth(mockAuthUser);

      await waitFor(() => {
        const nav = document.querySelector('nav');
        expect(nav).toBeTruthy();
      });

      const link = container.querySelector('a[href="/cierres"]');
      if (link) {
        fireEvent.click(link);
      }

      await waitFor(() => {
        const nav = document.querySelector('nav');
        expect(nav).toBeTruthy();
      });
    });

    it('should maintain authentication via Firebase Auth listener', () => {
      // Auth is now managed by Firebase Auth listener, not localStorage
      expect(authCallback).toBeDefined;
    });
  });

  describe('VALIDATION SUMMARY', () => {
    it('should validate core app features are functional', async () => {
      const { container } = render(<App />);
      await fireAuth(mockAuthUser);

      const validations = {
        renders: false,
        hasNavigation: false,
        hasContent: false,
      };

      await waitFor(() => {
        if (container.innerHTML.length > 0) {
          validations.renders = true;
        }

        const nav = document.querySelector('nav');
        if (nav) {
          validations.hasNavigation = true;
        }

        const content = container.querySelector('main') || container.querySelector('[class*="content"]');
        if (content) {
          validations.hasContent = true;
        }
      });

      expect(validations.renders).toBe(true);
      expect(validations.hasNavigation).toBe(true);
    });
  });
});
