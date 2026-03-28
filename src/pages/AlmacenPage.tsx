/**
 * AlmacenPage - Warehouse/Inventory Hub
 *
 * Session 007: Updated with V2 design system
 * - ActionHeaderV2 with TabsNavV2
 * - FilterCardV2 with compact inputs
 * - DataCardV2 with KPI header
 * - No page title (context from breadcrumb)
 *
 * Tabs: Existencias | Inventarios | Mermas | Pedidos | Proveedores | Traspasos
 */
import React, { useState, useMemo, useEffect } from 'react';
import {
  Package,
  ClipboardCheck,
  Trash2 as WasteIcon,
  ShoppingCart,
  Building2,
  ArrowRightLeft,
  Search,
  Plus,
  Download,
  RefreshCw,
} from 'lucide-react';
import {
  type TabV2,
  PageContainer,
  PageLayoutV2,
  ActionHeaderV2,
  FilterCardV2,
  FilterInputV2,
  FilterTextInput,
  FilterSelect,
  DataCardV2,
  ButtonV2,
  Table,
  Badge,
} from '@shared/components';
import { useDatabase } from '@core';
import { logger } from '@core/services/LoggerService';
import type { Product, Provider } from '@types';

// Import existing page components for embedding
import { InventariosPage } from './InventariosPage';
import { MermasPage } from './MermasPage';
import { ProvidersPage } from './ProvidersPage';
import { TransfersPage } from './TransfersPage';

// Import Orders components
import { OrdersList, OrderForm, useOrders } from '@features/orders';
import type { Order, OrderFormData } from '@features/orders';

type TabId = 'existencias' | 'inventarios' | 'mermas' | 'pedidos' | 'proveedores' | 'traspasos';

const TABS: TabV2[] = [
  { id: 'existencias', label: 'Existencias', icon: <Package size={16} /> },
  { id: 'inventarios', label: 'Inventarios', icon: <ClipboardCheck size={16} /> },
  { id: 'mermas', label: 'Mermas', icon: <WasteIcon size={16} /> },
  { id: 'pedidos', label: 'Pedidos', icon: <ShoppingCart size={16} /> },
  { id: 'proveedores', label: 'Proveedores', icon: <Building2 size={16} /> },
  { id: 'traspasos', label: 'Traspasos', icon: <ArrowRightLeft size={16} /> },
];

// Filter options for Existencias tab
const FAMILIA_OPTIONS = [
  { value: 'all', label: 'Todas las familias' },
  { value: 'bebidas', label: 'Bebidas' },
  { value: 'comidas', label: 'Comidas' },
  { value: 'otros', label: 'Otros' },
];

const SECCION_OPTIONS = [
  { value: 'all', label: 'Todas las secciones' },
  { value: 'cocina', label: 'Cocina' },
  { value: 'bar', label: 'Bar' },
  { value: 'consumibles', label: 'Consumibles' },
];

export const AlmacenPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('existencias');

  // Get action button based on active tab
  const getActions = () => {
    switch (activeTab) {
      case 'existencias':
        return (
          <>
            <ButtonV2 variant="primary" icon={<Plus size={16} />}>
              Nuevo Producto
            </ButtonV2>
            <ButtonV2 variant="secondary" icon={<Download size={16} />} iconOnly />
          </>
        );
      case 'pedidos':
        return null; // PedidosTab has its own button
      default:
        return null;
    }
  };

  return (
    <PageContainer>
      <PageLayoutV2
        header={
          <ActionHeaderV2
            tabs={TABS}
            activeTab={activeTab}
            onTabChange={(id) => setActiveTab(id as TabId)}
            actions={getActions()}
          />
        }
      >
        {/* Tab Content */}
        {activeTab === 'existencias' && <ExistenciasTab />}
        {activeTab === 'inventarios' && <InventariosPageContent />}
        {activeTab === 'mermas' && <MermasPageContent />}
        {activeTab === 'pedidos' && <PedidosTab />}
        {activeTab === 'proveedores' && <ProvidersPageContent />}
        {activeTab === 'traspasos' && <TransfersPageContent />}
      </PageLayoutV2>
    </PageContainer>
  );
};

/**
 * ExistenciasTab - Stock list with filters
 * Uses V2 components: FilterCardV2, DataCardV2
 */
