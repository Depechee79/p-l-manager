import React from 'react';
import { Button, Table, Card } from '@components';
import { Send, Edit, Trash2, Clock, CheckCircle, X } from 'lucide-react';
import type { Order } from '../orders.types';
import { formatDate, formatCurrency } from '@utils';

interface OrdersListProps {
    orders: Order[];
    loading: boolean;
    onEdit: (order: Order) => void;
    onDelete: (order: Order) => void;
    onSend: (order: Order) => void;
}

const getEstadoIcon = (estado: string) => {
    switch (estado) {
        case 'borrador': return <Clock size={16} color="var(--text-secondary)" />;
        case 'enviado': return <Send size={16} color="var(--info)" />;
        case 'recibido': return <CheckCircle size={16} color="var(--success)" />;
        case 'cancelado': return <X size={16} color="var(--danger)" />;
        default: return null;
    }
};

const getEstadoLabel = (estado: string) => {
    switch (estado) {
        case 'borrador': return 'Borrador';
        case 'enviado': return 'Enviado';
        case 'recibido': return 'Recibido';
        case 'cancelado': return 'Cancelado';
        default: return estado;
    }
};

export const OrdersList: React.FC<OrdersListProps> = ({ orders, loading, onEdit, onDelete, onSend }) => {
    if (loading) {
        return (
            <Card>
                <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--text-secondary)' }}>
                    Cargando pedidos...
                </div>
            </Card>
        );
    }

    return (
        <Card>
            <Table
                data={orders}
                columns={[
                    {
                        key: 'fecha',
                        header: 'Fecha',
                        render: (_, o) => formatDate(o.fecha),
                        sortable: true,
                    },
                    {
                        key: 'proveedorNombre',
                        header: 'Proveedor',
                        render: (_, o) => (
                            <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                                {o.proveedorNombre}
                            </span>
                        ),
                        sortable: true,
                    },
                    {
                        key: 'productos',
                        header: 'Productos',
                        render: (_, o) => `${o.productos.length} producto${o.productos.length !== 1 ? 's' : ''}`,
                    },
                    {
                        key: 'total',
                        header: 'Total',
                        render: (_, o) => (
                            <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                                {formatCurrency(o.total)}
                            </span>
                        ),
                        sortable: true,
                    },
                    {
                        key: 'estado',
                        header: 'Estado',
                        render: (_, o) => (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {getEstadoIcon(o.estado)}
                                <span>{getEstadoLabel(o.estado)}</span>
                            </div>
                        ),
                        sortable: true,
                    },
                    {
                        key: 'id', // Actions column doesn't key off a data point really
                        header: 'Acciones',
                        render: (_, o) => (
                            <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                                {o.estado === 'borrador' && (
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={(e) => { e.stopPropagation(); onSend(o); }}
                                        title="Enviar Pedido"
                                    >
                                        <Send size={14} />
                                    </Button>
                                )}
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={(e) => { e.stopPropagation(); onEdit(o); }}
                                >
                                    <Edit size={14} />
                                </Button>
                                <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={(e) => { e.stopPropagation(); onDelete(o); }}
                                >
                                    <Trash2 size={14} />
                                </Button>
                            </div>
                        ),
                    },
                ]}
                onRowClick={(order) => onEdit(order)}
                hoverable
                striped
                emptyText="No hay pedidos registrados"
            />
        </Card>
    );
};
