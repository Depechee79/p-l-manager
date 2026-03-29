/**
 * ProtectedRoute.test.tsx - Tests for the route guard component
 *
 * The component uses useUserPermissions (which internally calls useApp + SYSTEM_ROLES).
 * We mock useUserPermissions directly to control auth/permission state.
 */
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import type { Permission } from '@types';

// Mock useUserPermissions hook
const mockUseUserPermissions = vi.fn();
vi.mock('@shared/hooks', () => ({
    useUserPermissions: () => mockUseUserPermissions(),
}));

// Mock logger to silence warnings
vi.mock('@core/services/LoggerService', () => ({
    logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

// Test component to render when access granted
const ProtectedContent = () => <div data-testid="protected-content">Protected Content</div>;
const FallbackContent = () => <div data-testid="fallback-content">Fallback Content</div>;

// Helper to render with router
function renderWithRouter(
    initialPath: string,
    requiredPermissions: Permission[],
    requireAll = true
) {
    return render(
        <MemoryRouter initialEntries={[initialPath]}>
            <Routes>
                <Route path="/" element={<FallbackContent />} />
                <Route
                    path="/protected"
                    element={
                        <ProtectedRoute
                            element={<ProtectedContent />}
                            requiredPermissions={requiredPermissions}
                            requireAll={requireAll}
                        />
                    }
                />
            </Routes>
        </MemoryRouter>
    );
}

/** Helper to build a mock return value for useUserPermissions */
function mockPermissions(opts: {
    isAuthenticated: boolean;
    permissions?: Permission[];
    roleName?: string;
}) {
    const perms = opts.permissions ?? [];
    return {
        isAuthenticated: opts.isAuthenticated,
        permissions: perms,
        role: opts.roleName ? { nombre: opts.roleName } : undefined,
        hasPermission: (p: Permission) => perms.includes(p),
        hasAnyPermission: (ps: Permission[]) => ps.some((p) => perms.includes(p)),
        hasAllPermissions: (ps: Permission[]) => ps.every((p) => perms.includes(p)),
    };
}

describe('ProtectedRoute', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('when user is not authenticated', () => {
        it('should redirect to fallback when user is null', () => {
            mockUseUserPermissions.mockReturnValue(
                mockPermissions({ isAuthenticated: false })
            );

            renderWithRouter('/protected', ['pnl.view']);

            expect(screen.getByTestId('fallback-content')).toBeInTheDocument();
            expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
        });

        it('should redirect to fallback when not authenticated', () => {
            mockUseUserPermissions.mockReturnValue(
                mockPermissions({ isAuthenticated: false })
            );

            renderWithRouter('/protected', ['pnl.view']);

            expect(screen.getByTestId('fallback-content')).toBeInTheDocument();
        });
    });

    describe('when user has Director role (all permissions)', () => {
        beforeEach(() => {
            mockUseUserPermissions.mockReturnValue(
                mockPermissions({
                    isAuthenticated: true,
                    permissions: ['pnl.view', 'usuarios.edit', 'dashboard.view', 'configuracion.edit'] as Permission[],
                    roleName: 'Director Operaciones',
                })
            );
        });

        it('should render protected content when user has pnl.view permission', () => {
            renderWithRouter('/protected', ['pnl.view']);

            expect(screen.getByTestId('protected-content')).toBeInTheDocument();
            expect(screen.queryByTestId('fallback-content')).not.toBeInTheDocument();
        });

        it('should render protected content when user has usuarios.edit permission', () => {
            renderWithRouter('/protected', ['usuarios.edit']);

            expect(screen.getByTestId('protected-content')).toBeInTheDocument();
        });

        it('should render protected content when requiring multiple permissions', () => {
            renderWithRouter('/protected', ['pnl.view', 'usuarios.edit']);

            expect(screen.getByTestId('protected-content')).toBeInTheDocument();
        });
    });

    describe('when user has limited permissions', () => {
        beforeEach(() => {
            mockUseUserPermissions.mockReturnValue(
                mockPermissions({
                    isAuthenticated: true,
                    permissions: ['dashboard.view'] as Permission[],
                    roleName: 'Camarero',
                })
            );
        });

        it('should redirect when user lacks pnl.view permission', () => {
            renderWithRouter('/protected', ['pnl.view']);

            expect(screen.getByTestId('fallback-content')).toBeInTheDocument();
            expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
        });

        it('should redirect when user lacks usuarios.edit permission', () => {
            renderWithRouter('/protected', ['usuarios.edit']);

            expect(screen.getByTestId('fallback-content')).toBeInTheDocument();
        });

        it('should render protected content when user has dashboard.view permission', () => {
            renderWithRouter('/protected', ['dashboard.view']);

            expect(screen.getByTestId('protected-content')).toBeInTheDocument();
        });
    });

    describe('requireAll vs requireAny', () => {
        beforeEach(() => {
            // Has dashboard.view but not pnl.view
            mockUseUserPermissions.mockReturnValue(
                mockPermissions({
                    isAuthenticated: true,
                    permissions: ['dashboard.view', 'cierres.view'] as Permission[],
                    roleName: 'Encargado',
                })
            );
        });

        it('should redirect when requireAll=true and user lacks one permission', () => {
            renderWithRouter('/protected', ['dashboard.view', 'pnl.view'], true);

            expect(screen.getByTestId('fallback-content')).toBeInTheDocument();
        });

        it('should render when requireAll=false and user has at least one permission', () => {
            renderWithRouter('/protected', ['dashboard.view', 'pnl.view'], false);

            expect(screen.getByTestId('protected-content')).toBeInTheDocument();
        });
    });

    describe('when user has no role', () => {
        it('should deny access when no permissions', () => {
            mockUseUserPermissions.mockReturnValue(
                mockPermissions({
                    isAuthenticated: true,
                    permissions: [],
                })
            );

            renderWithRouter('/protected', ['pnl.view']);

            expect(screen.getByTestId('fallback-content')).toBeInTheDocument();
        });

        it('should render if no permissions required and user is authenticated', () => {
            mockUseUserPermissions.mockReturnValue(
                mockPermissions({
                    isAuthenticated: true,
                    permissions: [],
                })
            );

            // Empty permissions array - hasAnyPermission([]) returns false (vacuous)
            // But since requireAll=true by default, hasAllPermissions([]) returns true
            renderWithRouter('/protected', [], true);

            expect(screen.getByTestId('protected-content')).toBeInTheDocument();
        });
    });
});
