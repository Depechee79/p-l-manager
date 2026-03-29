/**
 * EscandallosPage - Recipes and Menu Engineering
 *
 * Session 007: Updated with design system
 * - Removed StickyPageHeader (title shown in topbar breadcrumb)
 * - Using PageLayout for sticky tabs/filters
 * - ActionHeader with tabs
 */
import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ClipboardList, BarChart3, Plus } from 'lucide-react';
import { EscandalloList, EscandalloWizard, EscandalloFormData, MenuAnalysisTab } from '../features/escandallos';
import { PageContainer, PageLayout, ActionHeader, Button, type Tab } from '@shared/components';
import { useToast } from '../utils/toast';
import { EscandalloService } from '../services/escandallo-service';
import type { Escandallo } from '@types';
import { useDatabase } from '@core';
import { logger } from '@core/services/LoggerService';

type TabId = 'recetas' | 'analisis';

// Tabs with icons
const TABS: Tab[] = [
  { id: 'recetas', label: 'Escandallos', icon: <ClipboardList size={16} /> },
  { id: 'analisis', label: 'Análisis Menú', icon: <BarChart3 size={16} /> },
];

export const EscandallosPage: React.FC = () => {
  const { showToast } = useToast();
  const { db } = useDatabase();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab state - read from URL query param
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<TabId>(
    tabParam === 'analisis' ? 'analisis' : 'recetas'
  );

  // Update URL when tab changes
  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    if (tab === 'analisis') {
      setSearchParams({ tab: 'analisis' });
    } else {
      setSearchParams({});
    }
  };

  // Estado de la lista (READ from DB)
  const escandallos = (db.escandallos || []) as Escandallo[];
  const [searchQuery, setSearchQuery] = useState('');
  const [monthFilter, setMonthFilter] = useState('');

  // Estado de navegacion / edicion
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [editingEscandallo, setEditingEscandallo] = useState<Escandallo | null>(null);
  const [loading, setLoading] = useState(false);

  // AUDIT-FIX: Ensure data is loaded (R-14)
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          db.ensureLoaded('escandallos'),
          db.ensureLoaded('productos'), // Needed for ingredients
          db.ensureLoaded('cierres'), // Needed for menu analysis
        ]);
      } catch (error: unknown) {
        logger.error('Error loading EscandallosPage data:', error);
      }
    };
    loadData();
  }, [db]);

  // Filtrado de escandallos
  const filteredEscandallos = useMemo(() => {
    let filtered = escandallos;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(e =>
        e.nombre.toLowerCase().includes(query) ||
        e.descripcion?.toLowerCase().includes(query) ||
        e.ingredientes.some(i => i.nombre.toLowerCase().includes(query))
      );
    }

    // El filtrado por mes se implementara cuando el modelo tenga fecha
    return filtered;
  }, [escandallos, searchQuery]);

  const handleOpenForm = (escandallo: Escandallo | null = null) => {
    setEditingEscandallo(escandallo);
    setViewMode('form');
  };

  const handleCloseForm = () => {
    setEditingEscandallo(null);
    setViewMode('list');
  };

  const handleSave = async (formData: EscandalloFormData) => {
    setLoading(true);
    try {
      // Calculate derived values (costs, margins)
      const escandalloData = EscandalloService.recalculate({
        id: editingEscandallo?.id,
        ...formData,
      });

      const validation = EscandalloService.validate(escandalloData);
      if (!validation.valid) {
        showToast({
          type: 'error',
          title: 'Error de validacion',
          message: validation.errors.join(', '),
        });
        setLoading(false);
        return;
      }

      if (editingEscandallo) {
        // UPDATE
        await db.update('escandallos', editingEscandallo.id, escandalloData);
        showToast({
          type: 'success',
          title: 'Escandallo actualizado',
          message: `El escandallo "${escandalloData.nombre}" ha sido actualizado correctamente`,
        });
      } else {
        // CREATE
        await db.add('escandallos', escandalloData);
        showToast({
          type: 'success',
          title: 'Escandallo creado',
          message: `El escandallo "${escandalloData.nombre}" ha sido creado correctamente`,
        });
      }

      handleCloseForm();
    } catch (error: unknown) {
      logger.error('Error saving escandallo:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo guardar el escandallo',
      });
    } finally {
      setLoading(false);
    }
  };

  // Form mode - no sticky header
  if (viewMode === 'form') {
    return (
      <PageContainer>
        <EscandalloWizard
          initialData={editingEscandallo}
          onSave={handleSave}
          onCancel={handleCloseForm}
          loading={loading}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageLayout
        header={
          <ActionHeader
            tabs={TABS}
            activeTab={activeTab}
            onTabChange={(id) => handleTabChange(id as TabId)}
            actions={activeTab === 'recetas' ? (
              <Button variant="primary" icon={<Plus size={16} />} onClick={() => handleOpenForm()}>
                Nuevo Escandallo
              </Button>
            ) : undefined}
          />
        }
      >
        {activeTab === 'recetas' ? (
          <EscandalloList
            escandallos={filteredEscandallos}
            loading={loading}
            onEdit={handleOpenForm}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            monthFilter={monthFilter}
            onMonthFilterChange={setMonthFilter}
          />
        ) : (
          <MenuAnalysisTab />
        )}
      </PageLayout>
    </PageContainer>
  );
};
