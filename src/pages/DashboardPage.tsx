/**
 * DashboardPage - Multi-Restaurant Dashboard
 *
 * Session 007: Updated with V2 design system
 * - Removed StickyPageHeader (route shown in topbar breadcrumb)
 * - Using PageLayoutV2 for sticky filters
 *
 * @audit AUDIT-02 - Added restaurant ranking and selector
 * @audit OPS-02 - Replaced Math.random() with real data from cierres
 */
import React, { useMemo } from 'react';
import { PageContainer, PageLayoutV2, ActionHeaderV2, FilterCardV2, FilterInputV2, FilterSelect, type TabV2 } from '@shared/components';
import { logger } from '@core/services/LoggerService';
import {
  useDashboardMetrics,
  KPIGrid,
  RecentActivity,
  AlertsPanel,
  QuickActions,
  RestaurantRankingTable,
} from '@/features/dashboard';
import type { RestaurantKPI } from '@/features/dashboard';
import { useRestaurantContext, useDatabase } from '@core';
import { useUserPermissions } from '@shared/hooks/useUserPermissions';
import type { Cierre, Invoice } from '@/types';

const PERIOD_TABS: TabV2[] = [
  { id: 'day', label: 'Día' },
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mes' },
  { id: 'quarter', label: 'Trimestre' },
  { id: 'year', label: 'Año' },
];

export const DashboardPage: React.FC = () => {
  const {
    selectedPeriod,
    setSelectedPeriod,
    viewMode,
    setViewMode,
    hasMultipleRestaurants,
    kpis,
    recentActivity,
    alerts,
  } = useDashboardMetrics();

  const { db } = useDatabase();
  const { hasPermission } = useUserPermissions();

  // Permission check for multi-restaurant features
  const canViewRestaurants = hasPermission('restaurantes.view');

  // AUDIT-FIX: Load data on demand (R-14)
  React.useEffect(() => {
    const loadDashboardData = async () => {
      await Promise.all([
        db.ensureLoaded('cierres'),
        db.ensureLoaded('facturas')
      ]);
    };
    loadDashboardData();
  }, [db]);

  // Get restaurant context for selector and ranking
  let restaurantContext: ReturnType<typeof useRestaurantContext> | null = null;
  try {
    restaurantContext = useRestaurantContext();
  } catch (error: unknown) {
    logger.warn('DashboardPage: RestaurantContext not available', error instanceof Error ? error.message : String(error));
  }

  const restaurants = restaurantContext?.restaurants || [];
  const currentRestaurant = restaurantContext?.currentRestaurant;

  // Calculate real KPIs from cierres and facturas data
  const restaurantKPIs: RestaurantKPI[] = useMemo(() => {
    const cierres = (db.cierres || []) as Cierre[];
    const facturas = (db.facturas || []) as Invoice[];

    // Get current month/year for filtering
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return restaurants.map((r, idx) => {
      // Filter cierres for this restaurant and current month
      const restaurantCierres = cierres.filter(c =>
        String(c.restaurantId) === String(r.id) &&
        new Date(c.fecha).getMonth() === currentMonth &&
        new Date(c.fecha).getFullYear() === currentYear
      );

      // Calculate total ventas from cierres
      const totalVentas = restaurantCierres.reduce((sum, c) => sum + (c.totalReal || 0), 0);

      // Calculate total descuadre from cierres
      const totalDescuadre = restaurantCierres.reduce((sum, c) => {
        const expected = c.totalPos || 0;
        const real = c.totalReal || 0;
        return sum + Math.abs(expected - real);
      }, 0);
      const descuadrePct = totalVentas > 0 ? (totalDescuadre / totalVentas * 100) : 0;

      // Calculate food cost from facturas
      const restaurantFacturas = facturas.filter(f =>
        String(f.restaurantId) === String(r.id) &&
        new Date(f.fecha).getMonth() === currentMonth &&
        new Date(f.fecha).getFullYear() === currentYear
      );
      const totalCompras = restaurantFacturas.reduce((sum, f) => sum + (f.total || 0), 0);
      const foodCostPct = totalVentas > 0 ? (totalCompras / totalVentas * 100) : 30; // Default 30% if no data

      // Labor cost estimation (would need nominas data, using placeholder logic)
      const laborCostPct = totalVentas > 0 ? 28 : 28; // Placeholder - requires nominas integration

      // EBITDA estimation
      const ebitdaPct = 100 - foodCostPct - laborCostPct - 15; // 15% for other OPEX

      return {
        id: String(r.id),
        name: r.nombre || `Restaurante ${idx + 1}`,
        ventas: totalVentas || 0,
        descuadrePct: Math.round(descuadrePct * 100) / 100,
        foodCostPct: Math.round(foodCostPct * 100) / 100,
        laborCostPct: Math.round(laborCostPct * 100) / 100,
        ebitdaPct: Math.round(Math.max(0, ebitdaPct) * 100) / 100,
      };
    });
  }, [restaurants, db.cierres, db.facturas]);

  const handleSwitchRestaurant = (id: string) => {
    const restaurant = restaurants.find(r => r.id === id);
    if (restaurant && restaurantContext?.switchRestaurant) {
      restaurantContext.switchRestaurant(restaurant);
    }
  };

  // Restaurant options for filter
  const restaurantOptions = useMemo(() => {
    const options = [{ value: 'all', label: 'Todos los Restaurantes' }];
    restaurants.forEach(r => {
      options.push({ value: String(r.id), label: r.nombre || String(r.id) });
    });
    return options;
  }, [restaurants]);

  return (
    <PageContainer>
      <PageLayoutV2
        header={
          <>
            {/* Period Tabs */}
            <ActionHeaderV2
              tabs={PERIOD_TABS}
              activeTab={selectedPeriod}
              onTabChange={(id) => setSelectedPeriod(id as typeof selectedPeriod)}
            />

            {/* Restaurant Filter (only if multiple) */}
            {hasMultipleRestaurants && (
              <FilterCardV2 columns={1}>
                <FilterInputV2 label="Restaurante">
                  <FilterSelect
                    value={viewMode === 'consolidated' ? 'all' : String(currentRestaurant?.id || '')}
                    onChange={(value) => {
                      if (value === 'all') {
                        setViewMode('consolidated');
                      } else {
                        setViewMode('single');
                        handleSwitchRestaurant(value);
                      }
                    }}
                    options={restaurantOptions}
                  />
                </FilterInputV2>
              </FilterCardV2>
            )}
          </>
        }
      >
        {/* KPI Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
          <KPIGrid kpis={kpis} period={selectedPeriod} />

          {/* Restaurant Ranking - Only visible to users with restaurantes.view permission */}
          {canViewRestaurants && restaurantKPIs.length > 0 && (
            <RestaurantRankingTable
              restaurants={restaurantKPIs}
              onSelectRestaurant={(id) => {
                handleSwitchRestaurant(id);
                setViewMode('single');
              }}
              selectedRestaurantId={currentRestaurant?.id ? String(currentRestaurant.id) : null}
            />
          )}

          {/* Middle Section: Quick Actions & Recent Activity */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 'var(--spacing-lg)',
          }}>
            <QuickActions />
            <RecentActivity activities={recentActivity} />
          </div>

          {/* Alerts Section */}
          <AlertsPanel alerts={alerts} />
        </div>
      </PageLayoutV2>
    </PageContainer>
  );
};
