import React from 'react';
import { Table, Card } from '@components';
import type { Role } from '../users.types';
import { PERMISSION_GROUPS } from '@shared/config';

interface RolesListProps {
    roles: Role[];
    loading?: boolean;
}

export const RolesList: React.FC<RolesListProps> = ({ roles, loading }) => {
    return (
        <Card>
            <Table
                loading={loading}
                data={roles}
                columns={[
                    {
                        key: 'nombre',
                        header: 'Nombre',
                        render: (_, role) => <span style={{ fontWeight: '500' }}>{role.nombre}</span>,
                        sortable: true,
                    },
                    {
                        key: 'descripcion',
                        header: 'Descripción',
                        sortable: false,
                    },
                    {
                        key: 'permisos',
                        header: 'Permisos',
                        render: (_, role) => (
                            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                                {role.permisos.length} permisos
                            </span>
                        ),
                        sortable: false,
                    },
                    {
                        key: 'zonasInventario',
                        header: 'Zonas',
                        render: (_, role) => (
                            <div style={{ display: 'flex', gap: 'var(--spacing-xs)', flexWrap: 'wrap' }}>
                                {role.zonasInventario?.map(zona => (
                                    <span key={zona} className="badge badge-info" style={{ fontSize: 'var(--font-size-xs)' }}>
                                        {zona === 'bar' ? 'Barra' : zona === 'cocina' ? 'Cocina' : zona === 'camara' ? 'Cámara' : 'Almacén'}
                                    </span>
                                ))}
                            </div>
                        ),
                        sortable: false,
                    },
                ]}
                hoverable
                striped
                emptyText="No hay roles definidos"
                expandedRowRender={(role) => (
                    <div style={{ padding: 'var(--spacing-lg)' }}>
                        <div style={{ marginBottom: 'var(--spacing-md)' }}>
                            <h4 style={{ marginBottom: 'var(--spacing-sm)', fontSize: 'var(--font-size-base)', fontWeight: '600' }}>
                                Permisos Detallados
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                                {PERMISSION_GROUPS.map(group => {
                                    const groupPerms = role.permisos.filter(p => group.permissions.includes(p));
                                    if (groupPerms.length === 0) return null;

                                    return (
                                        <div key={group.label} style={{ padding: 'var(--spacing-sm)', backgroundColor: 'var(--surface-muted)', borderRadius: 'var(--radius)' }}>
                                            <div style={{ fontWeight: '600', marginBottom: 'var(--spacing-xs)', fontSize: 'var(--font-size-sm)' }}>
                                                {group.label}
                                            </div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)' }}>
                                                {groupPerms.map(perm => (
                                                    <span key={perm} className="badge badge-success" style={{ fontSize: 'var(--font-size-xs)' }}>
                                                        {perm.split('.').pop()}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            />
        </Card>
    );
};
