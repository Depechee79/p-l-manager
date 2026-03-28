/**
 * CierresPage - Cash Closings Management
 *
 * Session 007: Updated with V2 design system
 * - PageLayoutV2 for proper scroll behavior
 * - ActionHeaderV2 with buttons
 * - FilterCardV2 for period filter
 * - DataCardV2 for empty/loading states
 */
import { useState, useEffect, type FC } from 'react';
import { Plus } from 'lucide-react';
import { PageContainer, PageLayoutV2, ActionHeaderV2, ButtonV2 } from '@shared/components';
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

  const handleDelete = async (cierre: Cierre) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este cierre?')) {
      await deleteClosing(Number(cierre.id));
    }
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

  // Form view - outside PageLayoutV2 since it has its own header
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
      <PageLayoutV2
        header={
          <ActionHeaderV2
            actions={
              <ButtonV2 variant="primary" icon={<Plus size={16} />} onClick={handleOpenForm}>
                Nuevo Cierre
              </ButtonV2>
            }
          />
        }
      >
        {error && (
          <div className="px-4 py-3 mb-4 bg-[var(--danger-light)] border border-[var(--border)] rounded-lg flex justify-between items-center">
            <span className="text-danger">{error}</span>
            <ButtonV2 variant="ghost" onClick={clearError}>
              ✕
            </ButtonV2>
          </div>
        )}

        <ClosingList
          closings={filteredClosings}
          loading={loading}
          filterPeriod={filterPeriod}
          onFilterChange={handleFilterPeriod}
          onEditClosing={handleEdit}
          onDeleteClosing={handleDelete}
        />
      </PageLayoutV2>
    </PageContainer>
  );
};
