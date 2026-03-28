import React, { useState } from 'react';
import { useDatabase } from '@core';
import { logger } from '@core/services/LoggerService';
import { useProviders } from '@hooks';
import { useToast } from '../utils/toast';
import type { Provider } from '@types';
import { ProvidersList, ProviderForm, type ProviderFormData } from '@/features/providers';

export const ProvidersPage: React.FC = () => {
  const { db } = useDatabase();
  const {
    filteredProviders: allProviders,
    loading,
    error,
    createProvider,
    updateProvider,
    deleteProvider,
    clearError,
  } = useProviders(db);

  const { showToast } = useToast();

  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);

  const handleOpenForm = (provider?: Provider) => {
    setEditingProvider(provider || null);
    setViewMode('form');
  };

  const handleCloseForm = () => {
    setViewMode('list');
    setEditingProvider(null);
    clearError();
  };

  const handleSubmit = async (data: ProviderFormData) => {
    try {
      if (editingProvider) {
        await updateProvider(editingProvider.id, data);
        showToast({
          type: 'success',
          title: 'Proveedor actualizado',
          message: `El proveedor ${data.nombre} ha sido actualizado correctamente`,
        });
      } else {
        await createProvider(data);
        showToast({
          type: 'success',
          title: 'Proveedor creado',
          message: `El proveedor ${data.nombre} ha sido creado correctamente`,
        });
      }
      handleCloseForm();
    } catch (saveError: unknown) {
      logger.error('Error saving provider:', saveError instanceof Error ? saveError.message : String(saveError));
      showToast({
        type: 'error',
        title: 'Error',
        message: saveError instanceof Error ? saveError.message : 'No se pudo guardar el proveedor',
      });
    }
  };

  const handleDelete = async (provider: Provider) => {
    if (window.confirm(`¿Está seguro de que desea eliminar el proveedor "${provider.nombre}"?`)) {
      try {
        await deleteProvider(provider.id);
        showToast({
          type: 'success',
          title: 'Proveedor eliminado',
          message: `El proveedor ${provider.nombre} ha sido eliminado correctamente`,
        });
      } catch (deleteError: unknown) {
        logger.error('Error deleting provider:', deleteError instanceof Error ? deleteError.message : String(deleteError));
        showToast({
          type: 'error',
          title: 'Error',
          message: 'No se pudo eliminar el proveedor',
        });
      }
    }
  };

  return (
    <div style={{ padding: 'var(--spacing-md)' }}>
      {error && (
        <div
          style={{
            padding: 'var(--spacing-md)',
            marginBottom: 'var(--spacing-md)',
            backgroundColor: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
            borderRadius: 'var(--radius)',
            color: 'var(--danger)',
          }}
        >
          {error}
        </div>
      )}

      {viewMode === 'form' ? (
        <ProviderForm
          initialData={editingProvider}
          onSave={handleSubmit}
          onCancel={handleCloseForm}
          loading={loading}
        />
      ) : (
        <ProvidersList
          providers={allProviders}
          loading={loading}
          onEdit={handleOpenForm}
          onDelete={handleDelete}
          onNew={() => handleOpenForm()}
        />
      )}
    </div>
  );
};
