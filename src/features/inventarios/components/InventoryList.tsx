import React from 'react';
import { Plus, Search, Trash2 } from 'lucide-react';
import { Button, Input, Table } from '@/shared/components';
import { formatDate, formatCurrency } from '@/utils/formatters';
import type { InventoryItem } from '@types';

interface InventoryListProps {
    inventories: InventoryItem[];
    onNew: () => void;
    onEdit: (inventory: InventoryItem) => void;
    onDelete: (inventory: InventoryItem) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    loading?: boolean;
}

export const InventoryList: React.FC<InventoryListProps> = ({
    inventories,
    onNew,
    onEdit,
    onDelete,
    searchQuery,
    onSearchChange,
    loading
}) => {
    return (
        <>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--spacing-lg)',
                flexWrap: 'wrap',
                gap: 'var(--spacing-md)',
            }}>
                <h2 style={{ margin: 0, fontSize: 'var(--font-size-2xl)', fontWeight: '600' }}>
                    Inventarios
                </h2>
                <Button onClick={onNew} variant="primary" disabled={loading}>
                    <Plus size={16} /> Nuevo Inventario
                </Button>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 'var(--spacing-md)',
                marginBottom: 'var(--spacing-lg)',
            }}>
                <Input
                    type="text"
                    placeholder="Buscar por nombre o fecha..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    fullWidth
                    icon={<Search size={18} />}
                    iconPosition="left"
                />
            </div>

            <Table
                data={inventories}
                loading={loading}
                columns={[
                    {
                        key: 'fecha',
                        header: 'Fecha',
                        render: (_, inv) => formatDate(inv.fecha),
                        sortable: true,
                    },
                    {
                        key: 'nombre',
                        header: 'Nombre',
                        render: (_, inv) => (inv as any).nombre || 'Sin nombre',
                        sortable: true,
                    },
                    {
                        key: 'persona',
                        header: 'Persona',
                        render: (_, inv) => (inv as any).persona || '-',
                        sortable: true,
                    },
                    {
                        key: 'totalItems',
                        header: 'Productos',
                        render: (_, inv) => inv.totalItems || 0,
                        sortable: true,
                    },
                    {
                        key: 'valorTotal',
                        header: 'Valor Total',
                        render: (_, inv) => formatCurrency(inv.valorTotal || 0),
                        sortable: true,
                    },
                ]}
                onRowClick={onEdit}
                hoverable
                striped
                emptyText="No hay inventarios registrados"
                expandedRowRender={(inv) => (
                    <div style={{ padding: 'var(--spacing-lg)' }}>
                        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end', marginBottom: 'var(--spacing-md)' }}>
                            <Button
                                variant="danger"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(inv);
                                }}
                            >
                                <Trash2 size={14} /> Eliminar
                            </Button>
                        </div>
                        <div style={{ marginBottom: 'var(--spacing-md)' }}>
                            <h4 style={{ marginBottom: 'var(--spacing-sm)', fontSize: 'var(--font-size-base)', fontWeight: '600' }}>
                                Productos ({inv.productos.length})
                            </h4>
                            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                {inv.productos.map((p, idx) => (
                                    <div
                                        key={idx}
                                        style={{
                                            padding: 'var(--spacing-sm)',
                                            borderBottom: '1px solid var(--border)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                        }}
                                    >
                                        <span>{p.nombre}</span>
                                        <span style={{ fontWeight: '600' }}>
                                            {p.stockReal} unidades (Diferencia: {p.diferencia > 0 ? '+' : ''}{p.diferencia})
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            />
        </>
    );
};
