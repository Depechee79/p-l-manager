import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useApp, RestaurantProvider, AppProvider, DatabaseProvider, runMigrationIfNeeded } from '@core';
import { Layout, ProtectedRoute } from '@components';
import { DashboardPage, ProvidersPage, InventariosPage, CierresPage, OCRPage, PnLPage, EscandallosPage, PersonalPage, TransfersPage, MermasPage, OrdersPage, MenuEngineeringPage, RestaurantConfigPage, RolesAdminPage, GastosFijosPage, NominasPage } from '@pages';
import { useDatabase } from '@hooks';
import { ToastProvider } from '@utils';

// App content with routing
const AppContent: React.FC = () => {
  const { user, logout } = useApp();
  const { db } = useDatabase();

  // Run migration on mount if needed
  useEffect(() => {
    // Wait a bit for Firebase sync to complete
    const timer = setTimeout(() => {
      runMigrationIfNeeded(db).catch((err: Error) => {
        console.error('Migration error:', err);
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [db]);

  return (
    <BrowserRouter>
      <Layout user={user as any} onLogout={logout}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/ocr" element={<OCRPage />} />
          <Route path="/proveedores" element={<ProvidersPage />} />
          <Route path="/inventario" element={<Navigate to="/inventarios" replace />} />
          <Route path="/inventarios" element={<InventariosPage />} />
          <Route path="/cierres" element={<CierresPage />} />
          <Route path="/escandallos" element={<EscandallosPage />} />
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
            path="/gastos-fijos"
            element={
              <ProtectedRoute
                element={<GastosFijosPage />}
                requiredPermissions={['pnl.view']}
              />
            }
          />
          <Route
            path="/nominas"
            element={
              <ProtectedRoute
                element={<NominasPage />}
                requiredPermissions={['usuarios.edit']}
              />
            }
          />
          <Route path="/equipo" element={<PersonalPage />} />
          <Route path="/mermas" element={<MermasPage />} />
          <Route path="/pedidos" element={<OrdersPage />} />
          <Route path="/ingenieria-menu" element={<MenuEngineeringPage />} />
          <Route
            path="/configuracion"
            element={
              <ProtectedRoute
                element={<RestaurantConfigPage />}
                requiredPermissions={['configuracion.edit']}
              />
            }
          />
          <Route
            path="/roles"
            element={
              <ProtectedRoute
                element={<RolesAdminPage />}
                requiredPermissions={['usuarios.edit']}
              />
            }
          />
          <Route path="/transferencias" element={<TransfersPage />} />
          <Route path="/personal" element={<Navigate to="/equipo" replace />} />
          <Route path="/usuarios" element={<Navigate to="/equipo" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
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

export default App;
