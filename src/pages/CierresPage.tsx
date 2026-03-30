/**
 * CierresPage - Cash Closings Management
 *
 * Session 007: Updated with design system
 * - PageLayout for proper scroll behavior
 * - ActionHeader with buttons
 * - FilterCard for period filter
 * - DataCard for empty/loading states
 */
import { useState, useEffect, type FC } from 'react';
import { Plus } from 'lucide-react';
import { PageContainer, PageLayout, ActionHeader, Button, ConfirmDialog } from '@shared/components';
import { logger } from '@core/services/LoggerService';
import { useFinance } from '../hooks/useFinance';
import { useDatabase } from '@core';
import type { Cierre } from '@types';
import { ClosingList, ClosingWizard } from '@/features/cierres';

export const CierresPage: FC = () => {
  const { db } = useDatabase();
  const {
    filteredClosings,
    loading,
    error,
    createClosing,
    updateClosing,
    deleteClosing,
    filterByPeriod,
    clearError,
  } = useFinance(db);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await db.ensureLoaded('cierres');
      } catch (error: unknown) {
        logger.error("Error loading CierresPage data:", error);
      }
    };
    loadData();
  }, [db]);

  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [editingCierre, setEditingCierre] = useState<Cierre | null>(null);
  const [filterPeriod, setFilterPeriod] = useState(new Date().toISOString().substring(0, 7));
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    onConfirm: () => void;
  }>({ open: false, onConfirm: () => {} });

  // Apply initial filter
  useEffect(() => {
    handleFilterPeriod(filterPeriod);
  }, []);

  const handleFilterPeriod = (period: string) => {
    setFilterPeriod(period);
    if (!period) return;
    const [year, month] = period.split('-');
    const startDate = `${year}-${month}-01`;
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
    const endDate = `${year}-${month}-${lastDay}`;
    filterByPeriod(startDate, endDate);
  };

  const handleOpenForm = () => {
    setEditingCierre(null);
    setViewMode('form');
  };

  const handleEdit = (cierre: Cierre) => {
    setEditingCierre(cierre);
    setViewMode('form');
  };

  const handleDelete = (cierre: Cierre) => {
    setConfirmState({
      open: true,
      onConfirm: async () => {
        await deleteClosing(Number(cierre.id));
      },
    });
  };

  const handleSubmit = async (data: Omit<Cierre, 'id'>) => {
    try {
      if (editingCierre) {
        await updateClosing(Number(editingCierre.id), data);
      } else {
        await createClosing(data);
      }
      setViewMode('list');
    } catch (error: unknown) {
      logger.error('Error saving closing:', error);
    }
  };

  // Form view - outside PageLayout since it has its own header
  if (viewMode === 'form') {
    return (
      <PageContainer>
        <ClosingWizard
          initialData={editingCierre}
          onSave={handleSubmit}
          onCancel={() => setViewMode('list')}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageLayout
        header={
          <ActionHeader
            actions={
              <Button variant="primary" icon={<Plus size={16} />} onClick={handleOpenForm} className="w-full md:w-auto">
                Nuevo Cierre
              </Button>
            }
          />
        }
      >
        {error && (
          <div className="px-4 py-3 mb-4 bg-[var(--danger-light)] border border-[var(--border)] rounded-lg flex justify-between items-center">
            <span className="text-danger">{error}</span>
            <Button variant="ghost" onClick={clearError}>
              ✕
            </Button>
          </div>
        )}

        <ClosingList
          closings={filteredClosings}
          loading={loading}
          filterPeriod={filterPeriod}
          onFilterChange={handleFilterPeriod}
          onEditClosing={handleEdit}
          onDeleteClosing={handleDelete}
          onNewClosing={handleOpenForm}
        />
      </PageLayout>
        <ConfirmDialog
          open={confirmState.open}
          onClose={() => setConfirmState(prev => ({ ...prev, open: false }))}
          onConfirm={() => { confirmState.onConfirm(); setConfirmState(prev => ({ ...prev, open: false })); }}
          title="Eliminar cierre"
          description="¿Estás seguro de que deseas eliminar este cierre?"
          variant="danger"
          confirmLabel="Eliminar"
        />
    </PageContainer>
  );
};
