import React from 'react';
import { Button, Input, Table } from '@shared/components';
import { Plus, Search, Edit, Package } from 'lucide-react';
import { formatCurrency } from '@utils/formatters';
import type { Escandallo } from '@types';

interface EscandalloListProps {
    escandallos: Escandallo[];
    loading?: boolean;
    onEdit: (escandallo: Escandallo) => void;
    onNew: () => void;
    searchQuery: string;
    onSearchChange: (q: string) => void;
    monthFilter: string;
    onMonthFilterChange: (m: string) => void;
}

export const EscandalloList: React.FC<EscandalloListProps> = ({
    escandallos,
    loading = false,
    onEdit,
    onNew,
    searchQuery,
    onSearchChange,
    monthFilter,
    onMonthFilterChange,
}) => {
    return (
        <div className="escandallo-list">
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 'var(--spacing-lg)',
                    flexWrap: 'wrap',
                    gap: 'var(--spacing-md)',
                }}
            >
                <h2 style={{ margin: 0, fontSize: 'var(--font-size-2xl)', fontWeight: '600', color: 'var(--text-main)' }}>
                    Escandallos
                </h2>
                <Button onClick={onNew} variant="primary">
                    <Plus size={16} /> Nuevo Escandallo
                </Button>
            </div>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(200px, 400px) minmax(150px, 200px)',
                    gap: 'var(--spacing-md)',
                    marginBottom: 'var(--spacing-lg)',
                }}
            >
                <Input
                    type="text"
                    placeholder="Buscar escandallo..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    fullWidth
                    icon={<Search size={18} />}
                    iconPosition="left"
                />
                <div style={{ position: 'relative' }}>
                    <input
                        type="month"
                        value={monthFilter}
                        onChange={(e) => onMonthFilterChange(e.target.value)}
                        className="input-field"
                        style={{
                            width: '100%',
                            height: '40px',
                            boxSizing: 'border-box',
                            padding: '0 12px',
                            fontSize: 'var(--font-size-base)',
                            fontFamily: 'var(--font-body)',
                            backgroundColor: 'var(--surface-muted)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius)',
                            color: 'var(--text-main)',
                        }}
                    />
                </div>
            </div>

            <Table
                data={escandallos}
                loading={loading}
                columns={[
                    {
                        key: 'imagen',
                        header: 'Foto',
                        render: (_, row) => {
                            const imagen = (row as any).imagen;
                            return imagen ? (
                                <img
                                    src={imagen}
                                    alt={row.nombre}
                                    style={{
                                        width: '48px',
                                        height: '48px',
                                        objectFit: 'cover',
                                        borderRadius: 'var(--radius)',
                                        border: '1px solid var(--border)',
                                    }}
                                />
                            ) : (
                                <div
                                    style={{
                                        width: '48px',
                                        height: '48px',
                                        backgroundColor: 'var(--surface-muted)',
                                        borderRadius: 'var(--radius)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'var(--text-secondary)',
                                    }}
                                >
                                    <Package size={20} />
                                </div>
                            );
                        },
                        sortable: false,
                    },
                    {
                        key: 'nombre',
                        header: 'Nombre del Plato',
                        render: (_, row) => <span style={{ fontWeight: '500', color: 'var(--text-main)' }}>{row.nombre}</span>,
                        sortable: true,
                    },
                    {
                        key: 'pvpConIVA',
                        header: 'PVP (IVA inc.)',
                        render: (_, row) => `${formatCurrency(row.pvpConIVA)} (${row.tipoIVA}%)`,
                        sortable: true,
                    },
                    {
                        key: 'foodCostPct',
                        header: 'Food Cost',
                        render: (_, row) => (
                            <span
                                style={{
                                    color: row.foodCostPct > 35 ? 'var(--danger)' : 'var(--success)',
                                    fontWeight: '600',
                                }}
                            >
                                {row.foodCostPct.toFixed(1)}%
                            </span>
                        ),
                        sortable: true,
                    },
                    {
                        key: 'margenBrutoPct',
                        header: 'Margen Bruto',
                        render: (_, row) => (
                            <span style={{ color: 'var(--info)', fontWeight: '600' }}>{row.margenBrutoPct.toFixed(1)}%</span>
                        ),
                        sortable: true,
                    },
                ]}
                onRowClick={onEdit}
                hoverable
                striped
                emptyText="No hay escandallos registrados"
                expandedRowRender={(escandallo) => (
                    <div style={{ padding: 'var(--spacing-lg)' }}>
                        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                            <h4 style={{ margin: '0 0 var(--spacing-md) 0', color: 'var(--text-main)', fontSize: 'var(--font-size-lg)' }}>
                                Ingredientes
                            </h4>
                            <table style={{ width: '100%', fontSize: 'var(--font-size-sm)', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                        <th style={{ textAlign: 'left', padding: 'var(--spacing-sm)', color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: 'var(--font-size-xs)' }}>
                                            Ingrediente
                                        </th>
                                        <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)', color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: 'var(--font-size-xs)' }}>
                                            Cantidad
                                        </th>
                                        <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)', color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: 'var(--font-size-xs)' }}>
                                            Coste
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {escandallo.ingredientes.map((ing, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: 'var(--spacing-sm)', color: 'var(--text-main)' }}>{ing.nombre}</td>
                                            <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)', color: 'var(--text-main)' }}>
                                                {ing.cantidad} {ing.unidad}
                                            </td>
                                            <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)', color: 'var(--text-main)' }}>
                                                {formatCurrency(ing.costeTotal)}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr style={{ backgroundColor: 'var(--surface-muted)', fontWeight: '700' }}>
                                        <td style={{ padding: 'var(--spacing-md)', color: 'var(--text-main)' }}>Total Coste</td>
                                        <td></td>
                                        <td style={{ textAlign: 'right', padding: 'var(--spacing-md)', color: 'var(--text-main)' }}>
                                            {formatCurrency(escandallo.ingredientes.reduce((sum, i) => sum + i.costeTotal, 0))}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {(escandallo as any).imagen && (
                            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                                <h4 style={{ margin: '0 0 var(--spacing-md) 0', color: 'var(--text-main)', fontSize: 'var(--font-size-lg)' }}>
                                    Foto del Emplatado
                                </h4>
                                <img
                                    src={(escandallo as any).imagen}
                                    alt={escandallo.nombre}
                                    style={{
                                        width: '100%',
                                        maxWidth: '400px',
                                        height: 'auto',
                                        borderRadius: 'var(--radius)',
                                        border: '1px solid var(--border)',
                                        objectFit: 'cover',
                                    }}
                                />
                            </div>
                        )}

                        {escandallo.notas && (
                            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                                <h4 style={{ margin: '0 0 var(--spacing-xs) 0', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                                    Notas
                                </h4>
                                <p style={{ margin: 0, color: 'var(--text-main)', fontSize: 'var(--font-size-sm)', whiteSpace: 'pre-wrap' }}>
                                    {escandallo.notas}
                                </p>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end' }}>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(escandallo);
                                }}
                            >
                                <Edit size={14} /> Editar
                            </Button>
                        </div>
                    </div>
                )}
            />
        </div>
    );
};
