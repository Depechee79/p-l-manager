import React, { useState, useEffect, useMemo } from 'react';
import {
  Trash2,
  Plus,
  Search,
  Edit,
  Save
} from 'lucide-react';
import { Button, Input, Select, Table, Card, FormSection, DatePicker, ConfirmDialog } from '@shared/components';
import { formatDateOnly } from '@shared/utils/dateUtils';
import { useDatabase, useRestaurant } from '@core';
import { useToast } from '../utils/toast';
import { formatCurrency, formatDate } from '../utils/formatters';
import { logger } from '@core/services/LoggerService';
import type { Product, Merma, Worker, InventoryZone } from '../types';

export const MermasPage: React.FC = () => {
  const { db } = useDatabase();
  const { showToast } = useToast();
  const { currentRestaurant } = useRestaurant();

  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [editingMerma, setEditingMerma] = useState<Merma | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Confirm dialog state for delete
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pendingDeleteMerma, setPendingDeleteMerma] = useState<Merma | null>(null);
  const [formData, setFormData] = useState<{
    fecha: string;
    productoId: string;
    cantidad: number;
    unidad: string;
    motivo: string;
    zona: 'bar' | 'cocina' | 'camara' | 'almacen';
    responsable: string;
    restaurantId?: string | number;
    notas?: string;
  }>({
    fecha: formatDateOnly(new Date()),
    productoId: '',
    cantidad: 0,
    unidad: 'unidad',
    motivo: '',
    zona: 'cocina',
    responsable: '',
    restaurantId: currentRestaurant?.id,
    notas: '',
  });

  const productos = (db.productos || []) as Product[];
  const workers = (db.workers || []) as Worker[];
  const mermas = (db.mermas || []) as Merma[];

  // Update restaurantId in form when context changes
  useEffect(() => {
    if (currentRestaurant?.id) {
      setFormData(prev => ({ ...prev, restaurantId: currentRestaurant.id }));
    }
  }, [currentRestaurant]);

  // AUDIT-FIX: Ensure data is loaded (R-14)
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          db.ensureLoaded('mermas'),
          db.ensureLoaded('productos'),
          db.ensureLoaded('workers')
        ]);
      } catch (error: unknown) {
        logger.error("Error loading MermasPage data:", error instanceof Error ? error.message : String(error));
      }
    };
    loadData();
  }, [db]);

  const filteredMermas = useMemo(() => {
    return mermas.filter(m => {
      const matchSearch = String(m.productoNombre || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(m.motivo || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchRestaurant = currentRestaurant?.id ? String(m.restaurantId) === String(currentRestaurant.id) : true;
      return matchSearch && matchRestaurant;
    }).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [mermas, searchQuery, currentRestaurant]);

  const handleOpenForm = () => {
    setEditingMerma(null);
    setFormData({
      fecha: formatDateOnly(new Date()),
      productoId: '',
      cantidad: 0,
      unidad: 'unidad',
      motivo: '',
      zona: 'cocina',
      responsable: '',
      restaurantId: currentRestaurant?.id,
      notas: '',
    });
    setViewMode('form');
  };

  const handleEdit = (merma: Merma) => {
    setEditingMerma(merma);
    setFormData({
      fecha: merma.fecha,
      productoId: String(merma.productoId),
      cantidad: merma.cantidad,
      unidad: merma.unidad,
      motivo: merma.motivo,
      zona: merma.zona || 'cocina',
      responsable: merma.responsable || '',
      restaurantId: merma.restaurantId,
      notas: merma.notas || '',
    });
    setViewMode('form');
  };

  const handleSave = () => {
    if (!formData.fecha || !formData.productoId || formData.cantidad <= 0 || !formData.motivo || !formData.responsable) {
      showToast({
        type: 'warning',
        title: 'Campos incompletos',
        message: 'Por favor, rellene todos los campos obligatorios (*)'
      });
      return;
    }

    const producto = productos.find(p => String(p.id) === formData.productoId);
    if (!producto) {
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Producto no encontrado'
      });
      return;
    }

    const valorPerdido = formData.cantidad * (producto.precioCompra || 0);

    const mermaData: Omit<Merma, 'id'> = {
      fecha: formData.fecha,
      productoId: formData.productoId,
      productoNombre: producto.nombre,
      cantidad: formData.cantidad,
      unidad: formData.unidad,
      motivo: formData.motivo,
      valorPerdido,
      zona: formData.zona,
      responsable: formData.responsable,
      restaurantId: currentRestaurant?.id,
      notas: formData.notas,
    };

    try {
      if (editingMerma) {
        db.update('mermas', editingMerma.id, mermaData);
        showToast({
          type: 'success',
          title: 'Registro actualizado',
          message: 'La merma ha sido actualizada correctamente'
        });
      } else {
        db.add('mermas', mermaData);
        showToast({
          type: 'success',
          title: 'Registro guardado',
          message: 'La merma ha sido registrada correctamente'
        });
      }
      setViewMode('list');
    } catch (error: unknown) {
      logger.error('Error guardando merma:', error instanceof Error ? error.message : String(error));
      showToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo guardar el registro'
      });
    }
  };

  const handleDelete = (merma: Merma) => {
    setPendingDeleteMerma(merma);
    setShowDeleteConfirm(true);
  };

  const executeDeleteMerma = (merma: Merma) => {
    try {
      db.delete('mermas', merma.id);
      showToast({
        type: 'success',
        title: 'Registro eliminado',
        message: 'La merma ha sido eliminada correctamente'
      });
    } catch (error: unknown) {
      logger.error('Error eliminando merma:', error instanceof Error ? error.message : String(error));
      showToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo eliminar el registro'
      });
    }
  };

  const totalMermas = filteredMermas.reduce((sum, m) => sum + (m.valorPerdido || 0), 0);

  return (
    <div style={{ padding: 'var(--spacing-md)', paddingBottom: '80px' }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '700', color: 'var(--text-main)' }}>
            Mermas y Desperdicios
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Control de pérdidas y roturas de inventario {currentRestaurant && ` - ${currentRestaurant.nombre}`}
          </p>
        </div>
        {viewMode === 'list' && (
          <Button variant="primary" onClick={handleOpenForm}>
            <Plus size={18} style={{ marginRight: '8px' }} /> Nuevo Registro
          </Button>
        )}
      </div>

      {viewMode === 'list' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          {/* Stats Card */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Pérdida Total (Periodo)
                </p>
                <p style={{ fontSize: '24px', fontWeight: '700', color: 'var(--danger)' }}>
                  {formatCurrency(totalMermas)}
                </p>
              </div>
              <div style={{ padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px' }}>
                <Trash2 size={24} color="var(--danger)" />
              </div>
            </div>
          </Card>

          {/* Filters */}
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            <div style={{ flex: 1 }}>
              <Input
                placeholder="Buscar por producto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search size={18} />}
                fullWidth
              />
            </div>
          </div>

          {/* List */}
          <Card>
            {filteredMermas.length === 0 ? (
              <div style={{ padding: 'var(--spacing-xl)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No hay mermas registradas con los filtros actuales.
              </div>
            ) : (
              <Table<Record<string, React.ReactNode>>
                columns={[
                  { key: 'fecha', header: 'Fecha' },
                  { key: 'producto', header: 'Producto' },
                  { key: 'cantidad', header: 'Cantidad' },
                  { key: 'valor', header: 'Valor' },
                  { key: 'acciones', header: '' }
                ]}
                data={filteredMermas.map(m => ({
                  id: m.id,
                  fecha: (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: '500' }}>{formatDate(m.fecha)}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{m.zona}</span>
                    </div>
                  ),
                  producto: (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: '600' }}>{m.productoNombre}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{m.motivo}</span>
                    </div>
                  ),
                  cantidad: `${m.cantidad} ${m.unidad}`,
                  valor: (
                    <span style={{ color: 'var(--danger)', fontWeight: '600' }}>
                      {formatCurrency(m.valorPerdido)}
                    </span>
                  ),
                  acciones: (
                    <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                      <Button variant="secondary" size="sm" onClick={() => handleEdit(m)}>
                        <Edit size={14} />
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(m)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  )
                }))}
              />
            )}
          </Card>
        </div>
      ) : (
        <Card>
          <div style={{ marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            <Button variant="ghost" size="sm" onClick={() => setViewMode('list')}>
              ← Volver
            </Button>
            <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600' }}>
              {editingMerma ? 'Editar Merma' : 'Nuevo Registro de Merma'}
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            <FormSection title="Detalle de Pérdida">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                <DatePicker
                  label="Fecha de la merma *"
                  value={formData.fecha}
                  onChange={(date) => setFormData({ ...formData, fecha: date })}
                  fullWidth
                  required
                />
                <Select
                  label="Zona *"
                  value={formData.zona}
                  onChange={(val) => setFormData({ ...formData, zona: val as InventoryZone })}
                  options={[
                    { value: 'bar', label: 'Barra' },
                    { value: 'cocina', label: 'Cocina' },
                    { value: 'camara', label: 'Cámaras' },
                    { value: 'almacen', label: 'Almacén General' }
                  ]}
                  fullWidth
                  required
                />
              </div>

              <div style={{ marginTop: 'var(--spacing-md)' }}>
                <Select
                  label="Producto *"
                  value={formData.productoId}
                  onChange={(val) => {
                    const p = productos.find(prod => String(prod.id) === val);
                    setFormData({
                      ...formData,
                      productoId: val,
                      unidad: p?.unidadBase || 'unidad'
                    });
                  }}
                  options={productos.map(p => ({ value: String(p.id), label: p.nombre }))}
                  placeholder="Seleccionar producto..."
                  fullWidth
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-md)' }}>
                <Input
                  label={`Cantidad (${formData.unidad}) *`}
                  type="number"
                  step="0.01"
                  value={formData.cantidad}
                  onChange={(e) => setFormData({ ...formData, cantidad: parseFloat(e.target.value) || 0 })}
                  fullWidth
                  required
                />
                <Select
                  label="Motivo *"
                  value={formData.motivo}
                  onChange={(val) => setFormData({ ...formData, motivo: val })}
                  options={[
                    { value: 'caducidad', label: 'Caducidad' },
                    { value: 'rotura', label: 'Rotura / Caída' },
                    { value: 'error_cocina', label: 'Error Cocina' },
                    { value: 'mal_estado', label: 'Mal estado (Recepción)' },
                    { value: 'otros', label: 'Otros' }
                  ]}
                  fullWidth
                  required
                />
              </div>
            </FormSection>

            <FormSection title="Responsabilidad">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--spacing-md)' }}>
                <Select
                  label="Responsable *"
                  value={formData.responsable}
                  onChange={(val) => setFormData({ ...formData, responsable: val })}
                  options={workers.map(w => ({ value: String(w.id), label: `${w.nombre} ${w.apellidos || ''}` }))}
                  placeholder="Seleccionar responsable..."
                  fullWidth
                  required
                />
              </div>
            </FormSection>

            <FormSection title="Notas Adicionales">
              <Input
                label="Observaciones"
                value={formData.notas}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                placeholder="Ej: Plato devuelto por cliente por mal olor..."
                fullWidth
              />
            </FormSection>

            {
              formData.productoId && formData.cantidad > 0 && (
                <Card style={{
                  backgroundColor: 'var(--danger-lighter)',
                  border: '1px solid var(--danger-light)',
                  marginTop: 'var(--spacing-md)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                      Valor Perdido Estimado:
                    </span>
                    <span style={{ fontSize: 'var(--font-size-xl)', fontWeight: '700', color: 'var(--danger)' }}>
                      {formatCurrency(
                        formData.cantidad * (productos.find(p => String(p.id) === formData.productoId)?.precioCompra || 0)
                      )}
                    </span>
                  </div>
                </Card>
              )
            }

            <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end', marginTop: 'var(--spacing-lg)' }}>
              <Button variant="secondary" onClick={() => setViewMode('list')}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleSave}>
                <Save size={16} /> {editingMerma ? 'Actualizar' : 'Guardar Registro'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Confirm Dialog for delete */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          if (pendingDeleteMerma) {
            executeDeleteMerma(pendingDeleteMerma);
          }
          setShowDeleteConfirm(false);
        }}
        title="Eliminar registro de merma"
        description="¿Estás seguro de que deseas eliminar este registro?"
        variant="danger"
        confirmLabel="Eliminar"
      />
    </div>
  );
};
