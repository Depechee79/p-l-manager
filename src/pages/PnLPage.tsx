/**
 * PnLPage - Complete P&L Statement (Cuenta de Explotación)
 * 
 * Shows full profit & loss structure including:
 * - 1. Revenue (Local + Delivery)
 * - 2. Cost of Goods Sold (COGS)
 * - 3. Personnel Costs (Labor)
 * - 4. Operating Expenses (OPEX)
 * - 5. Results (EBITDA, Net Profit)
 * 
 * KPIs: Food Cost %, Labor Cost %, Prime Cost %, EBITDA %
 * 
 * @audit AUDIT-01 - Completed full P&L structure
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  Users,
  Building,
  DollarSign,
  Plus
} from 'lucide-react';
import {
  Button,
  Card,
  FormSection,
  Table,
  PageHeader,
  Select,
  Input,
  Modal
} from '@shared/components';
import { useDatabase, useRestaurant } from '@core';
import { useToast } from '../utils/toast';
import type { PnLPeriod, PnLData, PnLComparison, RestaurantKPI } from '../types/pnl.types';
import { PnLService } from '../services/pnl-service';
import { formatCurrency } from '../utils/formatters';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS - KPI Thresholds
// ═══════════════════════════════════════════════════════════════════════════════

const KPI_THRESHOLDS = {
  foodCost: { warning: 32, danger: 35 },      // % ventas
  laborCost: { warning: 28, danger: 32 },     // % ventas
  primeCost: { warning: 58, danger: 62 },     // % ventas
  ebitda: { warning: 12, danger: 8 },         // % ventas (inverted - lower is bad)
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

interface KPICardProps {
  label: string;
  value: string;
  subtitle: string;
  status: 'success' | 'warning' | 'danger' | 'neutral';
  icon?: React.ReactNode;
}

const KPICard: React.FC<KPICardProps> = ({ label, value, subtitle, status, icon }) => {
  const statusColors = {
    success: 'var(--success)',
    warning: 'var(--warning)',
    danger: 'var(--danger)',
    neutral: 'var(--text-main)',
  };

  return (
    <Card>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-xs)',
          color: 'var(--text-secondary)',
          fontSize: 'var(--font-size-sm)',
        }}>
          {icon}
          {label}
        </div>
        <div style={{
          fontSize: 'var(--font-size-2xl)',
          fontWeight: '700',
          color: statusColors[status],
        }}>
          {value}
        </div>
        <div style={{
          fontSize: 'var(--font-size-sm)',
          color: 'var(--text-light)',
        }}>
          {subtitle}
        </div>
      </div>
    </Card>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const PnLPage: React.FC = () => {
  const { db } = useDatabase();
  const { currentRestaurant, restaurants } = useRestaurant();
  const { showToast } = useToast();
  const currentDate = new Date();

  const [period, setPeriod] = useState<PnLPeriod>({
    month: currentDate.getMonth(),
    year: currentDate.getFullYear(),
  });
  const [viewType, setViewType] = useState<'single' | 'comparison'>('single');
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | number | 'all'>(currentRestaurant?.id || 'all');
  const [pnlData, setPnlData] = useState<PnLData | null>(null);
  const [comparisonData, setComparisonData] = useState<PnLComparison | null>(null);
  const [loading, setLoading] = useState(false);

  // ═══════════════════════════════════════════════════════════════════════════════
  // MONTH/YEAR OPTIONS - Generated dynamically
  // ═══════════════════════════════════════════════════════════════════════════════

  const monthYearOptions = useMemo(() => {
    const options: { value: string; label: string }[] = [];
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    // Last 24 months
    for (let i = 0; i < 24; i++) {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      options.push({
        value: `${d.getFullYear()}-${d.getMonth()}`,
        label: `${months[d.getMonth()]} ${d.getFullYear()}`,
      });
    }
    return options;
  }, [currentDate]);

  const viewOptions = [
    { value: 'single', label: 'Vista Detallada' },
    { value: 'comparison', label: 'Comparativa Grupo' },
  ];

  const restaurantOptions = useMemo(() => {
    const options = [
      { value: 'all', label: 'Grupo Completo (Agregado)' },
      ...restaurants.map(r => ({ value: String(r.id), label: r.nombre }))
    ];
    return options;
  }, [restaurants]);

  // ═══════════════════════════════════════════════════════════════════════════════
  // CALCULATIONS
  // ═══════════════════════════════════════════════════════════════════════════════

  const handleCalculate = async () => {
    // AUDIT-FIX: Ensure data is loaded (R-14)
    if (!loading) setLoading(true); // Prevent double-set if called from effect

    try {
      await Promise.all([
        db.ensureLoaded('cierres'),
        db.ensureLoaded('facturas'),
        db.ensureLoaded('delivery'),
        db.ensureLoaded('pnl_adjustments')
      ]);

      const cierres = db.cierres || [];
      const facturas = db.facturas || [];
      const delivery = db.delivery || [];

      if (viewType === 'single') {
        const rid = selectedRestaurantId === 'all' ? undefined : selectedRestaurantId;
        const res = restaurants.find(r => String(r.id) === String(selectedRestaurantId));

        const data = PnLService.calculatePnL(period, cierres, facturas, delivery, (db.pnl_adjustments || []) as any[], rid);

        setPnlData({
          ...data,
          restaurantId: rid,
          restaurantNombre: res?.nombre || 'Grupo Completo'
        });
        setComparisonData(null);
      } else {
        // Multi-restaurant comparison logic
        const comparison: PnLComparison = {
          period,
          restaurants: restaurants.map(r => {
            const data = PnLService.calculatePnL(period, cierres, facturas, delivery, (db.pnl_adjustments || []) as any[], r.id);
            const kpis = PnLService.extractKPIs(data);
            return {
              ...kpis,
              restaurantId: r.id,
              restaurantNombre: r.nombre
            } as RestaurantKPI;
          })
        };
        setComparisonData(comparison);
        setPnlData(null);
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Error de cálculo',
        message: 'No se pudieron procesar los datos del P&L'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleCalculate();
  }, [period, selectedRestaurantId, viewType, db, restaurants]);

  // ═══════════════════════════════════════════════════════════════════════════════
  // FORMATTERS & HELPERS
  // ═══════════════════════════════════════════════════════════════════════════════

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  const getKPIStatus = (value: number, type: keyof typeof KPI_THRESHOLDS): 'success' | 'warning' | 'danger' => {
    const threshold = KPI_THRESHOLDS[type];
    if (type === 'ebitda') {
      // For EBITDA, higher is better
      if (value < threshold.danger) return 'danger';
      if (value < threshold.warning) return 'warning';
      return 'success';
    } else {
      // For costs, lower is better
      if (value > threshold.danger) return 'danger';
      if (value > threshold.warning) return 'warning';
      return 'success';
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // CSV EXPORT (Updated with all sections)
  // ═══════════════════════════════════════════════════════════════════════════════

  const handleExport = () => {
    if (!pnlData) return;

    const csv = [
      ['Concepto', 'Importe', '% Ventas'],
      [''],
      ['1. INGRESOS OPERATIVOS'],
      ['Ventas Local', formatCurrency(pnlData.ingresos.ventasLocal), formatPercentage(PnLService.calculatePercentage(pnlData.ingresos.ventasLocal, pnlData.ingresos.totalIngresos))],
      ['Ventas Delivery', formatCurrency(pnlData.ingresos.ventasDelivery), formatPercentage(PnLService.calculatePercentage(pnlData.ingresos.ventasDelivery, pnlData.ingresos.totalIngresos))],
      ['TOTAL INGRESOS', formatCurrency(pnlData.ingresos.totalIngresos), '100.0%'],
      [''],
      ['2. COSTE DE MATERIAS (COGS)'],
      ['Compras Comida', formatCurrency(pnlData.materias.comprasComida), formatPercentage(PnLService.calculatePercentage(pnlData.materias.comprasComida, pnlData.ingresos.totalIngresos))],
      ['Compras Bebida', formatCurrency(pnlData.materias.comprasBebida), formatPercentage(PnLService.calculatePercentage(pnlData.materias.comprasBebida, pnlData.ingresos.totalIngresos))],
      ['TOTAL MATERIAS', formatCurrency(pnlData.materias.totalMaterias), formatPercentage(pnlData.materias.foodCostPct)],
      [''],
      ['3. GASTOS DE PERSONAL'],
      ['Salarios Brutos', formatCurrency(pnlData.personal.salarios), formatPercentage(PnLService.calculatePercentage(pnlData.personal.salarios, pnlData.ingresos.totalIngresos))],
      ['Seguridad Social', formatCurrency(pnlData.personal.seguridadSocial), formatPercentage(PnLService.calculatePercentage(pnlData.personal.seguridadSocial, pnlData.ingresos.totalIngresos))],
      ['TOTAL PERSONAL', formatCurrency(pnlData.personal.totalPersonal), formatPercentage(pnlData.personal.personalPct)],
      [''],
      ['4. GASTOS OPERATIVOS (OPEX)'],
      ['Alquiler', formatCurrency(pnlData.opex.alquiler), formatPercentage(PnLService.calculatePercentage(pnlData.opex.alquiler, pnlData.ingresos.totalIngresos))],
      ['Suministros', formatCurrency(pnlData.opex.suministros), formatPercentage(PnLService.calculatePercentage(pnlData.opex.suministros, pnlData.ingresos.totalIngresos))],
      ['Servicios', formatCurrency(pnlData.opex.servicios), formatPercentage(PnLService.calculatePercentage(pnlData.opex.servicios, pnlData.ingresos.totalIngresos))],
      ['Marketing', formatCurrency(pnlData.opex.marketing), formatPercentage(PnLService.calculatePercentage(pnlData.opex.marketing, pnlData.ingresos.totalIngresos))],
      ['Limpieza', formatCurrency(pnlData.opex.limpieza), formatPercentage(PnLService.calculatePercentage(pnlData.opex.limpieza, pnlData.ingresos.totalIngresos))],
      ['Seguros', formatCurrency(pnlData.opex.seguros), formatPercentage(PnLService.calculatePercentage(pnlData.opex.seguros, pnlData.ingresos.totalIngresos))],
      ['Comisiones Delivery', formatCurrency(pnlData.opex.comisionesDelivery), formatPercentage(PnLService.calculatePercentage(pnlData.opex.comisionesDelivery, pnlData.ingresos.totalIngresos))],
      ['Otros Gastos', formatCurrency(pnlData.opex.otrosOpex), formatPercentage(PnLService.calculatePercentage(pnlData.opex.otrosOpex, pnlData.ingresos.totalIngresos))],
      ['TOTAL OPEX', formatCurrency(pnlData.opex.totalOpex), formatPercentage(pnlData.opex.opexPct)],
      [''],
      ['5. RESULTADOS'],
      ['MARGEN BRUTO', formatCurrency(pnlData.margen.margenBruto), formatPercentage(pnlData.margen.margenBrutoPct)],
      ['EBITDA', formatCurrency(pnlData.resultados.ebitda), formatPercentage(pnlData.resultados.ebitdaPct)],
      ['Gastos Financieros', formatCurrency(pnlData.resultados.financieros), formatPercentage(PnLService.calculatePercentage(pnlData.resultados.financieros, pnlData.ingresos.totalIngresos))],
      ['Amortizaciones', formatCurrency(pnlData.resultados.amortizaciones), formatPercentage(PnLService.calculatePercentage(pnlData.resultados.amortizaciones, pnlData.ingresos.totalIngresos))],
      ['BENEFICIO NETO', formatCurrency(pnlData.resultados.beneficioNeto), formatPercentage(pnlData.resultados.margenNetoPct)],
      [''],
      ['KPIs CLAVE'],
      ['Food Cost %', '', formatPercentage(pnlData.materias.foodCostPct)],
      ['Labor Cost %', '', formatPercentage(pnlData.personal.personalPct)],
      ['Prime Cost %', '', formatPercentage(pnlData.materias.foodCostPct + pnlData.personal.personalPct)],
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `P&L_${period.year}_${period.month + 1}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    showToast({
      type: 'success',
      title: 'Exportado',
      message: 'El P&L ha sido exportado correctamente',
    });
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // TABLE ROW RENDERER
  // ═══════════════════════════════════════════════════════════════════════════════

  interface TableRow {
    concepto: string;
    importe: number;
    porcentaje: number;
    isTotal?: boolean;
  }

  const tableColumns = [
    {
      key: 'concepto' as const,
      header: 'Concepto',
      render: (_: unknown, row: TableRow) => (
        <span style={{ fontWeight: row.isTotal ? '700' : '400' }}>{row.concepto}</span>
      )
    },
    {
      key: 'importe' as const,
      header: 'Importe',
      render: (_: unknown, row: TableRow) => formatCurrency(row.importe)
    },
    {
      key: 'porcentaje' as const,
      header: '% Ventas',
      render: (_: unknown, row: TableRow) => formatPercentage(row.porcentaje)
    },
  ];

  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════════

  // ═══════════════════════════════════════════════════════════════════════════════
  // MANUAL ENTRIES (R-12/R-13 Standardized)
  // ═══════════════════════════════════════════════════════════════════════════════

  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualEntry, setManualEntry] = useState<Partial<import('../types/pnl.types').PnLManualEntry>>({
    category: 'opex',
    concept: '',
    amount: 0,
  });

  const handleSaveManualEntry = () => {
    if (!manualEntry.concept || !manualEntry.amount || !manualEntry.category) {
      showToast({ type: 'error', title: 'Error', message: 'Faltan campos obligatorios' });
      return;
    }

    const targetRestaurantId = selectedRestaurantId === 'all'
      ? (currentRestaurant?.id || restaurants[0]?.id)
      : selectedRestaurantId;

    if (!targetRestaurantId) {
      console.error('No restaurant selected for manual adjustment');
      showToast({ type: 'error', title: 'Error', message: 'Selecciona un restaurante (o crea uno primero)' });
      return;
    }

    try {
      db.add('pnl_adjustments', {
        restaurantId: targetRestaurantId,
        period: `${period.year}-${period.month}`,
        category: manualEntry.category,
        concept: manualEntry.concept,
        amount: Number(manualEntry.amount),
        createdAt: new Date().toISOString(),
      } as any);

      showToast({ type: 'success', title: 'Guardado', message: 'Ajuste añadido correctamente' });
      setIsManualModalOpen(false);
      handleCalculate(); // Recalculate P&L
    } catch (error) {
      console.error(error);
      showToast({ type: 'error', title: 'Error', message: 'No se pudo guardar el ajuste' });
    }
  };

  return (
    <div style={{ padding: 'var(--spacing-lg)' }}>
      <PageHeader
        title="Cuenta de Explotación (P&L)"
        icon={<BarChart3 size={28} />}
        action={
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
            <Button onClick={() => setIsManualModalOpen(true)} variant="outline">
              <Plus size={16} /> Añadir Ajuste Manual
            </Button>
            {pnlData && (
              <Button onClick={handleExport} variant="secondary">
                <Download size={16} /> Exportar
              </Button>
            )}
            <Button onClick={handleCalculate} variant="primary">
              <Calendar size={16} /> Actualizar
            </Button>
          </div>
        }
      />

      {/* Manual Entry Modal - Using Standard Components */}
      {/* Manual Entry Modal - Using Standard Components */}
      <Modal
        open={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        title="Añadir Ajuste Manual"
        size="md"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-md)' }}>
            <Button onClick={() => setIsManualModalOpen(false)} variant="ghost">Cancelar</Button>
            <Button onClick={handleSaveManualEntry} variant="primary">Guardar Ajuste</Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <Select
            label="Categoría"
            value={manualEntry.category || 'opex'}
            onChange={(val) => setManualEntry(prev => ({ ...prev, category: val as any }))}
            options={[
              { value: 'revenue', label: 'Ingresos (Corrección)' },
              { value: 'cogs', label: 'COGS (Compras Extra)' },
              { value: 'labor', label: 'Personal (Extra/Bonus)' },
              { value: 'opex', label: 'Gastos Operativos' },
              { value: 'financial', label: 'Financiero/Amortización' },
            ]}
            fullWidth
          />

          <Input
            label="Concepto"
            value={manualEntry.concept || ''}
            onChange={(e) => setManualEntry(prev => ({ ...prev, concept: e.target.value }))}
            placeholder="Ej: Regularización de caja, Bonus trimestral..."
            fullWidth
          />

          <Input
            label="Importe (€)"
            type="number"
            value={manualEntry.amount || ''}
            onChange={(e) => setManualEntry(prev => ({ ...prev, amount: Number(e.target.value) }))}
            fullWidth
          />
        </div>
      </Modal>

      {/* Period Selectors - Using shared Select component (R-13) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 'var(--spacing-md)',
        marginBottom: 'var(--spacing-lg)',
      }}>
        <Select
          label="Modo de Visualización"
          value={viewType}
          onChange={(val) => setViewType(val as any)}
          options={viewOptions}
          fullWidth
        />
        <Select
          label="Período"
          value={`${period.year}-${period.month}`}
          onChange={(val) => {
            const [year, month] = val.split('-').map(Number);
            setPeriod({ year, month });
          }}
          options={monthYearOptions}
          fullWidth
        />
        {viewType === 'single' && (
          <Select
            label="Restaurante / Unidad"
            value={String(selectedRestaurantId)}
            onChange={(val) => setSelectedRestaurantId(val)}
            options={restaurantOptions}
            fullWidth
          />
        )}
      </div>

      {pnlData && (
        <>
          {/* KPI Cards - 6 cards with semantic colors */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 'var(--spacing-md)',
            marginBottom: 'var(--spacing-lg)',
          }}>
            <KPICard
              label="Total Ingresos"
              value={formatCurrency(pnlData.ingresos.totalIngresos)}
              subtitle={`${formatPercentage(pnlData.margen.margenBrutoPct)} margen bruto`}
              status="neutral"
              icon={<DollarSign size={16} />}
            />

            <KPICard
              label="Food Cost"
              value={formatPercentage(pnlData.materias.foodCostPct)}
              subtitle={`${formatCurrency(pnlData.materias.totalMaterias)} en materias`}
              status={getKPIStatus(pnlData.materias.foodCostPct, 'foodCost')}
              icon={<TrendingUp size={16} />}
            />

            <KPICard
              label="Labor Cost"
              value={formatPercentage(pnlData.personal.personalPct)}
              subtitle={`${formatCurrency(pnlData.personal.totalPersonal)} en personal`}
              status={getKPIStatus(pnlData.personal.personalPct, 'laborCost')}
              icon={<Users size={16} />}
            />

            <KPICard
              label="Prime Cost"
              value={formatPercentage(pnlData.materias.foodCostPct + pnlData.personal.personalPct)}
              subtitle="Food + Labor (objetivo: <60%)"
              status={getKPIStatus(pnlData.materias.foodCostPct + pnlData.personal.personalPct, 'primeCost')}
              icon={<TrendingUp size={16} />}
            />

            <KPICard
              label="EBITDA"
              value={formatCurrency(pnlData.resultados.ebitda)}
              subtitle={`${formatPercentage(pnlData.resultados.ebitdaPct)} de ingresos`}
              status={getKPIStatus(pnlData.resultados.ebitdaPct, 'ebitda')}
              icon={<Building size={16} />}
            />

            <KPICard
              label="Beneficio Neto"
              value={formatCurrency(pnlData.resultados.beneficioNeto)}
              subtitle={`${formatPercentage(pnlData.resultados.margenNetoPct)} margen neto`}
              status={pnlData.resultados.beneficioNeto >= 0 ? 'success' : 'danger'}
              icon={<DollarSign size={16} />}
            />
          </div>

          {/* P&L Sections */}
          <Card>
            {/* Section 1: Ingresos */}
            <FormSection title="1. Ingresos Operativos">
              <Table<TableRow>
                data={[
                  { concepto: 'Ventas Local', importe: pnlData.ingresos.ventasLocal, porcentaje: PnLService.calculatePercentage(pnlData.ingresos.ventasLocal, pnlData.ingresos.totalIngresos) },
                  { concepto: 'Ventas Delivery', importe: pnlData.ingresos.ventasDelivery, porcentaje: PnLService.calculatePercentage(pnlData.ingresos.ventasDelivery, pnlData.ingresos.totalIngresos) },
                  { concepto: 'TOTAL INGRESOS', importe: pnlData.ingresos.totalIngresos, porcentaje: 100, isTotal: true },
                ]}
                columns={tableColumns}
              />
            </FormSection>

            {/* Section 2: COGS */}
            <FormSection title="2. Coste de Materias (COGS)">
              <Table<TableRow>
                data={[
                  { concepto: 'Compras Comida', importe: pnlData.materias.comprasComida, porcentaje: PnLService.calculatePercentage(pnlData.materias.comprasComida, pnlData.ingresos.totalIngresos) },
                  { concepto: 'Compras Bebida', importe: pnlData.materias.comprasBebida, porcentaje: PnLService.calculatePercentage(pnlData.materias.comprasBebida, pnlData.ingresos.totalIngresos) },
                  { concepto: 'TOTAL MATERIAS', importe: pnlData.materias.totalMaterias, porcentaje: pnlData.materias.foodCostPct, isTotal: true },
                ]}
                columns={tableColumns}
              />
            </FormSection>

            {/* Section 3: Personal - NEW */}
            <FormSection title="3. Gastos de Personal">
              <Table<TableRow>
                data={[
                  { concepto: 'Salarios Brutos', importe: pnlData.personal.salarios, porcentaje: PnLService.calculatePercentage(pnlData.personal.salarios, pnlData.ingresos.totalIngresos) },
                  { concepto: 'Seguridad Social', importe: pnlData.personal.seguridadSocial, porcentaje: PnLService.calculatePercentage(pnlData.personal.seguridadSocial, pnlData.ingresos.totalIngresos) },
                  { concepto: 'TOTAL PERSONAL', importe: pnlData.personal.totalPersonal, porcentaje: pnlData.personal.personalPct, isTotal: true },
                ]}
                columns={tableColumns}
              />
            </FormSection>

            {/* Section 4: OPEX - NEW */}
            <FormSection title="4. Gastos Operativos (OPEX)">
              <Table<TableRow>
                data={[
                  { concepto: 'Alquiler', importe: pnlData.opex.alquiler, porcentaje: PnLService.calculatePercentage(pnlData.opex.alquiler, pnlData.ingresos.totalIngresos) },
                  { concepto: 'Suministros (Luz, Gas, Agua)', importe: pnlData.opex.suministros, porcentaje: PnLService.calculatePercentage(pnlData.opex.suministros, pnlData.ingresos.totalIngresos) },
                  { concepto: 'Servicios Externos', importe: pnlData.opex.servicios, porcentaje: PnLService.calculatePercentage(pnlData.opex.servicios, pnlData.ingresos.totalIngresos) },
                  { concepto: 'Marketing', importe: pnlData.opex.marketing, porcentaje: PnLService.calculatePercentage(pnlData.opex.marketing, pnlData.ingresos.totalIngresos) },
                  { concepto: 'Limpieza', importe: pnlData.opex.limpieza, porcentaje: PnLService.calculatePercentage(pnlData.opex.limpieza, pnlData.ingresos.totalIngresos) },
                  { concepto: 'Seguros', importe: pnlData.opex.seguros, porcentaje: PnLService.calculatePercentage(pnlData.opex.seguros, pnlData.ingresos.totalIngresos) },
                  { concepto: 'Comisiones Delivery', importe: pnlData.opex.comisionesDelivery, porcentaje: PnLService.calculatePercentage(pnlData.opex.comisionesDelivery, pnlData.ingresos.totalIngresos) },
                  { concepto: 'Otros Gastos', importe: pnlData.opex.otrosOpex, porcentaje: PnLService.calculatePercentage(pnlData.opex.otrosOpex, pnlData.ingresos.totalIngresos) },
                  { concepto: 'TOTAL OPEX', importe: pnlData.opex.totalOpex, porcentaje: pnlData.opex.opexPct, isTotal: true },
                ]}
                columns={tableColumns}
              />
            </FormSection>

            {/* Section 5: Resultados */}
            <FormSection title="5. Resultados">
              <Table<TableRow>
                data={[
                  { concepto: 'MARGEN BRUTO', importe: pnlData.margen.margenBruto, porcentaje: pnlData.margen.margenBrutoPct, isTotal: true },
                  { concepto: 'EBITDA', importe: pnlData.resultados.ebitda, porcentaje: pnlData.resultados.ebitdaPct, isTotal: true },
                  { concepto: 'Gastos Financieros', importe: pnlData.resultados.financieros, porcentaje: PnLService.calculatePercentage(pnlData.resultados.financieros, pnlData.ingresos.totalIngresos) },
                  { concepto: 'Amortizaciones', importe: pnlData.resultados.amortizaciones, porcentaje: PnLService.calculatePercentage(pnlData.resultados.amortizaciones, pnlData.ingresos.totalIngresos) },
                  { concepto: 'BENEFICIO NETO', importe: pnlData.resultados.beneficioNeto, porcentaje: pnlData.resultados.margenNetoPct, isTotal: true },
                ]}
                columns={tableColumns}
              />
            </FormSection>
          </Card>
        </>
      )}

      {viewType === 'comparison' && comparisonData && (
        <Card title="Comparativa Interactiva de Unidades">
          <div style={{ overflowX: 'auto' }}>
            <Table<any>
              columns={[
                { key: 'nombre', header: 'Restaurante' },
                { key: 'ingresos', header: 'Ventas' },
                { key: 'foodCost', header: 'Food Cost %' },
                { key: 'laborCost', header: 'Labor Cost %' },
                { key: 'primeCost', header: 'Prime Cost %' },
                { key: 'ebitda', header: 'EBITDA %' },
              ]}
              data={comparisonData.restaurants.map(r => ({
                id: r.restaurantId,
                nombre: <span style={{ fontWeight: '600' }}>{r.restaurantNombre}</span>,
                ingresos: formatCurrency(r.ingresos),
                foodCost: (
                  <span style={{ color: getKPIStatus(r.foodCost, 'foodCost') === 'danger' ? 'var(--danger)' : 'inherit', fontWeight: '500' }}>
                    {formatPercentage(r.foodCost)}
                  </span>
                ),
                laborCost: (
                  <span style={{ color: getKPIStatus(r.laborCostPct, 'laborCost') === 'danger' ? 'var(--danger)' : 'inherit', fontWeight: '500' }}>
                    {formatPercentage(r.laborCostPct)}
                  </span>
                ),
                primeCost: (
                  <span style={{ color: getKPIStatus(r.primeCostPct, 'primeCost') === 'danger' ? 'var(--danger)' : 'inherit', fontWeight: '600' }}>
                    {formatPercentage(r.primeCostPct)}
                  </span>
                ),
                ebitda: (
                  <span style={{ color: getKPIStatus(r.ebitda, 'ebitda') === 'danger' ? 'var(--danger)' : 'var(--success)', fontWeight: '700' }}>
                    {formatPercentage(r.ebitda)}
                  </span>
                ),
              }))}
            />
          </div>
        </Card>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Calculando resultados...</p>
        </div>
      )}

      {!pnlData && !comparisonData && !loading && (
        <Card style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
          <BarChart3 size={64} style={{ margin: '0 auto var(--spacing-lg)', color: 'var(--text-light)' }} />
          <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>Datos no disponibles</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)' }}>
            No se han encontrado registros para el período seleccionado.
          </p>
          <Button onClick={handleCalculate} variant="primary">Intentar Calcular</Button>
        </Card>
      )}
    </div>
  );
};
