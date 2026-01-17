import React from 'react';
import { Button, Input, Table } from '@components';
import { UserPlus, Shield, Edit, Trash2, Lock, Unlock, Search } from 'lucide-react';
import { formatDate } from '@utils/formatters';
import type { AppUser, Role } from '../users.types';

interface UserListProps {
    users: AppUser[];
    roles: Role[];
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onEdit: (user: AppUser) => void;
    onDelete: (user: AppUser) => void;
    onToggleActive: (user: AppUser) => void;
    onViewRoles: () => void;
    onCreate: () => void;
    getRoleName: (rolId: string | number) => string;
}

export const UserList: React.FC<UserListProps> = ({
    users,
    searchQuery,
    onSearchChange,
    onEdit,
    onDelete,
    onToggleActive,
    onViewRoles,
    onCreate,
    getRoleName
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
                    Usuarios y Roles
                </h2>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    <Button onClick={onViewRoles} variant="secondary">
                        <Shield size={16} /> Roles
                    </Button>
                    <Button onClick={onCreate} variant="primary">
                        <UserPlus size={16} /> Nuevo Usuario
                    </Button>
                </div>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 'var(--spacing-md)',
                marginBottom: 'var(--spacing-lg)',
            }}>
                <Input
                    type="text"
                    placeholder="Buscar usuario..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    fullWidth
                    icon={<Search size={18} />}
                    iconPosition="left"
                />
            </div>

            <Table
                data={users}
                columns={[
                    {
                        key: 'nombre',
                        header: 'Nombre',
                        render: (_, user) => <span style={{ fontWeight: '500' }}>{user.nombre}</span>,
                        sortable: true,
                    },
                    {
                        key: 'email',
                        header: 'Email',
                        render: (_, user) => user.email || '-',
                        sortable: true,
                    },
                    {
                        key: 'rolId',
                        header: 'Rol',
                        render: (_, user) => getRoleName(user.rolId),
                        sortable: true,
                    },
                    {
                        key: 'activo',
                        header: 'Estado',
                        render: (_, user) => (
                            <span className={`badge ${user.activo ? 'badge-success' : 'badge-danger'}`}>
                                {user.activo ? 'Activo' : 'Inactivo'}
                            </span>
                        ),
                        sortable: true,
                    },
                    {
                        key: 'ultimoAcceso',
                        header: 'Último Acceso',
                        render: (_, user) => user.ultimoAcceso ? formatDate(user.ultimoAcceso) : '-',
                        sortable: true,
                    },
                ]}
                onRowClick={(user) => onEdit(user)}
                hoverable
                striped
                emptyText="No hay usuarios registrados"
                expandedRowRender={(user) => (
                    <div style={{ padding: 'var(--spacing-lg)' }}>
                        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end', marginBottom: 'var(--spacing-md)' }}>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleActive(user);
                                }}
                            >
                                {user.activo ? <Lock size={14} /> : <Unlock size={14} />}
                                {user.activo ? ' Desactivar' : ' Activar'}
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(user);
                                }}
                            >
                                <Edit size={14} /> Editar
                            </Button>
                            <Button
                                variant="danger"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(user);
                                }}
                            >
                                <Trash2 size={14} /> Eliminar
                            </Button>
                        </div>
                    </div>
                )}
            />
        </>
    );
};
