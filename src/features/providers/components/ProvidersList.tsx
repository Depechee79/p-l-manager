import React, { useState, useMemo } from 'react';
import { Pencil, Trash2, Search, Truck, Plus } from 'lucide-react';
import { Button, Input, Table, TableColumn } from '@shared/components';
import type { Provider } from '@types';

interface ProvidersListProps {
    providers: Provider[];
    loading: boolean;
    onEdit: (provider: Provider) => void;
    onDelete: (provider: Provider) => void;
    onNew: () => void;
}

export const ProvidersList: React.FC<ProvidersListProps> = ({
    providers,
    loading,
    onEdit,
    onDelete,
    onNew,
}) => {
    const [searchQuery, setSearchQuery] = useState('');

    // Universal search - searches in all fields
    const filteredProviders = useMemo(() => {
        if (!searchQuery.trim()) {
            return providers;
        }

        const query = searchQuery.toLowerCase().trim();
        return providers.filter((provider) => {
            const searchableFields = [
                provider.nombre,
                provider.cif,
                provider.contacto,
                provider.telefono,
                provider.email,
                provider.direccion,
                provider.ciudad,
                provider.provincia,
                provider.codigoPostal,
                provider.notas,
            ].filter(Boolean).map(f => String(f).toLowerCase());

            return searchableFields.some(field => field.includes(query));
        });
    }, [providers, searchQuery]);

    const columns: TableColumn<Provider>[] = [
        {
            key: 'nombre',
            header: 'Nombre',
            sortable: true,
        },
        {
            key: 'cif',
            header: 'CIF',
            sortable: true,
        },
        {
            key: 'contacto',
            header: 'Contacto',
            sortable: false,
        },
        {
            key: 'telefono',
            header: 'Teléfono',
            sortable: false,
            render: (_, provider) => provider.telefono || '-',
        },
        {
            key: 'ciudad',
            header: 'Ciudad',
            sortable: true,
            render: (_, provider) => provider.ciudad || '-',
        },
    ];

    const renderExpandedRow = (provider: Provider) => (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--spacing-lg)', padding: 'var(--spacing-md)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)', flex: 1 }}>
                <div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 'var(--spacing-xs)' }}>Dirección</div>
                    <div style={{ color: 'var(--text-main)', fontWeight: '500' }}>{provider.direccion || '-'}</div>
                </div>
                <div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 'var(--spacing-xs)' }}>Email</div>
                    <div style={{ color: 'var(--text-main)', fontWeight: '500' }}>{provider.email || '-'}</div>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 'var(--spacing-xs)' }}>Notas</div>
                    <div style={{ color: 'var(--text-main)', fontWeight: '500' }}>{provider.notas || '-'}</div>
                </div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit(provider);
                    }}
                >
                    <Pencil size={14} /> Editar
                </Button>
                <Button
                    variant="danger"
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(provider);
                    }}
                >
                    <Trash2 size={14} /> Eliminar
                </Button>
            </div>
        </div>
    );

    if (providers.length === 0 && !loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, fontSize: 'var(--font-size-lg)', color: 'var(--text-main)' }}>Proveedores</h2>
                </div>
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: 'var(--spacing-xl) var(--spacing-md)', textAlign: 'center',
                    backgroundColor: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)',
                }}>
                    <Truck size={48} style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)' }} />
                    <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--text-main)', marginBottom: 'var(--spacing-xs)' }}>
                        No hay proveedores registrados
                    </h3>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)' }}>
                        Registra tus proveedores para gestionar pedidos y albaranes.
                    </p>
                    <Button variant="primary" onClick={onNew}>
                        <Plus size={16} style={{ marginRight: 'var(--spacing-xs)' }} /> Nuevo Proveedor
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--spacing-md)',
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, fontSize: 'var(--font-size-lg)', color: 'var(--text-main)' }}>Proveedores</h2>
                    <Button onClick={onNew} variant="primary" aria-label="Nuevo proveedor">
                        <span className="hidden-mobile">Nuevo Proveedor</span>
                        <span className="visible-mobile">+</span>
                    </Button>
                </div>

                <div style={{ width: '100%', maxWidth: '500px' }}>
                    <Input
                        type="text"
                        placeholder="Buscar por nombre, CIF, ciudad, teléfono..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        fullWidth
                        icon={<Search size={18} />}
                        iconPosition="left"
                    />
                </div>
            </div>

            <div className="hidden-mobile">
                <Table
                    data={filteredProviders}
                    columns={columns}
                    loading={loading}
                    hoverable
                    striped
                    emptyText="No hay proveedores que coincidan con la búsqueda"
                    expandedRowRender={renderExpandedRow}
                    onRowClick={(provider) => onEdit(provider)}
                />
            </div>

            <div className="visible-mobile" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                {filteredProviders.map((provider) => (
                    <div
                        key={String(provider.id)}
                        onClick={() => onEdit(provider)}
                        style={{
                            backgroundColor: 'var(--surface)',
                            padding: 'var(--spacing-md)',
                            borderRadius: 'var(--radius)',
                            border: '1px solid var(--border)',
                            boxShadow: 'var(--shadow-sm)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-1)' }}>
                            <h3 style={{ margin: 0, fontSize: 'var(--font-size-base)', fontWeight: '600', color: 'var(--text-main)' }}>
                                {provider.nombre}
                            </h3>
                            <div style={{ display: 'flex', gap: 'var(--spacing-1)' }} onClick={(e) => e.stopPropagation()}>
                                <Button size="sm" variant="secondary" onClick={() => onEdit(provider)}>
                                    <Pencil size={14} />
                                </Button>
                                <Button size="sm" variant="danger" onClick={() => onDelete(provider)}>
                                    <Trash2 size={14} />
                                </Button>
                            </div>
                        </div>
                        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
                            {provider.contacto}
                        </div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                            {provider.telefono} {provider.email ? `• ${provider.email}` : ''}
                        </div>
                    </div>
                ))}
                {filteredProviders.length === 0 && !loading && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--spacing-xl)', textAlign: 'center' }}>
                        <Truck size={40} style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-sm)' }} />
                        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                            No hay proveedores que coincidan con la búsqueda
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
