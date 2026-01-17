import React, { useState, useMemo } from 'react';
import { InventoryList, InventoryWizard, InventoryFormData } from '../features/inventarios';
import { useDatabase } from '@core';
import { useToast } from '../utils/toast';
import { formatDate } from '../utils/formatters';
import type { InventoryItem, InventoryProductCount, Product } from '@types';

export const InventariosPage: React.FC = () => {
  const { db } = useDatabase();
  const { showToast } = useToast();

  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [editingInventory, setEditingInventory] = useState<InventoryItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // AUDIT-FIX: Ensure data is loaded (R-14)
  React.useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        db.ensureLoaded('inventarios'),
        db.ensureLoaded('productos')
      ]);
    };
    loadData();
  }, [db]);

  // Get all inventories from DB
  const inventories = (db.inventarios || []) as InventoryItem[];

  // Filter inventories for the list
  const filteredInventories = useMemo(() => {
    let filtered = inventories;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(inv =>
        inv.nombre?.toLowerCase().includes(query) ||
        formatDate(inv.fecha).toLowerCase().includes(query)
      );
    }

    return filtered.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [inventories, searchQuery]);

  const handleOpenForm = (inventory: InventoryItem | null = null) => {
    setEditingInventory(inventory);
    setViewMode('form');
  };

  const handleCloseForm = () => {
    setEditingInventory(null);
    setViewMode('list');
  };

  const handleDelete = (inventory: InventoryItem) => {
    if (window.confirm(`¿Eliminar el inventario del ${formatDate(inventory.fecha)}?`)) {
      try {
        db.delete('inventarios', inventory.id as number);
        showToast({
          type: 'success',
          title: 'Inventario eliminado',
          message: 'El inventario ha sido eliminado correctamente',
        });
      } catch (error) {
        showToast({
          type: 'error',
          title: 'Error',
          message: 'No se pudo eliminar el inventario',
        });
      }
    }
  };

  const handleSave = async (formData: InventoryFormData) => {
    if (formData.productos.length === 0) {
      showToast({
        type: 'warning',
        title: 'Sin productos',
        message: 'Debes contar al menos un producto',
      });
      return;
    }

    setLoading(true);
    try {
      // Calculate differences and totals
      const productosDetalle: InventoryProductCount[] = formData.productos.map(pc => {
        const product = db.productos?.find(p => p.id === pc.productoId) as Product;
        const stockTeorico = product?.stockActualUnidades || 0;
        const stockReal = pc.metodo === 'total'
          ? (pc.cantidadTotal || 0)
          : (pc.cantidadPack || 0) * (pc.unidadesPorPack || 1);
        const diferencia = stockReal - stockTeorico;
        const valorDiferencia = diferencia * (product?.precioCompra || 0);

        return {
          productoId: pc.productoId,
          nombre: pc.nombre,
          stockTeorico,
          stockReal,
          diferencia,
          valorDiferencia,
          precioCompra: product?.precioCompra || 0,
        };
      });

      const inventario: Omit<InventoryItem, 'id'> & { id?: number } = {
        fecha: formData.fecha,
        productos: productosDetalle,
        totalItems: productosDetalle.length,
        valorTotal: productosDetalle.reduce((sum, p) => sum + p.valorDiferencia, 0),
        notas: formData.notas,
        // Custom fields (using any to bypass strict type if needed, but keeping labels clear)
        nombre: formData.nombre,
        persona: formData.persona,
        zona: formData.zona,
      } as any;

      if (editingInventory) {
        db.update('inventarios', editingInventory.id as number, inventario);
        showToast({
          type: 'success',
          title: 'Inventario actualizado',
          message: `El inventario "${formData.nombre}" ha sido actualizado`,
        });
      } else {
        db.add('inventarios', inventario);
        showToast({
          type: 'success',
          title: 'Inventario creado',
          message: `El inventario "${formData.nombre}" ha sido creado`,
        });
      }

      handleCloseForm();
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo guardar el inventario',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 'var(--spacing-lg)' }}>
      {viewMode === 'form' ? (
        <InventoryWizard
          initialData={editingInventory}
          onSave={handleSave}
          onCancel={handleCloseForm}
          loading={loading}
        />
      ) : (
        <InventoryList
          inventories={filteredInventories}
          onNew={() => handleOpenForm()}
          onEdit={handleOpenForm}
          onDelete={handleDelete}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          loading={loading}
        />
      )}
    </div>
  );
};
