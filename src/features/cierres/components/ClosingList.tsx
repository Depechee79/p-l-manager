import React from 'react';
import {
    Plus,
    Pencil,
    Trash2,
    CheckCircle,
    AlertTriangle,
    Banknote,
    CreditCard,
    Coins,
    Share2,
} from 'lucide-react';
import { Button, Card, Table } from '@shared/components';
import { formatCurrency, formatDate } from '@utils/formatters';
import type { Cierre } from '@types';

interface ClosingListProps {
    closings: Cierre[];
    loading: boolean;
    filterPeriod: string;
    onFilterChange: (period: string) => void;
    onNewClosing: () => void;
    onEditClosing: (cierre: Cierre) => void;
    onDeleteClosing: (cierre: Cierre) => void;
}

export const ClosingList: React.FC<ClosingListProps> = ({
    closings,
    loading,
    filterPeriod,
    onFilterChange,
    onNewClosing,
    onEditClosing,
    onDeleteClosing,
}) => {
    const handleShare = (cierre: Cierre) => {
        const text = `📊 Resumen Cierre - ${formatDate(cierre.fecha)} (${cierre.turno.toUpperCase()})
💰 Total Real: ${formatCurrency(cierre.totalReal)}
💳 Tarjetas: ${formatCurrency(cierre.totalDatafonos)}
💵 Efectivo: ${formatCurrency(cierre.efectivoContado)}
⚡ Descuadre: ${formatCurrency(cierre.descuadreTotal)}
${cierre.notasDescuadre ? `📝 Notas: ${cierre.notasDescuadre}` : ''}
Sent from P&L Manager`;

        const encodedText = encodeURIComponent(text);

        // Simple share strategy
        const menu = [
            { label: 'WhatsApp', url: `https://wa.me/?text=${encodedText}` },
            { label: 'Email', url: `mailto:?subject=Resumen Cierre ${cierre.fecha}&body=${encodedText}` }
        ];

        // For now, let's just use WhatsApp as primary or open a prompt
        if (confirm(`¿Compartir resumen de ${cierre.fecha} por WhatsApp?`)) {
            window.open(menu[0].url, '_blank');
        }
    };
    return (
        <>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--spacing-lg)',
                flexWrap: 'wrap',
                gap: 'var(--spacing-md)'
            }}>
                <div style={{ flex: '1', minWidth: '200px', maxWidth: '250px' }}>
                    <input
                        type="month"
                        value={filterPeriod}
                        onChange={(e) => onFilterChange(e.target.value)}
                        style={{
                            padding: '0 16px',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius)',
                            fontSize: 'var(--font-size-base)',
                            width: '100%',
                            backgroundColor: 'var(--surface-muted)',
                            height: '40px',
                            boxSizing: 'border-box',
                        }}
                    />
                </div>
                <Button onClick={onNewClosing} variant="primary">
                    <Plus size={16} /> Nuevo Cierre
                </Button>
            </div>

            {loading ? (
                <Card>
                    <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)', color: 'var(--text-secondary)' }}>
                        Cargando cierres...
                    </div>
                </Card>
            ) : closings.length === 0 ? (
                <Card>
                    <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)', color: 'var(--text-secondary)' }}>
                        No hay cierres registrados
                    </div>
                </Card>
            ) : (
                <Table
                    data={closings}
                    columns={[
                        {
                            key: 'fecha',
                            header: 'Fecha',
                            render: (_: any, cierre: Cierre) => formatDate(cierre.fecha),
                            sortable: true
                        },
                        {
                            key: 'turno',
                            header: 'Turno',
                            render: (_: any, cierre: Cierre) => cierre.turno.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
                            sortable: true
                        },
                        {
                            key: 'totalReal',
                            header: 'Total Real',
                            render: (_: any, cierre: Cierre) => formatCurrency(cierre.totalReal),
                            sortable: true
                        },
                        {
                            key: 'descuadreTotal',
                            header: 'Estado',
                            render: (_: any, cierre: Cierre) => {
                                const cuadra = Math.abs(cierre.descuadreTotal) <= 0.05;
                                return (
                                    <span
                                        className={`badge ${cuadra ? 'badge-success' : 'badge-danger'}`}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 'var(--spacing-xs)'
                                        }}
                                    >
                                        {cuadra ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                                        {cuadra ? 'CUADRA' : `${formatCurrency(Math.abs(cierre.descuadreTotal))}`}
                                    </span>
                                );
                            },
                            sortable: true
                        }
                    ]}
                    onRowClick={(cierre: Cierre) => onEditClosing(cierre)}
                    hoverable
                    striped
                    expandedRowRender={(cierre: Cierre) => (
                        <div style={{ padding: 'var(--spacing-lg)' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-lg)' }}>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={(e: React.MouseEvent) => {
                                        e.stopPropagation();
                                        onEditClosing(cierre);
                                    }}
                                >
                                    <Pencil size={14} /> Editar
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={(e: React.MouseEvent) => {
                                        e.stopPropagation();
                                        handleShare(cierre);
                                    }}
                                >
                                    <Share2 size={14} /> Compartir
                                </Button>
                                <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={(e: React.MouseEvent) => {
                                        e.stopPropagation();
                                        onDeleteClosing(cierre);
                                    }}
                                >
                                    <Trash2 size={14} /> Eliminar
                                </Button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--spacing-md)' }}>
                                <div>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-xs)', marginBottom: 'var(--spacing-xs)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', textTransform: 'uppercase' }}>
                                        <Banknote size={14} /> Efectivo
                                    </div>
                                    <div style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: 'var(--font-size-lg)' }}>
                                        {formatCurrency(cierre.efectivoContado)}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-xs)', marginBottom: 'var(--spacing-xs)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', textTransform: 'uppercase' }}>
                                        <CreditCard size={14} /> Tarjetas
                                    </div>
                                    <div style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: 'var(--font-size-lg)' }}>
                                        {formatCurrency(cierre.totalDatafonos)}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-xs)', marginBottom: 'var(--spacing-xs)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', textTransform: 'uppercase' }}>
                                        <Coins size={14} /> Otros
                                    </div>
                                    <div style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: 'var(--font-size-lg)' }}>
                                        {formatCurrency(cierre.totalOtrosMedios)}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-xs)', marginBottom: 'var(--spacing-xs)', textTransform: 'uppercase' }}>
                                        Total POS
                                    </div>
                                    <div style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: 'var(--font-size-lg)' }}>
                                        {formatCurrency(cierre.totalPos)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                />
            )}
        </>
    );
};
