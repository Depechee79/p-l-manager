import React, { useState } from 'react';
import { Button, Select, PageContainer, PageHeader, FilterBar, Input } from '@shared/components';
import { useDatabase } from '@core';
import { useInvoices } from '../hooks/useInvoices';
import { useProviders } from '../hooks/useProviders';
import { InvoiceForm, InvoicesList } from '@/features/invoices';
import { logger } from '@core/services/LoggerService';
import type { Invoice, InvoiceFormData } from '@/features/invoices';
import type { Product } from '@types';

export const InvoicesPage: React.FC = () => {
  const { db } = useDatabase();
  const {
    filteredInvoices,
    loading,
    error,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    filterByProvider,
    filterByPeriod,
    clearError
  } = useInvoices(db);

  const { providers } = useProviders(db);

  // AUDIT-FIX: Ensure data is loaded (R-14)
  React.useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          db.ensureLoaded('facturas'),
          db.ensureLoaded('proveedores'),
          db.ensureLoaded('productos')
        ]);
      } catch (error: unknown) {
        logger.error("Error loading InvoicesPage data:", error instanceof Error ? error.message : String(error));
      }
    };
    loadData();
  }, [db]);

  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [filterProvider, setFilterProvider] = useState<number | string | null>(null);
  const [filterPeriod, setFilterPeriod] = useState('');

  const handleOpenForm = () => {
    setEditingInvoice(null);
    setViewMode('form');
  };

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setViewMode('form');
  };

  const handleDelete = (invoice: Invoice) => {
    if (window.confirm(`¿Eliminar la factura ${invoice.numero}?`)) {
      deleteInvoice(invoice.id);
    }
  };

  const handleSave = (formData: InvoiceFormData) => {
    const provider = providers.find(p => p.id === formData.proveedorId);
    if (!provider) return;

    const invoiceData: Omit<Invoice, 'id'> = {
      tipo: formData.tipo,
      numero: formData.numeroFactura.trim(),
      proveedor: provider.nombre,
      proveedorNombre: provider.nombre,
      proveedorId: formData.proveedorId!,
      fecha: formData.fecha,
      total: formData.total,
      productos: formData.productos,
      metodoPago: formData.metodoPago?.trim() || undefined,
      notas: formData.notas?.trim() || undefined,
      status: 'pendiente'
    };

    if (editingInvoice) {
      updateInvoice(editingInvoice.id, invoiceData);
    } else {
      createInvoice(invoiceData);
    }

    // Actualizar Catálogo de Productos (Lógica Crítica R-08)
    formData.productos.forEach(prod => {
      if (!prod.nombre) return;

      const existingProduct = (db.productos as Product[]).find(p =>
        p.nombre.toLowerCase() === prod.nombre.toLowerCase()
      );

      if (existingProduct) {
        // Actualizar precio de compra del producto existente
        db.update<Product>('productos', existingProduct.id, {
          precioCompra: prod.precioUnitario,
          ultimaFechaCompra: formData.fecha,
          proveedorId: formData.proveedorId || existingProduct.proveedorId
        });
      } else {
        // Crear nuevo producto automáticamente
        db.add<Product>('productos', {
          nombre: prod.nombre,
          categoria: 'General',
          proveedor: provider.nombre,
          proveedorId: formData.proveedorId!,
          unidadBase: prod.unidad,
          precioCompra: prod.precioUnitario,
          esEmpaquetado: false,
          stockActualUnidades: 0,
          ultimaFechaCompra: formData.fecha
        } as Omit<Product, 'id'>);
      }
    });

    setViewMode('list');
  };

  const handleFilterProvider = (providerId: string) => {
    const id = providerId ? parseInt(providerId) : null;
    setFilterProvider(id);
    filterByProvider(id || null);
  };

  const handleFilterPeriod = (period: string) => {
    setFilterPeriod(period);
    if (period) {
      const [year, month] = period.split('-');
      const startDate = `${year}-${month}-01`;
      const endDate = `${year}-${month}-31`; // Simplificación segura para filtro
      filterByPeriod(startDate, endDate);
    } else {
      filterByPeriod('', '');
    }
  };

  return (
    <PageContainer>
      {error && (
        <div style={{
          padding: '12px 16px',
          marginBottom: '16px',
          backgroundColor: 'var(--danger-bg)',
          border: '1px solid var(--danger-border)',
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: 'var(--danger)'
        }}>
          <span>{error}</span>
          <Button variant="secondary" size="sm" onClick={clearError}>✕</Button>
        </div>
      )}

      {viewMode === 'list' ? (
        <>
          <PageHeader
            title="Facturas"
            description="Gestión de facturas y albaranes de proveedores"
            action={
              <Button onClick={handleOpenForm} variant="primary">
                ➕ Nueva Factura
              </Button>
            }
          />

          <FilterBar>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)', width: '100%' }}>
              <Select
                value={filterProvider?.toString() || ''}
                onChange={handleFilterProvider}
                label="Proveedor"
                options={[
                  { value: '', label: 'Todos los proveedores' },
                  ...providers.map(provider => ({
                    value: provider.id.toString(),
                    label: provider.nombre
                  }))
                ]}
                placeholder="Todos los proveedores"
                fullWidth
              />
              <Input
                type="month"
                label="Período"
                value={filterPeriod}
                onChange={(e) => handleFilterPeriod(e.target.value)}
                fullWidth
              />
            </div>
          </FilterBar>

          <InvoicesList
            invoices={filteredInvoices}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </>
      ) : (
        <InvoiceForm
          initialData={editingInvoice}
          providers={providers}
          onSave={handleSave}
          onCancel={() => setViewMode('list')}
        />
      )}
    </PageContainer>
  );
};
