import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useApp, RestaurantProvider, AppProvider, DatabaseProvider, runMigrationIfNeeded } from '@core';
import { ProtectedRoute } from '@components';
import { AppShellV2 } from '@shared/components/layout';
import { DashboardPage, AlmacenPage, CierresPage, OCRPage, PnLPage, EscandallosPage, PersonalPage, RestaurantConfigPage, LoginPage, SignUpPage, InvitationSignUpPage } from '@pages';
import { useDatabase } from '@hooks';
import { ToastProvider } from '@utils';
import { logger } from '@core/services/LoggerService';

/**
 * AppShellV2 is now used for ALL routes (Canon Stitch design)
 * Session 006: Expanded from /almacen and /docs to all routes
 */

// App content with routing
const AppContent: React.FC = () => {
  const { user, logout, isAuthenticated } = useApp();
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
        <Routes>
          {/* Main routes - Session 004 reorganization */}
          <Route path="/" element={<DashboardPage />} />
          <Route path="/docs" element={<OCRPage />} />
          <Route path="/cierres" element={<CierresPage />} />
          <Route path="/escandallos" element={<EscandallosPage />} />
          <Route path="/almacen" element={<AlmacenPage />} />
          <Route path="/equipo" element={<PersonalPage />} />
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