const ExistenciasTab: React.FC = () => {
  const { db } = useDatabase();
  const [searchQuery, setSearchQuery] = useState('');
  const [familiaFilter, setFamiliaFilter] = useState('all');
  const [seccionFilter, setSeccionFilter] = useState('all');
  const [proveedorFilter, setProveedorFilter] = useState('all');

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          db.ensureLoaded('productos'),
          db.ensureLoaded('proveedores'),
        ]);
      } catch (error: unknown) {
        logger.error('Error loading ExistenciasTab data:', error instanceof Error ? error.message : String(error));
      }
    };
    loadData();
  }, [db]);

  const productos = (db.productos || []) as Product[];
  const proveedores = (db.proveedores || []) as Provider[];

  // Provider options for filter
  const proveedorOptions = useMemo(() => {
    const options = [{ value: 'all', label: 'Todos los proveedores' }];
    proveedores.forEach(p => {
      options.push({ value: String(p.id), label: p.nombre });
    });
    return options;
  }, [proveedores]);

  // Filter products
  const filteredProductos = useMemo(() => {
    let filtered = productos;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.nombre.toLowerCase().includes(query) ||
        p.ean?.toLowerCase().includes(query) ||
        p.proveedor?.toLowerCase().includes(query)
      );
    }

    if (familiaFilter !== 'all') {
      filtered = filtered.filter(p =>
        p.familia?.toLowerCase() === familiaFilter
      );
    }

    if (seccionFilter !== 'all') {
      filtered = filtered.filter(p =>
        p.categoria?.toLowerCase() === seccionFilter
      );
    }

    if (proveedorFilter !== 'all') {
      filtered = filtered.filter(p =>
        String(p.proveedorId) === proveedorFilter
      );
    }

    return filtered;
  }, [productos, searchQuery, familiaFilter, seccionFilter, proveedorFilter]);

  // Calculate KPIs
  const stockBajo = filteredProductos.filter(
    p => p.stockMinimoUnidades && (p.stockActualUnidades || 0) <= p.stockMinimoUnidades
  ).length;
  const sinStock = filteredProductos.filter(
    p => !p.stockActualUnidades || p.stockActualUnidades === 0
  ).length;

  const getStockStatus = (stock: number, minStock?: number) => {
    if (minStock && stock <= minStock) {
      return { variant: 'danger' as const, label: 'Bajo' };
    }
    if (minStock && stock <= minStock * 1.5) {
      return { variant: 'warning' as const, label: 'Medio' };
    }
    return { variant: 'success' as const, label: 'OK' };
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFamiliaFilter('all');
    setSeccionFilter('all');
    setProveedorFilter('all');
  };

  const hasFilters = searchQuery || familiaFilter !== 'all' || seccionFilter !== 'all' || proveedorFilter !== 'all';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
      {/* Filters */}
      <FilterCardV2 columns={4}>
          <FilterInputV2 label="Buscar" grow>
            <FilterTextInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Código, nombre..."
              icon={<Search size={14} />}
            />
          </FilterInputV2>
          <FilterInputV2 label="Familia">
            <FilterSelect
              value={familiaFilter}
              onChange={setFamiliaFilter}
              options={FAMILIA_OPTIONS}
            />
          </FilterInputV2>
          <FilterInputV2 label="Sección">
            <FilterSelect
              value={seccionFilter}
              onChange={setSeccionFilter}
              options={SECCION_OPTIONS}
            />
          </FilterInputV2>
          <FilterInputV2 label="Proveedor">
            <FilterSelect
              value={proveedorFilter}
              onChange={setProveedorFilter}
              options={proveedorOptions}
            />
          </FilterInputV2>
      </FilterCardV2>

      {/* Data Card with KPIs and Table */}
      <DataCardV2
        kpis={[
          { label: 'Productos', value: filteredProductos.length.toLocaleString() },
          { label: 'Stock Bajo', value: stockBajo, variant: stockBajo > 0 ? 'danger' : 'default' },
          { label: 'Sin Stock', value: sinStock, variant: sinStock > 0 ? 'warning' : 'default' },
        ]}
        isEmpty={filteredProductos.length === 0}
        emptyTitle="No hay productos disponibles"
        emptyDescription="Utiliza los filtros superiores o añade un nuevo producto al almacén para comenzar la gestión."
        emptyIcon={<Package size={32} color="var(--text-light)" strokeWidth={1.5} />}
        emptyAction={
          hasFilters ? (
            <ButtonV2 variant="ghost" icon={<RefreshCw size={14} />} onClick={clearFilters}>
              Limpiar filtros
            </ButtonV2>
          ) : undefined
        }
        noPadding
      >
        <Table
          data={filteredProductos}
          columns={[
            {
              key: 'ean',
              header: 'EAN',
              render: (_, p) => p.ean || '-',
              sortable: true,
            },
            {
              key: 'nombre',
              header: 'Producto',
              render: (_, p) => (
                <div>
                  <div style={{ fontWeight: '500' }}>{p.nombre}</div>
                  {p.proveedor && (
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                      {p.proveedor}
                    </div>
                  )}
                </div>
              ),
              sortable: true,
            },
            {
              key: 'familia',
              header: 'Familia',
              render: (_, p) => p.familia || '-',
              sortable: true,
            },
            {
              key: 'categoria',
              header: 'Categoria',
              render: (_, p) => p.categoria || '-',
              sortable: true,
            },
            {
              key: 'stockActualUnidades',
              header: 'Stock',
              render: (_, p) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                  <span style={{ fontWeight: '600' }}>
                    {p.stockActualUnidades ?? 0} {p.unidadBase || 'ud'}
                  </span>
                  <Badge variant={getStockStatus(p.stockActualUnidades || 0, p.stockMinimoUnidades).variant}>
                    {getStockStatus(p.stockActualUnidades || 0, p.stockMinimoUnidades).label}
                  </Badge>
                </div>
              ),
              sortable: true,
            },
            {
              key: 'stockMinimoUnidades',
              header: 'Min',
              render: (_, p) => p.stockMinimoUnidades ?? '-',
              sortable: true,
            },
            {
              key: 'precioCompra',
              header: 'Precio',
              render: (_, p) => p.precioCompra ? `${p.precioCompra.toFixed(2)} €` : '-',
              sortable: true,
            },
          ]}
          hoverable
          striped
          emptyText="No hay productos que coincidan con los filtros"
        />
      </DataCardV2>
    </div>
  );
};

