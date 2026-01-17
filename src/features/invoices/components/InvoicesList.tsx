import React from 'react';
import { Card, Table, Button } from '@components';
import { Pencil, Trash2 } from 'lucide-react';
import { formatDate, formatCurrency } from '@utils';
import type { Invoice } from '../invoices.types';

interface InvoicesListProps {
    invoices: Invoice[];
    loading: boolean;
    onEdit: (invoice: Invoice) => void;
    onDelete: (invoice: Invoice) => void;
}

export const InvoicesList: React.FC<InvoicesListProps> = ({ invoices, loading, onEdit, onDelete }) => {
    if (loading) {
        return (
            <Card>
                <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--text-secondary)' }}>
                    Cargando facturas...
                </div>
            </Card>
        );
    }

    const columns = [
        {
            key: 'numero' as keyof Invoice,
            header: 'Número',
            sortable: true
        },
        {
            key: 'proveedor' as keyof Invoice,
            header: 'Proveedor',
            sortable: true
        },
        {
            key: 'fecha' as keyof Invoice,
            header: 'Fecha',
            sortable: true,
            render: (value: any) => formatDate(value)
        },
        {
            key: 'total' as keyof Invoice,
            header: 'Total',
            sortable: true,
            render: (value: any) => formatCurrency(value)
        },
        {
            key: 'tipo' as keyof Invoice,
            header: 'Tipo',
            sortable: true,
            render: (value: any) => (
                <span style={{
                    padding: 'var(--spacing-xs) var(--spacing-sm)',
                    borderRadius: 'var(--radius)',
                    backgroundColor: value === 'factura' ? 'var(--info-lighter)' : 'var(--warning-lighter)',
                    color: value === 'factura' ? 'var(--info)' : 'var(--warning)',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: '500',
                    textTransform: 'capitalize'
                }}>
                    {value}
                </span>
            )
        }
    ];

    return (
        <Card>
            <Table<Invoice>
                data={invoices}
                columns={columns}
                emptyText="No hay facturas registradas"
                expandedRowRender={(invoice) => (
                    <div style={{ padding: 'var(--spacing-md)', backgroundColor: 'var(--surface-muted)', borderRadius: 'var(--radius)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div>
                                <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-main)' }}>Detalles de la Factura</h4>
                                {invoice.metodoPago && (
                                    <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
                                        <strong>Método de Pago:</strong> {invoice.metodoPago}
                                    </p>
                                )}
                                {invoice.notas && (
                                    <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
                                        <strong>Notas:</strong> {invoice.notas}
                                    </p>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => onEdit(invoice)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                >
                                    <Pencil size={14} /> Editar
                                </Button>
                                <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => onDelete(invoice)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                >
                                    <Trash2 size={14} /> Eliminar
                                </Button>
                            </div>
                        </div>

                        {invoice.productos && invoice.productos.length > 0 && (
                            <div style={{ backgroundColor: 'var(--surface)', borderRadius: 'var(--radius)', padding: 'var(--spacing-md)', border: '1px solid var(--border)' }}>
                                <h5 style={{ margin: '0 0 var(--spacing-sm) 0', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>Productos</h5>
                                <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                            <th style={{ textAlign: 'left', padding: '8px 4px', color: 'var(--text-secondary)', fontWeight: '500' }}>Producto</th>
                                            <th style={{ textAlign: 'right', padding: '8px 4px', color: 'var(--text-secondary)', fontWeight: '500' }}>Cant.</th>
                                            <th style={{ textAlign: 'right', padding: '8px 4px', color: 'var(--text-secondary)', fontWeight: '500' }}>Precio</th>
                                            <th style={{ textAlign: 'right', padding: '8px 4px', color: 'var(--text-secondary)', fontWeight: '500' }}>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {invoice.productos.map((prod, idx) => (
                                            <tr key={idx} style={{ borderBottom: idx === invoice.productos!.length - 1 ? 'none' : '1px solid var(--border-light)' }}>
                                                <td style={{ padding: '8px 4px', color: 'var(--text-main)' }}>{prod.nombre}</td>
                                                <td style={{ textAlign: 'right', padding: '8px 4px', color: 'var(--text-main)' }}>{prod.cantidad}</td>
                                                <td style={{ textAlign: 'right', padding: '8px 4px', color: 'var(--text-main)' }}>{formatCurrency(prod.precioUnitario)}</td>
                                                <td style={{ textAlign: 'right', padding: '8px 4px', fontWeight: '500', color: 'var(--text-main)' }}>{formatCurrency(prod.cantidad * prod.precioUnitario)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            />
        </Card>
    );
};
