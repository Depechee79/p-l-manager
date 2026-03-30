import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useApp, RestaurantProvider, AppProvider, DatabaseProvider, runMigrationIfNeeded } from '@core';
import { ProtectedRoute } from '@components';
import { AppShellV2 } from '@shared/components/layout';
import { Skeleton, SkeletonKPIGrid } from '@shared/components/LoadingSkeleton';
import { LoginPage, SignUpPage, InvitationSignUpPage } from '@pages';
import { useDatabase } from '@hooks';
import { ToastProvider } from '@utils';
import { logger } from '@core/services/LoggerService';

// Lazy-loaded pages — code-split per route to reduce initial bundle
const DashboardPage = lazy(() => import('@pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const AlmacenPage = lazy(() => import('@pages/AlmacenPage').then(m => ({ default: m.AlmacenPage })));
const CierresPage = lazy(() => import('@pages/CierresPage').then(m => ({ default: m.CierresPage })));
const OCRPage = lazy(() => import('@pages/OCRPage').then(m => ({ default: m.OCRPage })));
const PnLPage = lazy(() => import('@pages/PnLPage').then(m => ({ default: m.PnLPage })));
const EscandallosPage = lazy(() => import('@pages/EscandallosPage').then(m => ({ default: m.EscandallosPage })));
const PersonalPage = lazy(() => import('@features/personal').then(m => ({ default: m.PersonalPage })));
const RestaurantConfigPage = lazy(() => import('@pages/RestaurantConfigPage').then(m => ({ default: m.RestaurantConfigPage })));

/**
 * AppShellV2 is now used for ALL routes (Canon Stitch design)
 * Session 006: Expanded from /almacen and /docs to all routes
 */

// Route-level loading fallback for lazy-loaded pages
const RouteFallback: React.FC = () => (
  <div style={{ padding: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
    <Skeleton height={32} width="30%" />
    <SkeletonKPIGrid count={4} />
    <Skeleton height={200} />
  </div>
);

// App content with routing
const AppContent: React.FC = () => {
  const { user, logout, isAuthenticated, authLoading } = useApp();
  const { db } = useDatabase();

  // Run migration on mount if needed
  useEffect(() => {
    // Wait a bit for Firebase sync to complete
    const timer = setTimeout(() => {
      runMigrationIfNeeded(db).catch((error: unknown) => {
        logger.error('Migration error:', error instanceof Error ? error.message : String(error));
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [db]);

  // Show loading while Firebase Auth resolves initial state
  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
        {/* Topbar skeleton */}
        <div style={{
          height: '64px',
          backgroundColor: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 var(--spacing-lg)',
          gap: 'var(--spacing-md)',
        }}>
          <Skeleton width={120} height={28} />
          <div style={{ flex: 1 }} />
          <Skeleton width={32} height={32} borderRadius="50%" />
        </div>
        {/* Content area skeleton */}
        <div style={{ display: 'flex' }}>
          {/* Sidebar skeleton (desktop) */}
          <div style={{
            width: '256px',
            minHeight: 'calc(100vh - 64px)',
            backgroundColor: 'var(--surface)',
            borderRight: '1px solid var(--border)',
            padding: 'var(--spacing-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-sm)',
          }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} height={36} borderRadius="var(--radius)" />
            ))}
          </div>
          {/* Main content skeleton */}
          <div style={{ flex: 1, padding: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            <Skeleton height={32} width="30%" />
            <SkeletonKPIGrid count={4} />
            <Skeleton height={200} />
          </div>
        </div>
      </div>
    );
  }

  // Show auth pages if not authenticated
  if (!isAuthenticated) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/crear-negocio" element={<SignUpPage />} />
          <Route path="/registro" element={<InvitationSignUpPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <AppShellV2 user={user} onLogout={logout}>
        <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Main routes - All protected by permission checks */}
          <Route path="/" element={
            <ProtectedRoute element={<DashboardPage />} requiredPermissions={['dashboard.view']} />
          } />
          <Route path="/docs" element={
            <ProtectedRoute element={<OCRPage />} requiredPermissions={['ocr.view']} />
          } />
          <Route path="/cierres" element={
            <ProtectedRoute element={<CierresPage />} requiredPermissions={['cierres.view']} />
          } />
          <Route path="/escandallos" element={
            <ProtectedRoute element={<EscandallosPage />} requiredPermissions={['escandallos.view']} />
          } />
          <Route path="/almacen" element={
            <ProtectedRoute element={<AlmacenPage />} requiredPermissions={['almacen.view']} />
          } />
          <Route path="/equipo" element={
            <ProtectedRoute element={<PersonalPage />} requiredPermissions={['personal.view']} />
          } />
          {/* Protected routes - require specific permissions */}
          <Route
            path="/pnl"
            element={
              <ProtectedRoute
                element={<PnLPage />}
                requiredPermissions={['pnl.view']}
              />
            }
          />
          <Route
            path="/configuracion"
            element={
              <ProtectedRoute
                element={<RestaurantConfigPage />}
                requiredPermissions={['configuracion.edit']}
              />
            }
          />
          {/* Redirects for old/consolidated routes */}
          <Route path="/ocr" element={<Navigate to="/docs" replace />} />
          <Route path="/proveedores" element={<Navigate to="/almacen?tab=proveedores" replace />} />
          <Route path="/transferencias" element={<Navigate to="/almacen?tab=traspasos" replace />} />
          <Route path="/gastos-fijos" element={<Navigate to="/pnl?tab=gastos-fijos" replace />} />
          <Route path="/inventario" element={<Navigate to="/almacen" replace />} />
          <Route path="/inventarios" element={<Navigate to="/almacen" replace />} />
          <Route path="/mermas" element={<Navigate to="/almacen?tab=mermas" replace />} />
          <Route path="/pedidos" element={<Navigate to="/almacen?tab=pedidos" replace />} />
          <Route path="/nominas" element={<Navigate to="/equipo" replace />} />
          <Route path="/roles" element={<Navigate to="/configuracion?tab=roles" replace />} />
          <Route path="/ingenieria-menu" element={<Navigate to="/escandallos?tab=analisis" replace />} />
          <Route path="/personal" element={<Navigate to="/equipo" replace />} />
          <Route path="/usuarios" element={<Navigate to="/equipo" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </AppShellV2>
    </BrowserRouter>
  );
};

// Main App component
const App: React.FC = () => {
  return (
    <DatabaseProvider>
      <AppProvider>
        <RestaurantProvider>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </RestaurantProvider>
      </AppProvider>
    </DatabaseProvider>
  );
};

export { App };
