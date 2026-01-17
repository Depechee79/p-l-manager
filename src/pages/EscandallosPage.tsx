import React, { useState, useMemo, useEffect } from 'react';
import { EscandalloList, EscandalloWizard, EscandalloFormData } from '../features/escandallos';
import { useToast } from '../utils/toast';
import { EscandalloService } from '../services/escandallo-service';
import type { Escandallo } from '@types';
import { useDatabase } from '@core';

export const EscandallosPage: React.FC = () => {
  const { showToast } = useToast();
  const { db } = useDatabase();

  // Estado de la lista (READ from DB)
  const escandallos = (db.escandallos || []) as Escandallo[];
  const [searchQuery, setSearchQuery] = useState('');
  const [monthFilter, setMonthFilter] = useState('');

  // Estado de navegación / edición
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [editingEscandallo, setEditingEscandallo] = useState<Escandallo | null>(null);
  const [loading, setLoading] = useState(false);

  // AUDIT-FIX: Ensure data is loaded (R-14)
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          db.ensureLoaded('escandallos'),
          db.ensureLoaded('productos') // Needed for ingredients
        ]);
      } catch (error) {
        console.error("Error loading EscandallosPage data:", error);
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

    // El filtrado por mes se implementará cuando el modelo tenga fecha
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
      // Calculate derived valus (costs, margins)
      const escandalloData = EscandalloService.recalculate({
        id: editingEscandallo?.id, // ID is handled by DB for new items usually, but here we might pass it if editing
        ...formData,
      });

      const validation = EscandalloService.validate(escandalloData);
      if (!validation.valid) {
        showToast({
          type: 'error',
          title: 'Error de validación',
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
    } catch (error) {
      console.error(error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo guardar el escandallo',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 'var(--spacing-lg)' }}>
      {viewMode === 'form' ? (
        <EscandalloWizard
          initialData={editingEscandallo}
          onSave={handleSave}
          onCancel={handleCloseForm}
          loading={loading}
        />
      ) : (
        <EscandalloList
          escandallos={filteredEscandallos}
          loading={loading}
          onEdit={handleOpenForm}
          onNew={() => handleOpenForm()}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          monthFilter={monthFilter}
          onMonthFilterChange={setMonthFilter}
        />
      )}
    </div>
  );
};
