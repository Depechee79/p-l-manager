/**
 * ProtectedRoute.test.tsx - Tests for the route guard component
 */
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

// Mock useApp hook
const mockUseApp = vi.fn();
vi.mock('@core', () => ({
    useApp: () => mockUseApp(),
}));

// Test component to render when access granted
const ProtectedContent = () => <div data-testid="protected-content">Protected Content</div>;
const FallbackContent = () => <div data-testid="fallback-content">Fallback Content</div>;

// Helper to render with router
function renderWithRouter(
    initialPath: string,
    requiredPermissions: string[],
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
                            requiredPermissions={requiredPermissions as any}
                            requireAll={requireAll}
                        />
                    }
                />
            </Routes>
        </MemoryRouter>
    );
}

describe('ProtectedRoute', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('when user is not authenticated', () => {
        it('should redirect to fallback when user is null', () => {
            mockUseApp.mockReturnValue({
                user: null,
                isAuthenticated: false,
            });

            renderWithRouter('/protected', ['pnl.view']);

            expect(screen.getByTestId('fallback-content')).toBeInTheDocument();
            expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
        });

        it('should redirect to fallback when not authenticated', () => {
            mockUseApp.mockReturnValue({
                user: { name: 'Test User' },
                isAuthenticated: false,
            });

            renderWithRouter('/protected', ['pnl.view']);

            expect(screen.getByTestId('fallback-content')).toBeInTheDocument();
        });
    });

    describe('when user has Director role (all permissions)', () => {
        beforeEach(() => {
            mockUseApp.mockReturnValue({
                user: { name: 'Director Test', roleId: 'Director' },
                isAuthenticated: true,
            });
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

    describe('when user has Camarero role (limited permissions)', () => {
        beforeEach(() => {
            mockUseApp.mockReturnValue({
                user: { name: 'Camarero Test', roleId: 'Camarero' },
                isAuthenticated: true,
            });
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
            // Encargado has dashboard.view and cierres.view but not pnl.view
            mockUseApp.mockReturnValue({
                user: { name: 'Encargado Test', roleId: 'Encargado' },
                isAuthenticated: true,
            });
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

    describe('when user has no roleId', () => {
        it('should use default Camarero role and deny pnl access', () => {
            mockUseApp.mockReturnValue({
                user: { name: 'No Role User' }, // No roleId
                isAuthenticated: true,
            });

            renderWithRouter('/protected', ['pnl.view']);

            expect(screen.getByTestId('fallback-content')).toBeInTheDocument();
        });

        it('should use default Camarero role and allow dashboard access', () => {
            mockUseApp.mockReturnValue({
                user: { name: 'No Role User' },
                isAuthenticated: true,
            });

            renderWithRouter('/protected', ['dashboard.view']);

            expect(screen.getByTestId('protected-content')).toBeInTheDocument();
        });
    });

    describe('when user has unknown role', () => {
        it('should redirect to fallback', () => {
            mockUseApp.mockReturnValue({
                user: { name: 'Unknown Role User', roleId: 'NonExistentRole' },
                isAuthenticated: true,
            });

            renderWithRouter('/protected', ['dashboard.view']);

            expect(screen.getByTestId('fallback-content')).toBeInTheDocument();
        });
    });
});
