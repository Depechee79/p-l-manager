import React, { useState } from 'react';
import { Button, Input, Select, Card } from '@shared/components';
import { Plus, Search } from 'lucide-react';
import { useDatabase } from '@core';
import { useToast } from '@hooks/useToast';
import { useOrders, OrderForm, OrdersList } from '@/features/orders';
import type { Order, OrderFormData } from '@/features/orders';
import type { Product, Provider } from '@types';

export const OrdersPage: React.FC = () => {
  const { db } = useDatabase();
  const { showToast } = useToast();

  // AUDIT-FIX: Ensure data is loaded (R-14)
  React.useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          db.ensureLoaded('orders'),
          db.ensureLoaded('productos'),
          db.ensureLoaded('proveedores')
        ]);
      } catch (error) {
        console.error("Error loading OrdersPage data:", error);
      }
    };
    loadData();
  }, [db]);

  const {
    orders,
    loading,
    searchQuery,
    setSearchQuery,
    filterEstado,
    setFilterEstado,
    createOrder,
    updateOrder,
    deleteOrder,
    sendOrder
  } = useOrders();

  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  const productos = (db.productos || []) as Product[];
  const proveedores = (db.proveedores || []) as Provider[];

  const handleOpenForm = () => {
    setEditingOrder(null);
    setViewMode('form');
  };

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    setViewMode('form');
  };

  const handleDelete = async (order: Order) => {
    if (window.confirm(`¿Eliminar el pedido a ${order.proveedorNombre}?`)) {
      await deleteOrder(order.id);
    }
  };

  const handleSend = async (order: Order) => {
    if (window.confirm(`¿Enviar el pedido a ${order.proveedorNombre}?`)) {
      await (sendOrder as any)(order);
    }
  };

  const handleSave = async (formData: OrderFormData) => {
    const proveedor = proveedores.find(p => String(p.id) === formData.proveedorId);
    if (!proveedor) {
      showToast({ type: 'error', title: 'Error', message: 'Proveedor no encontrado' });
      return;
    }

    const productosDetalle = formData.productos.map(p => {
      const producto = productos.find(prod => String(prod.id) === p.productoId);
      return {
        productoId: p.productoId,
        nombre: producto?.nombre || 'Producto desconocido',
        cantidad: p.cantidad,
        unidad: p.unidad,
        precioUnitario: p.precioUnitario,
        subtotal: p.cantidad * p.precioUnitario,
      };
    });

    const total = productosDetalle.reduce((sum, p) => sum + p.subtotal, 0);

    const orderData: any = {
      fecha: formData.fecha,
      fechaEntrega: formData.fechaEntrega,
      proveedorId: formData.proveedorId,
      proveedorNombre: proveedor.nombre,
      productos: productosDetalle,
      total,
      estado: formData.estado,
      notas: formData.notas,
    };

    let success = false;
    if (editingOrder) {
      success = await updateOrder(editingOrder.id, orderData);
    } else {
      success = await createOrder(orderData);
    }

    if (success) {
      setViewMode('list');
    }
  };

  return (
    <div style={{ padding: 'var(--spacing-md)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 'var(--font-size-2xl)', fontWeight: '700', color: 'var(--text-main)' }}>
            Pedidos
          </h1>
          <p style={{ margin: 'var(--spacing-xs) 0 0', color: 'var(--text-secondary)', fontSize: 'var(--font-size-base)' }}>
            Gestión de pedidos a proveedores
          </p>
        </div>
        {viewMode === 'list' && (
          <Button variant="primary" onClick={handleOpenForm}>
            <Plus size={16} /> Nuevo Pedido
          </Button>
        )}
      </div>

      {viewMode === 'form' ? (
        <OrderForm
          initialData={editingOrder}
          providers={proveedores}
          products={productos}
          onSave={handleSave}
          onCancel={() => setViewMode('list')}
        />
      ) : (
        <>
          {/* Filtros */}
          <Card style={{ marginBottom: 'var(--spacing-lg)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)' }}>
              <Input
                placeholder="Buscar pedidos..."
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
                  { value: 'borrador', label: 'Borrador' },
                  { value: 'enviado', label: 'Enviado' },
                  { value: 'recibido', label: 'Recibido' },
                  { value: 'cancelado', label: 'Cancelado' },
                ]}
                fullWidth
              />
            </div>
          </Card>

          {/* Tabla */}
          <OrdersList
            orders={orders}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onSend={handleSend}
          />
        </>
      )}
    </div>
  );
};
