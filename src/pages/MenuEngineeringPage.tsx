import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Download,
  AlertCircle,
  Search,
  BarChart3,
  Star,
  TrendingDown,
} from 'lucide-react';
import { Button, Input, Select, Table, Card, DatePicker } from '@shared/components';
import { useDatabase } from '@core';
import { useToast } from '../utils/toast';
import { formatCurrency } from '../utils/formatters';
import type { Escandallo, Cierre } from '@types';

interface MenuItemAnalysis {
  id: string | number;
  nombre: string;
  margenBrutoPct: number;
  margenBruto: number;
  popularidad: number;
  categoria: 'star' | 'plow_horse' | 'puzzle' | 'dog';
  recomendacion: string;
  ventasEstimadas?: number;
  ingresosTotales?: number;
}

type CategoryFilter = 'all' | 'star' | 'plow_horse' | 'puzzle' | 'dog';

export const MenuEngineeringPage: React.FC = () => {
  const { db } = useDatabase();
  const { showToast } = useToast();

  // AUDIT-FIX: Ensure data is loaded (R-14)
  React.useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          db.ensureLoaded('escandallos'),
          db.ensureLoaded('cierres')
        ]);
      } catch (error) {
        console.error("Error loading MenuEngineeringPage data:", error);
      }
    };
    loadData();
  }, [db]);

  const [startDate, setStartDate] = useState<string>(
    new Date(new Date().setDate(1)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

  const escandallos = db.escandallos as Escandallo[];
  const cierres = db.cierres as Cierre[];

  const menuAnalysis = useMemo(() => {
    const relevantEscandallos = escandallos.filter(e => {
      const fecha = (e as any).fecha;
      if (fecha) {
        return fecha >= startDate && fecha <= endDate;
      }
      return true;
    });

    const margins = relevantEscandallos.map(e => e.margenBrutoPct || 0);
    const avgMargin = margins.length > 0
      ? margins.reduce((sum, m) => sum + m, 0) / margins.length
      : 0;

    const totalSales = cierres
      .filter(c => c.fecha >= startDate && c.fecha <= endDate)
      .reduce((sum, c) => sum + (c.totalReal || 0), 0);

    const estimatedSalesPerItem = totalSales / Math.max(relevantEscandallos.length, 1);
    const avgPopularity = estimatedSalesPerItem;

    return relevantEscandallos.map(escandallo => {
      const margenBruto = escandallo.margenBrutoPct || 0;
      const margenBrutoValue = (escandallo.pvpNeto || 0) - (escandallo.costeTotalNeto || 0);

      const popularidad = estimatedSalesPerItem * (1 + (35 - (escandallo.foodCostPct || 0)) / 100);
      const ventasEstimadas = Math.round(popularidad);
      const ingresosTotales = ventasEstimadas * (escandallo.pvpConIVA || 0);

      let categoria: MenuItemAnalysis['categoria'];
      let recomendacion: string;

      const isHighMargin = margenBruto >= avgMargin;
      const isHighPopularity = popularidad >= avgPopularity;

      if (isHighMargin && isHighPopularity) {
        categoria = 'star';
        recomendacion = 'Mantener y promocionar. Producto estrella.';
      } else if (!isHighMargin && isHighPopularity) {
        categoria = 'plow_horse';
        recomendacion = 'Revisar costes o aumentar precio. Muy popular pero poco rentable.';
      } else if (isHighMargin && !isHighPopularity) {
        categoria = 'puzzle';
        recomendacion = 'Promocionar más. Rentable pero poco conocido.';
      } else {
        categoria = 'dog';
        recomendacion = 'Considerar eliminar o reformular. Baja rentabilidad y popularidad.';
      }

      return {
        id: escandallo.id,
        nombre: escandallo.nombre,
        margenBrutoPct: margenBruto,
        margenBruto: margenBrutoValue,
        popularidad,
        categoria,
        recomendacion,
        ventasEstimadas,
        ingresosTotales,
      } as MenuItemAnalysis;
    }).sort((a, b) => {
      const categoryOrder = { star: 0, puzzle: 1, plow_horse: 2, dog: 3 };
      return categoryOrder[a.categoria] - categoryOrder[b.categoria];
    });
  }, [escandallos, cierres, startDate, endDate]);

  const filteredAnalysis = useMemo(() => {
    let filtered = menuAnalysis;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.nombre.toLowerCase().includes(query) ||
        item.recomendacion.toLowerCase().includes(query)
      );
    }
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.categoria === categoryFilter);
    }
    return filtered;
  }, [menuAnalysis, searchQuery, categoryFilter]);

  const categoryStats = useMemo(() => {
    const stats = { star: 0, plow_horse: 0, puzzle: 0, dog: 0 };
    menuAnalysis.forEach(item => {
      stats[item.categoria]++;
    });
    return stats;
  }, [menuAnalysis]);

  const getCategoryIcon = (categoria: MenuItemAnalysis['categoria']) => {
    switch (categoria) {
      case 'star': return <Star size={16} color="var(--warning)" />;
      case 'plow_horse': return <TrendingDown size={16} color="var(--info)" />;
      case 'puzzle': return <TrendingUp size={16} color="var(--success)" />;
      case 'dog': return <AlertCircle size={16} color="var(--danger)" />;
    }
  };

  const getCategoryLabel = (categoria: MenuItemAnalysis['categoria']) => {
    switch (categoria) {
      case 'star': return 'Estrella';
      case 'plow_horse': return 'Caballo de Trabajo';
      case 'puzzle': return 'Rompecabezas';
      case 'dog': return 'Perro';
    }
  };

  const getCategoryColor = (categoria: MenuItemAnalysis['categoria']) => {
    switch (categoria) {
      case 'star': return 'var(--warning)';
      case 'plow_horse': return 'var(--info)';
      case 'puzzle': return 'var(--success)';
      case 'dog': return 'var(--danger)';
    }
  };

  const exportAnalysis = () => {
    const csv = [
      ['Nombre', 'Categoría', 'Margen %', 'Margen €', 'Popularidad', 'Ventas Est.', 'Ingresos Tot.', 'Recomendación'],
      ...filteredAnalysis.map(item => [
        item.nombre,
        getCategoryLabel(item.categoria),
        `${item.margenBrutoPct.toFixed(1)}%`,
        formatCurrency(item.margenBruto),
        item.popularidad.toFixed(0),
        item.ventasEstimadas?.toString() || '0',
        formatCurrency(item.ingresosTotales || 0),
        item.recomendacion,
      ]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `menu-engineering-${startDate}-${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    showToast({
      type: 'success',
      title: 'Análisis exportado',
      message: 'El análisis ha sido exportado correctamente',
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 'var(--font-size-2xl)', fontWeight: '700', color: 'var(--text-main)' }}>
            Ingeniería de Menú
          </h1>
          <p style={{ margin: 'var(--spacing-xs) 0 0', color: 'var(--text-secondary)', fontSize: 'var(--font-size-base)' }}>
            Análisis de rentabilidad y popularidad de platos (Matriz Stars/Dogs)
          </p>
        </div>
        <Button variant="secondary" onClick={exportAnalysis}>
          <Download size={16} /> Exportar
        </Button>
      </div>

      <Card>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)' }}>
          <DatePicker label="Fecha Inicio" value={startDate} onChange={setStartDate} />
          <DatePicker label="Fecha Fin" value={endDate} onChange={setEndDate} />
          <Input placeholder="Buscar platos..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} icon={<Search size={18} />} iconPosition="left" />
          <Select label="Categoría" value={categoryFilter} onChange={(v) => setCategoryFilter(v as CategoryFilter)} options={[
            { value: 'all', label: 'Todas' },
            { value: 'star', label: 'Estrella' },
            { value: 'plow_horse', label: 'Caballo de Trabajo' },
            { value: 'puzzle', label: 'Rompecabezas' },
            { value: 'dog', label: 'Perro' },
          ]} />
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)' }}>
        {(['star', 'puzzle', 'plow_horse', 'dog'] as const).map(cat => (
          <Card key={cat} style={{ border: `2px solid ${getCategoryColor(cat)}`, backgroundColor: `${getCategoryColor(cat)}-lighter` as any }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xs)' }}>{getCategoryLabel(cat)}s</div>
                <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700', color: getCategoryColor(cat) }}>{categoryStats[cat]}</div>
              </div>
              {getCategoryIcon(cat)}
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <Table
          data={filteredAnalysis}
          columns={[
            {
              key: 'categoria', header: 'Categoría', render: (_, item) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                  {getCategoryIcon(item.categoria)}
                  <span style={{ fontWeight: '600', color: getCategoryColor(item.categoria) }}>{getCategoryLabel(item.categoria)}</span>
                </div>
              ), sortable: true
            },
            { key: 'nombre', header: 'Plato', render: (_, item) => <span style={{ fontWeight: '500', color: 'var(--text-main)' }}>{item.nombre}</span>, sortable: true },
            {
              key: 'margenBrutoPct', header: 'Margen %', render: (_, item) => (
                <span style={{ fontWeight: '600', color: item.margenBrutoPct >= 50 ? 'var(--success)' : item.margenBrutoPct >= 30 ? 'var(--warning)' : 'var(--danger)' }}>{item.margenBrutoPct.toFixed(1)}%</span>
              ), sortable: true
            },
            { key: 'margenBruto', header: 'Margen €', render: (_, item) => formatCurrency(item.margenBruto), sortable: true },
            {
              key: 'popularidad', header: 'Popularidad', render: (_, item) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                  <BarChart3 size={14} color="var(--text-secondary)" />
                  <span>{item.popularidad.toFixed(0)}</span>
                </div>
              ), sortable: true
            },
            { key: 'ventasEstimadas', header: 'Ventas Est.', render: (_, item) => item.ventasEstimadas?.toLocaleString() || '0', sortable: true },
            { key: 'ingresosTotales', header: 'Ingresos Tot.', render: (_, item) => formatCurrency(item.ingresosTotales || 0), sortable: true },
          ]}
          hoverable
          striped
        />
      </Card>
    </div>
  );
};
