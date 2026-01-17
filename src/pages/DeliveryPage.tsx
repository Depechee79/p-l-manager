import React, { useState } from 'react';
import { Button, Input, DatePicker, Select, PageContainer, PageHeader, FilterBar, Card, Table } from '@shared/components';
import type { TableColumn } from '@shared/components/Table';
import type { DeliveryOrder, PlataformaDelivery } from '../types/delivery.types';
import { DeliveryService } from '../services/delivery-service';
import { formatCurrency } from '../utils/formatters';

export const DeliveryPage: React.FC = () => {
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('Todas');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    plataforma: 'Uber Eats' as PlataformaDelivery,
    fecha: new Date().toISOString().split('T')[0],
    ventasBrutas: 0,
    comisionPct: 30,
    notas: '',
  });

  const filteredOrders = selectedPlatform === 'Todas'
    ? orders
    : orders.filter(o => o.plataforma === selectedPlatform);

  const handlePlatformChange = (plataforma: PlataformaDelivery) => {
    const defaultComision = DeliveryService.getDefaultComision(plataforma);
    setFormData({ ...formData, plataforma, comisionPct: defaultComision });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const { comisionImporte, ingresoNeto } = DeliveryService.calculateOrder(
      formData.ventasBrutas,
      formData.comisionPct
    );

    const order: DeliveryOrder = {
      id: Date.now().toString(),
      plataforma: formData.plataforma,
      fecha: formData.fecha,
      ventasBrutas: formData.ventasBrutas,
      comisionPct: formData.comisionPct,
      comisionImporte,
      ingresoNeto,
      notas: formData.notas,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const validation = DeliveryService.validate(order);
    if (!validation.valid) {
      alert(validation.errors.join('\n'));
      return;
    }

    setOrders([...orders, order]);
    setShowForm(false);
    setFormData({
      plataforma: 'Uber Eats',
      fecha: new Date().toISOString().split('T')[0],
      ventasBrutas: 0,
      comisionPct: 30,
      notas: '',
    });
  };

  const { comisionImporte, ingresoNeto } = DeliveryService.calculateOrder(
    formData.ventasBrutas,
    formData.comisionPct
  );

  const columns: TableColumn<DeliveryOrder>[] = [
    {
      key: 'fecha',
      header: 'Fecha',
      sortable: true,
      render: (_, row) => new Date(row.fecha).toLocaleDateString('es-ES'),
    },
    {
      key: 'plataforma',
      header: 'Plataforma',
      sortable: true,
      render: (_, row) => (
        <span style={{ padding: '4px 12px', backgroundColor: 'var(--info-bg)', color: 'var(--info)', borderRadius: '4px', fontSize: '12px', fontWeight: '500' }}>
          {row.plataforma}
        </span>
      ),
    },
    {
      key: 'ventasBrutas',
      header: 'Ventas Brutas',
      sortable: true,
      render: (_, row) => formatCurrency(row.ventasBrutas),
    },
    {
      key: 'comisionImporte',
      header: 'Comisión',
      sortable: true,
      render: (_, row) => (
        <span style={{ color: 'var(--danger)' }}>
          - {formatCurrency(row.comisionImporte)}
        </span>
      ),
    },
    {
      key: 'ingresoNeto',
      header: 'Ingreso Neto',
      sortable: true,
      render: (_, row) => (
        <span style={{ color: 'var(--success)', fontWeight: '600' }}>
          {formatCurrency(row.ingresoNeto)}
        </span>
      ),
    },
    {
      key: 'comisionPct',
      header: 'Comisión %',
      sortable: true,
      render: (_, row) => `${row.comisionPct}%`,
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Delivery"
        description="Gestión de pedidos de plataformas de delivery"
        action={
          <Button onClick={() => setShowForm(!showForm)} variant="primary">
            {showForm ? 'Cancelar' : '➕ Nuevo Pedido'}
          </Button>
        }
      />

      {/* Filter Bar */}
      {!showForm && (
        <FilterBar>
          <div style={{ width: '300px' }}>
            <Select
              label="Plataforma"
              value={selectedPlatform}
              onChange={(value) => setSelectedPlatform(value)}
              options={[
                { value: 'Todas', label: 'Todas las plataformas' },
                { value: 'Uber Eats', label: 'Uber Eats' },
                { value: 'Glovo', label: 'Glovo' },
                { value: 'Just Eat', label: 'Just Eat' },
              ]}
              fullWidth
            />
          </div>
        </FilterBar>
      )}

      {!showForm && (
        <Table
          data={filteredOrders}
          columns={columns}
          hoverable
          striped
          emptyText="No hay pedidos registrados"
          expandedRowRender={(order) => (
            <div style={{ padding: 'var(--spacing-md)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                <div>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xs)' }}>Ventas Brutas</div>
                  <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--text-main)' }}>{formatCurrency(order.ventasBrutas)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xs)' }}>Comisión ({order.comisionPct}%)</div>
                  <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--danger)' }}>
                    - {formatCurrency(order.comisionImporte)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xs)' }}>Ingreso Neto</div>
                  <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--success)' }}>
                    {formatCurrency(order.ingresoNeto)}
                  </div>
                </div>
              </div>
              {order.notas && (
                <div>
                  <h4 style={{ margin: '0 0 var(--spacing-xs) 0', fontSize: 'var(--font-size-base)', color: 'var(--text-secondary)' }}>Notas</h4>
                  <p style={{ margin: 0, color: 'var(--text-main)', fontSize: 'var(--font-size-base)' }}>{order.notas}</p>
                </div>
              )}
            </div>
          )}
        />
      )}

      {showForm && (
        <Card>
          <div style={{ padding: 'var(--spacing-md)' }}>
            <h3 style={{ marginTop: 0, marginBottom: 'var(--spacing-lg)' }}>Nuevo Pedido Delivery</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
                <div>
                  <Select
                    label="Plataforma *"
                    value={formData.plataforma}
                    onChange={(value) => handlePlatformChange(value as PlataformaDelivery)}
                    options={[
                      { value: 'Uber Eats', label: 'Uber Eats' },
                      { value: 'Glovo', label: 'Glovo' },
                      { value: 'Just Eat', label: 'Just Eat' },
                      { value: 'Propio', label: 'Reparto Propio' },
                    ]}
                    fullWidth
                  />
                </div>
                <DatePicker
                  label="Fecha *"
                  value={formData.fecha}
                  onChange={(value) => setFormData({ ...formData, fecha: value })}
                  required
                  fullWidth
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
                <Input
                  label="Ventas Brutas (€) *"
                  type="number"
                  step="0.01"
                  value={formData.ventasBrutas}
                  onChange={(e) => setFormData({ ...formData, ventasBrutas: parseFloat(e.target.value) || 0 })}
                  required
                />
                <Input
                  label="Comisión (%) *"
                  type="number"
                  step="0.01"
                  value={formData.comisionPct}
                  onChange={(e) => setFormData({ ...formData, comisionPct: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>

              <div style={{ padding: 'var(--spacing-md)', backgroundColor: 'var(--success-bg)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--spacing-lg)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--spacing-md)' }}>
                  <div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xs)' }}>Ventas Brutas</div>
                    <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600' }}>{formatCurrency(formData.ventasBrutas)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xs)' }}>Comisión ({formData.comisionPct}%)</div>
                    <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--danger)' }}>
                      - {formatCurrency(comisionImporte)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xs)' }}>Ingreso Neto</div>
                    <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--success)' }}>
                      {formatCurrency(ingresoNeto)}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: 'var(--text-main)' }}>
                  Notas
                </label>
                <textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    fontSize: 'var(--font-size-base)',
                    fontFamily: 'var(--font-body)',
                    backgroundColor: 'var(--surface-muted)',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary">
                  Guardar Pedido
                </Button>
              </div>
            </form>
          </div>
        </Card>
      )}

    </PageContainer>
  );
};
