/**
 * DashboardPage - Multi-Restaurant Dashboard
 * 
 * Shows consolidated KPIs with restaurant ranking when multiple
 * restaurants are available.
 * 
 * @audit AUDIT-02 - Added restaurant ranking and selector
 * @audit OPS-02 - Replaced Math.random() with real data from cierres
 */
import React, { useMemo } from 'react';
import { Select, PageHeader } from '@/components';
import { BarChart3 } from 'lucide-react';
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
import { Button } from '@/shared/components';
import type { Cierre, Invoice } from '@/types';

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
  } catch (e) {
    // Not in a RestaurantProvider
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

  const periodLabels: Record<string, string> = {
    day: 'Día',
    week: 'Semana',
    month: 'Mes',
    quarter: 'Trimestre',
    year: 'Año',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)', padding: 'var(--spacing-md)' }}>
      {/* Header with PageHeader component (R-13) */}
      <PageHeader
        title={`Dashboard ${viewMode === 'consolidated' && hasMultipleRestaurants ? '(Consolidado)' : ''}`}
        description={
          viewMode === 'consolidated' && hasMultipleRestaurants
            ? 'Vista consolidada de todos los restaurantes'
            : currentRestaurant?.nombre || 'Resumen de tu negocio'
        }
        icon={<BarChart3 size={28} />}
        action={
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Restaurant Selector - NEW for AUDIT-02 */}
            {hasMultipleRestaurants && (
              <Select
                label="Restaurante"
                value={viewMode === 'consolidated' ? 'all' : String(currentRestaurant?.id || '')}
                onChange={(value: string) => {
                  if (value === 'all') {
                    setViewMode('consolidated');
                  } else {
                    setViewMode('single');
                    handleSwitchRestaurant(value);
                  }
                }}
                options={[
                  { value: 'all', label: '📊 Todos los Restaurantes' },
                  ...restaurants.map(r => ({
                    value: String(r.id),
                    label: r.nombre || String(r.id),
                  })),
                ]}
                style={{ minWidth: '200px' }}
              />
            )}
          </div>
        }
      />

      {/* Period Selector */}
      <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
        {(['day', 'week', 'month', 'quarter', 'year'] as const).map((period) => (
          <Button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            variant={selectedPeriod === period ? 'primary' : 'secondary'}
          >
            {periodLabels[period]}
          </Button>
        ))}
      </div>

      {/* KPI Cards */}
      <KPIGrid kpis={kpis} period={selectedPeriod} />

      {/* Restaurant Ranking - Always visible with demo data if no restaurants */}
      {restaurantKPIs.length > 0 && (
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
  );
};
