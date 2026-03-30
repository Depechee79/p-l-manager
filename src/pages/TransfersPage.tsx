import React, { useState, useMemo } from 'react';
import {
  ArrowRight,
  ArrowLeftRight,
  CheckCircle,
  X,
  Clock,
  AlertTriangle,
  Plus,
  Search,
} from 'lucide-react';
import { formatDateOnly } from '@shared/utils/dateUtils';
import { Button, Input, Select, Table, Card, FormSection } from '@shared/components';
import { useDatabase, useRestaurantContext } from '@core';
import { logger } from '@core/services/LoggerService';
import { useTransfers } from '../hooks/useTransfers';
import { useToast } from '../utils/toast';
import { formatCurrency, formatDate } from '../utils/formatters';
import type { Transfer } from '../types';
import type { Product } from '@types';

export const TransfersPage: React.FC = () => {
  const { db } = useDatabase();
  const { showToast } = useToast();
  const restaurantContext = useRestaurantContext();
  const currentRestaurantId = restaurantContext.currentRestaurant?.id ? String(restaurantContext.currentRestaurant.id) : undefined;

  // AUDIT-FIX: Ensure data is loaded (R-14)
  React.useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          db.ensureLoaded('transfers'),
          db.ensureLoaded('productos'),
          db.ensureLoaded('restaurants')
        ]);
      } catch (error: unknown) {
        logger.error('Error loading TransfersPage data:', error instanceof Error ? error.message : String(error));
      }
    };
    loadData();
  }, [db]);

  const { transfers, pendingTransfers, createTransfer, approveTransfer, completeTransfer } = useTransfers(currentRestaurantId);

  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('all');
  const [formData, setFormData] = useState<{
    restauranteDestino: string;
    productos: Array<{ productoId: string; cantidad: number; unidad: string; precioUnitario: number }>;
    notas?: string;
  }>({
    restauranteDestino: '',
    productos: [],
    notas: '',
  });

  const restaurants = restaurantContext.restaurants.filter(r =>
    String(r.id) !== currentRestaurantId
  );

  const productos = (db.productos || []) as Product[];

  const filteredTransfers = useMemo(() => {
    let filtered = transfers;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.restauranteOrigen.toLowerCase().includes(query) ||
        t.restauranteDestino.toLowerCase().includes(query) ||
        t.notas?.toLowerCase().includes(query)
      );
    }

    if (filterEstado !== 'all') {
      filtered = filtered.filter(t => t.estado === filterEstado);
    }

    return filtered;
  }, [transfers, searchQuery, filterEstado]);

  const handleCreateTransfer = () => {
    if (!formData.restauranteDestino || formData.productos.length === 0) {
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Debes seleccionar un restaurante destino y añadir al menos un producto',
      });
      return;
    }

    if (!currentRestaurantId) {
      showToast({
        type: 'error',
        title: 'Error',
        message: 'No hay restaurante seleccionado',
      });
      return;
    }

    try {
      createTransfer({
        companyId: restaurantContext.currentRestaurant?.companyId || '',
        restauranteOrigen: currentRestaurantId,
        restauranteDestino: formData.restauranteDestino,
        fecha: formatDateOnly(new Date()),
        productos: formData.productos,
        estado: 'pendiente',
        notas: formData.notas,
      });

      showToast({
        type: 'success',
        title: 'Transferencia creada',
        message: 'La solicitud de transferencia ha sido enviada',
      });

      setViewMode('list');
      setFormData({
        restauranteDestino: '',
        productos: [],
        notas: '',
      });
    } catch (error: unknown) {
      logger.error('Error creating transfer:', error instanceof Error ? error.message : String(error));
      showToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo crear la transferencia',
      });
    }
  };

  const handleApprove = (transferId: string) => {
    if (!currentRestaurantId) return;

    try {
      approveTransfer(transferId, currentRestaurantId);
      showToast({
        type: 'success',
        title: 'Transferencia aprobada',
        message: 'La transferencia ha sido aprobada y está en tránsito',
      });
    } catch (error: unknown) {
      logger.error('Error approving transfer:', error instanceof Error ? error.message : String(error));
      showToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo aprobar la transferencia',
      });
    }
  };

  const handleComplete = (transferId: string) => {
    try {
      completeTransfer(transferId);
      showToast({
        type: 'success',
        title: 'Transferencia completada',
        message: 'La transferencia ha sido completada y los inventarios actualizados',
      });
    } catch (error: unknown) {
      logger.error('Error completing transfer:', error instanceof Error ? error.message : String(error));
      showToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo completar la transferencia',
      });
    }
  };

  const addProducto = () => {
    setFormData({
      ...formData,
      productos: [...formData.productos, {
        productoId: '',
        cantidad: 0,
        unidad: 'unidad',
        precioUnitario: 0,
      }],
    });
  };

  const updateProducto = (index: number, field: string, value: string | number) => {
    const nuevosProductos = [...formData.productos];
    nuevosProductos[index] = { ...nuevosProductos[index], [field]: value };

    // Si se actualiza el producto, cargar precio unitario
    if (field === 'productoId' && value) {
      const producto = productos.find(p => String(p.id) === value);
      if (producto) {
        nuevosProductos[index].precioUnitario = producto.precioCompra || 0;
        nuevosProductos[index].unidad = producto.unidadBase || 'unidad';
      }
    }

    setFormData({ ...formData, productos: nuevosProductos });
  };

  const removeProducto = (index: number) => {
    setFormData({
      ...formData,
      productos: formData.productos.filter((_, i) => i !== index),
    });
  };

  const getEstadoIcon = (estado: Transfer['estado']) => {
    switch (estado) {
      case 'pendiente':
        return <Clock size={16} color="var(--warning)" />;
      case 'en_transito':
        return <ArrowRight size={16} color="var(--info)" />;
      case 'completada':
        return <CheckCircle size={16} color="var(--success)" />;
      case 'cancelada':
        return <X size={16} color="var(--danger)" />;
    }
  };

  const getEstadoLabel = (estado: Transfer['estado']) => {
    switch (estado) {
      case 'pendiente':
        return 'Pendiente';
      case 'en_transito':
        return 'En Tránsito';
      case 'completada':
        return 'Completada';
      case 'cancelada':
        return 'Cancelada';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h1 style={{ margin: 0, fontSize: 'var(--font-size-2xl)', fontWeight: '700', color: 'var(--text-main)' }}>
            Transferencias
          </h1>
          <p style={{ margin: 'var(--spacing-xs) 0 0', color: 'var(--text-secondary)', fontSize: 'var(--font-size-base)' }}>
            Traspasos entre restaurantes
          </p>
        </div>
        {viewMode === 'list' && (
          <Button variant="primary" onClick={() => setViewMode('form')}>
            <Plus size={16} /> Nueva Transferencia
          </Button>
        )}
      </div>

      {/* Alertas de transferencias pendientes */}
      {pendingTransfers.length > 0 && (
        <Card style={{
          backgroundColor: 'var(--warning-lighter)',
          border: '1px solid var(--warning-light)',
          padding: 'var(--spacing-md)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            <AlertTriangle size={20} color="var(--warning)" />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '600', color: 'var(--text-main)', marginBottom: '4px' }}>
                {pendingTransfers.length} transferencia{pendingTransfers.length > 1 ? 's' : ''} pendiente{pendingTransfers.length > 1 ? 's' : ''}
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                Tienes transferencias esperando tu aprobación
              </div>
            </div>
          </div>
        </Card>
      )}

      {viewMode === 'form' ? (
        <Card>
          <div style={{ marginBottom: 'var(--spacing-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: 'var(--font-size-lg)', fontWeight: '600' }}>
              Nueva Transferencia
            </h2>
            <Button variant="secondary" onClick={() => setViewMode('list')}>
              <X size={16} /> Cancelar
            </Button>
          </div>

          <FormSection title="Restaurante Destino" description="Selecciona el restaurante que recibirá los productos">
            <Select
              label="Restaurante Destino *"
              value={formData.restauranteDestino}
              onChange={(value) => setFormData({ ...formData, restauranteDestino: value })}
              options={restaurants.map(r => ({
                value: String(r.id),
                label: r.nombre,
              }))}
              placeholder="Seleccionar restaurante..."
              fullWidth
              required
            />
          </FormSection>

          <FormSection title="Productos" description="Añade los productos a transferir">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              {formData.productos.map((producto, index) => (
                <Card key={index} style={{ padding: 'var(--spacing-md)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: 'var(--spacing-sm)', alignItems: 'end' }}>
                    <Select
                      label="Producto *"
                      value={producto.productoId}
                      onChange={(value) => updateProducto(index, 'productoId', value)}
                      options={productos.map(p => ({
                        value: String(p.id),
                        label: p.nombre,
                      }))}
                      placeholder="Seleccionar..."
                      fullWidth
                    />
                    <Input
                      label="Cantidad *"
                      type="number"
                      step="0.01"
                      value={producto.cantidad}
                      onChange={(e) => updateProducto(index, 'cantidad', parseFloat(e.target.value) || 0)}
                      fullWidth
                    />
                    <Input
                      label="Unidad"
                      value={producto.unidad}
                      onChange={(e) => updateProducto(index, 'unidad', e.target.value)}
                      fullWidth
                    />
                    <Input
                      label="Precio Unit."
                      type="number"
                      step="0.01"
                      value={producto.precioUnitario}
                      onChange={(e) => updateProducto(index, 'precioUnitario', parseFloat(e.target.value) || 0)}
                      fullWidth
                    />
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => removeProducto(index)}
                      style={{ marginBottom: '20px' }}
                    >
                      <X size={14} />
                    </Button>
                  </div>
                  <div style={{ marginTop: 'var(--spacing-sm)', textAlign: 'right', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                    Subtotal: {formatCurrency(producto.cantidad * producto.precioUnitario)}
                  </div>
                </Card>
              ))}

              <Button variant="secondary" onClick={addProducto} fullWidth>
                <Plus size={16} /> Añadir Producto
              </Button>
            </div>
          </FormSection>

          <FormSection title="Notas" description="Información adicional sobre la transferencia">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label className="input-label">Notas</label>
              <textarea
                value={formData.notas}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                className="input-field"
                style={{
                  width: '100%',
                  minHeight: '80px',
                  resize: 'vertical',
                  fontFamily: 'var(--font-body)',
                }}
                placeholder="Información adicional sobre la transferencia..."
              />
            </div>
          </FormSection>

          <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end', marginTop: 'var(--spacing-lg)' }}>
            <Button variant="secondary" onClick={() => setViewMode('list')}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleCreateTransfer}>
              <CheckCircle size={16} /> Crear Transferencia
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {/* Filtros */}
          <Card>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 400px) minmax(150px, 200px)', gap: 'var(--spacing-md)', alignItems: 'end' }}>
              <Input
                label="Buscar"
                placeholder="Buscar transferencias..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search size={18} />}
                iconPosition="left"
                fullWidth
              />
              <Select
                label="Estado"
                value={filterEstado}
                onChange={setFilterEstado}
                options={[
                  { value: 'all', label: 'Todos' },
                  { value: 'pendiente', label: 'Pendiente' },
                  { value: 'en_transito', label: 'En Tránsito' },
                  { value: 'completada', label: 'Completada' },
                  { value: 'cancelada', label: 'Cancelada' },
                ]}
                fullWidth
              />
            </div>
          </Card>

          {/* Tabla de Transferencias */}
          <Card>
            {filteredTransfers.length === 0 && transfers.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--spacing-xl) var(--spacing-md)', textAlign: 'center' }}>
                <ArrowLeftRight size={48} style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)' }} />
                <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--text-main)', marginBottom: 'var(--spacing-xs)' }}>
                  No hay transferencias
                </h3>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)' }}>
                  Gestiona traspasos de productos entre tus restaurantes.
                </p>
                <Button variant="primary" onClick={() => setViewMode('form')}>
                  <Plus size={16} style={{ marginRight: 'var(--spacing-xs)' }} /> Nueva Transferencia
                </Button>
              </div>
            ) : (
            <Table
              data={filteredTransfers}
              columns={[
                {
                  key: 'fecha',
                  header: 'Fecha',
                  render: (_, t) => formatDate(t.fecha),
                  sortable: true,
                },
                {
                  key: 'restauranteOrigen',
                  header: 'Origen',
                  render: (_, t) => {
                    const restaurant = restaurantContext.restaurants.find(r => String(r.id) === t.restauranteOrigen);
                    return restaurant?.nombre || t.restauranteOrigen;
                  },
                  sortable: true,
                },
                {
                  key: 'restauranteDestino',
                  header: 'Destino',
                  render: (_, t) => {
                    const restaurant = restaurantContext.restaurants.find(r => String(r.id) === t.restauranteDestino);
                    return restaurant?.nombre || t.restauranteDestino;
                  },
                  sortable: true,
                },
                {
                  key: 'productos',
                  header: 'Productos',
                  render: (_, t) => `${t.productos.length} producto${t.productos.length > 1 ? 's' : ''}`,
                },
                {
                  key: 'total',
                  header: 'Valor Total',
                  render: (_, t) => {
                    const total = t.productos.reduce((sum, p) => sum + (p.cantidad * p.precioUnitario), 0);
                    return formatCurrency(total);
                  },
                  sortable: true,
                },
                {
                  key: 'estado',
                  header: 'Estado',
                  render: (_, t) => (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {getEstadoIcon(t.estado)}
                      <span>{getEstadoLabel(t.estado)}</span>
                    </div>
                  ),
                  sortable: true,
                },
                {
                  key: 'actions',
                  header: 'Acciones',
                  render: (_, t) => {
                    const isDestino = String(t.restauranteDestino) === currentRestaurantId;

                    return (
                      <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                        {t.estado === 'pendiente' && isDestino && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleApprove(String(t.id))}
                          >
                            Aprobar
                          </Button>
                        )}
                        {t.estado === 'en_transito' && isDestino && (
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleComplete(String(t.id))}
                          >
                            Completar
                          </Button>
                        )}
                      </div>
                    );
                  },
                },
              ]}
              onRowClick={(_transfer) => {
                // Transfer details modal: pending implementation
              }}
              hoverable
              striped
              emptyText="No hay transferencias que coincidan con los filtros"
            />
            )}
          </Card>
        </>
      )}
    </div>
  );
};

