import React, { useState } from 'react';
import { Button, PageContainer, PageHeader } from '@shared/components';
import { useFinance } from '../hooks/useFinance';
import { useDatabase } from '@core';
import type { Cierre } from '@types';
import { ClosingList, ClosingWizard } from '@/features/cierres';

export const CierresPage: React.FC = () => {
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

  // AUDIT-FIX: Ensure data is loaded (R-14)
  React.useEffect(() => {
    const loadData = async () => {
      try {
        await db.ensureLoaded('cierres');
      } catch (error) {
        console.error("Error loading CierresPage data:", error);
      }
    };
    loadData();
  }, [db]);

  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [editingCierre, setEditingCierre] = useState<Cierre | null>(null);
  const [filterPeriod, setFilterPeriod] = useState(new Date().toISOString().substring(0, 7)); // YYYY-MM

  // Apply initial filter
  React.useEffect(() => {
    handleFilterPeriod(filterPeriod);
  }, []);

  // The hook already provides filteredClosings based on the period filter applied in handleFilterPeriod

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

  const handleSubmit = async (data: any) => {
    try {
      if (editingCierre) {
        await updateClosing(Number(editingCierre.id), data);
      } else {
        await createClosing(data);
      }
      setViewMode('list');
    } catch (err) {
      console.error('Error saving closing:', err);
    }
  };

  return (
    <PageContainer>
      {error && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: '16px',
            backgroundColor: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span style={{ color: 'var(--danger)' }}>{error}</span>
          <Button variant="secondary" size="sm" onClick={clearError}>
            ✕
          </Button>
        </div>
      )}

      {viewMode === 'list' && (
        <PageHeader
          title="Cierres de Caja"
          description="Gestión de cierres y arqueos de caja"
        />
      )}

      {viewMode === 'form' ? (
        <ClosingWizard
          initialData={editingCierre}
          onSave={handleSubmit}
          onCancel={() => setViewMode('list')}
        />
      ) : (
        <ClosingList
          closings={filteredClosings}
          loading={loading}
          filterPeriod={filterPeriod}
          onFilterChange={handleFilterPeriod}
          onNewClosing={handleOpenForm}
          onEditClosing={handleEdit}
          onDeleteClosing={handleDelete}
        />
      )}
    </PageContainer>
  );
};