/**
 * Wrapper for InventariosPage to strip the outer padding
 * since AlmacenPage already provides the container
 */
const InventariosPageContent: React.FC = () => {
  return (
    <div style={{ margin: 'calc(-1 * var(--spacing-lg))' }}>
      <InventariosPage />
    </div>
  );
};

/**
 * Wrapper for MermasPage to strip the outer padding
 */
const MermasPageContent: React.FC = () => {
  return (
    <div style={{ margin: 'calc(-1 * var(--spacing-lg))' }}>
      <MermasPage />
    </div>
  );
};

/**
 * Wrapper for ProvidersPage
 */
const ProvidersPageContent: React.FC = () => {
  return (
    <div style={{ margin: 'calc(-1 * var(--spacing-md))' }}>
      <ProvidersPage />
    </div>
  );
};

/**
 * Wrapper for TransfersPage
 */
const TransfersPageContent: React.FC = () => {
  return (
    <div style={{ padding: '0' }}>
      <TransfersPage />
    </div>
  );
};

/**
 * PedidosTab - Orders management with full CRUD
 * Uses V2 components
 */
const PedidosTab: React.FC = () => {
  const { db } = useDatabase();
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
    sendOrder,
  } = useOrders();

  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  const productos = (db.productos || []) as Product[];
  const proveedores = (db.proveedores || []) as Provider[];

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    setMode('edit');
  };

  const handleDelete = async (order: Order) => {
    if (window.confirm('¿Estás seguro de eliminar este pedido?')) {
      await deleteOrder(order.id);
    }
  };

  const handleSend = async (order: Order) => {
    if (window.confirm('¿Enviar este pedido al proveedor?')) {
      await sendOrder(order);
    }
  };

  const handleSave = async (data: OrderFormData) => {
    const proveedorObj = proveedores.find(p => String(p.id) === String(data.proveedorId));
    const orderData = {
      ...data,
      proveedorNombre: proveedorObj?.nombre || 'Desconocido',
      total: data.productos.reduce((sum, p) => {
        return sum + (p.cantidad * p.precioUnitario);
      }, 0),
      productos: data.productos.map((p) => {
        const productDef = productos.find(prod => String(prod.id) === String(p.productoId));
        return {
          ...p,
          nombre: productDef?.nombre || '',
          subtotal: p.cantidad * p.precioUnitario,
          unidad: p.unidad || productDef?.unidadBase || 'ud',
        };
      }),
    };

    let success = false;
    if (editingOrder) {
      success = await updateOrder(editingOrder.id, orderData);
    } else {
      success = await createOrder(orderData);
    }

    if (success) {
      setMode('list');
      setEditingOrder(null);
    }
  };

  const handleCancel = () => {
    setMode('list');
    setEditingOrder(null);
  };

  if (mode === 'create' || mode === 'edit') {
    return (
      <OrderForm
        initialData={editingOrder}
        providers={proveedores}
        products={productos}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
      {/* Filters and Actions */}
      <FilterCardV2 columns={3}>
        <FilterInputV2 label="Buscar" grow>
          <FilterTextInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Proveedor o notas..."
            icon={<Search size={14} />}
          />
        </FilterInputV2>
        <FilterInputV2 label="Estado">
          <FilterSelect
            value={filterEstado}
            onChange={setFilterEstado}
            options={[
              { value: 'all', label: 'Todos' },
              { value: 'borrador', label: 'Borrador' },
              { value: 'enviado', label: 'Enviado' },
              { value: 'recibido', label: 'Recibido' },
              { value: 'cancelado', label: 'Cancelado' },
            ]}
          />
        </FilterInputV2>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <ButtonV2 variant="primary" icon={<Plus size={16} />} onClick={() => setMode('create')}>
            Nuevo Pedido
          </ButtonV2>
        </div>
      </FilterCardV2>

      {/* Orders List */}
      <OrdersList
        orders={orders}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSend={handleSend}
      />
    </div>
  );
};
