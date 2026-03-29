/**
 * RolesTab - Componente de gestion de roles para ConfigPage
 *
 * Permite ver, editar y eliminar roles del sistema.
 * Integrado como tab dentro de RestaurantConfigPage.
 * 
 * AUDIT-2 Update:
 * - Soporte para roles personalizados ilimitados (eliminado filtro restrictivo).
 * - Protección de roles de sistema (no borrables, nombre no editable).
 * - Distinción visual entre roles de Sistema y Custom.
 */
import React, { useState, useEffect } from 'react';
import { Timestamp } from 'firebase/firestore';
import {

    Card,
    Button,
    Modal,
    Input,
    Checkbox
} from '@shared/components';
import { Shield, Plus, Lock, Search, Pencil, Trash2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useDatabase } from '@core';
import { PERMISSION_GROUPS } from '@shared/config';
import { getAllSystemRoles } from '@shared/config/systemRoles';
import { useToast } from '@utils/toast';
import { logger } from '@core/services/LoggerService';
import type { Role, Permission } from '@types';

// Roles del sistema que no deben ser eliminados ni renombrados
const SYSTEM_ROLE_NAMES = [
    'Director de Operaciones',
    'Director de Restaurante',
    'Encargado',
    'Jefe de Cocina',
    'Camarero',
    'Cocinero'
];

interface RolesTabProps {
    onRegisterActions?: (actions: React.ReactNode) => void;
}

export const RolesTab: React.FC<RolesTabProps> = ({ onRegisterActions }) => {
    const { db } = useDatabase();
    // ... (keep existing hooks)
    const { showToast } = useToast();

    // Load data on mount
    useEffect(() => {
        const loadData = async () => {
            try {
                await db.ensureLoaded('roles');
            } catch (error: unknown) {
                logger.error("Error loading roles data", error instanceof Error ? error.message : String(error));
            }
        };
        loadData();
    }, [db]);

    const [roles, setRoles] = useState<Role[]>([]);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [editedPermissions, setEditedPermissions] = useState<Permission[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // UX States
    const [viewMode, setViewMode] = useState<'list' | 'edit'>('list');
    const [searchTerm, setSearchTerm] = useState('');
    const [isNewRoleModalOpen, setIsNewRoleModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');
    const [roleToDelete, setRoleToDelete] = useState<Role | null>(null); // State for list delete

    // Load roles logic (keep as is)
    useEffect(() => {
        const loadedRoles = (db.roles || []) as Role[];
        if (loadedRoles.length === 0) {
            const initialRoles = getAllSystemRoles().map(r => ({ ...r, createdAt: Timestamp.now() } as Role));
            initialRoles.forEach(role => db.add('roles', role));
            setRoles(initialRoles);
        } else {
            const uniqueRoles = Array.from(new Map(loadedRoles.map(item => [item.nombre, item])).values());
            const sortedRoles = uniqueRoles.sort((a, b) => {
                const isSystemA = SYSTEM_ROLE_NAMES.includes(a.nombre);
                const isSystemB = SYSTEM_ROLE_NAMES.includes(b.nombre);
                if (isSystemA && !isSystemB) return -1;
                if (!isSystemA && isSystemB) return 1;
                return a.nombre.localeCompare(b.nombre);
            });
            setRoles(sortedRoles);
        }
    }, [db.roles]);

    const filteredRoles = roles.filter(r =>
        r.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleEditRole = (role: Role) => {
        setSelectedRole(role);
        setEditedPermissions([...role.permisos]);
        setViewMode('edit');
    };

    const handleBackToList = () => {
        setSelectedRole(null);
        setViewMode('list');
    };

    const togglePermission = (perm: Permission) => {
        if (editedPermissions.includes(perm)) {
            setEditedPermissions(prev => prev.filter(p => p !== perm));
        } else {
            setEditedPermissions(prev => [...prev, perm]);
        }
    };

    const openCreateModal = () => {
        setNewRoleName('');
        setIsNewRoleModalOpen(true);
    };

    const handleSavePermissions = async () => {
        if (!selectedRole) return;
        setIsSaving(true);
        try {
            await db.update('roles', selectedRole.id, { permisos: editedPermissions } as Partial<Role>);
            setRoles(prev => prev.map(r =>
                r.id === selectedRole.id ? { ...r, permisos: editedPermissions } : r
            ));
            setSelectedRole({ ...selectedRole, permisos: editedPermissions });
            showToast({ type: 'success', title: 'Permisos guardados', message: `Los permisos del rol "${selectedRole.nombre}" han sido actualizados` });
            setViewMode('list');
        } catch (error: unknown) {
            logger.error('Error saving permissions', error instanceof Error ? error.message : String(error));
            showToast({ type: 'error', title: 'Error', message: 'No se pudieron guardar los permisos' });
        } finally {
            setIsSaving(false);
        }
    };

    // Create Logic (keep as is)
    const handleCreateSubmit = async () => {
        if (!newRoleName.trim()) return;
        if (roles.some(r => r.nombre.toLowerCase().trim() === newRoleName.trim().toLowerCase())) {
            showToast({ type: 'error', title: 'Error', message: `El rol "${newRoleName}" ya existe` });
            return;
        }
        setIsSaving(true);
        try {
            const newRole: Omit<Role, 'id'> = { nombre: newRoleName, permisos: [], descripcion: 'Rol personalizado' };
            const created = await db.add('roles', newRole, { silent: true }) as Role;
            setRoles([...roles, created]);
            setIsNewRoleModalOpen(false);
            handleEditRole(created); // Auto-select
            showToast({ type: 'success', title: 'Rol creado', message: 'Configura ahora sus permisos.' });
        } catch (error: unknown) {
            logger.error('Error creando rol', error instanceof Error ? error.message : String(error));
            showToast({ type: 'error', title: 'Error', message: 'No se pudo crear el rol.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteRole = async () => {
        const targetRole = selectedRole || roleToDelete;
        if (!targetRole || !targetRole.id) return;

        setIsSaving(true);
        try {
            await db.delete('roles', targetRole.id);
            setRoles(prev => prev.filter(r => r.id !== targetRole.id));
            showToast({ type: 'success', title: 'Rol eliminado', message: 'El rol ha sido eliminado correctamente.' });
            setIsDeleteModalOpen(false);
            setViewMode('list');
            setSelectedRole(null);
            setRoleToDelete(null);
        } catch (error: unknown) {
            logger.error('Error eliminando rol', error instanceof Error ? error.message : String(error));
            showToast({ type: 'error', title: 'Error', message: 'No se pudo eliminar el rol.' });
        } finally {
            setIsSaving(false);
        }
    };

    const hasChanges = selectedRole &&
        JSON.stringify([...editedPermissions].sort()) !==
        JSON.stringify([...selectedRole.permisos].sort());


    // EFFECT: Hoist Actions to Parent -> REMOVED. Actions are now local.
    useEffect(() => {
        if (!onRegisterActions) return;
        onRegisterActions(null); // Clear any global actions when mounting/updating
    }, [onRegisterActions, viewMode]); // Clear on viewMode change just in case


    // VISTA EDICIÓN
    if (viewMode === 'edit' && selectedRole) {
        return (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.3s ease' }}>
                {/* Content only - Header is local now */}

                <Card
                    style={{ flex: 1, minHeight: 0, padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
                    bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
                >
                    {/* Header Local Edición */}
                    <div style={{
                        padding: '16px 24px',
                        borderBottom: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'var(--surface)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '32px', height: '32px', borderRadius: '6px',
                                background: 'rgba(var(--primary-rgb), 0.1)', color: 'var(--primary)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Shield size={18} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{selectedRole.nombre}</h3>
                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Editando permisos</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <Button
                                variant="secondary"
                                onClick={handleBackToList}
                                disabled={isSaving}
                                icon={<ArrowLeft size={16} />}
                            >
                                Volver
                            </Button>
                            {hasChanges && (
                                <Button
                                    variant="primary"
                                    onClick={handleSavePermissions}
                                    disabled={isSaving}
                                >
                                    {isSaving ? 'Guardando...' : 'Guardar'}
                                </Button>
                            )}
                        </div>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '24px', background: 'var(--surface-muted)', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '32px', alignContent: 'start' }}>
                        {PERMISSION_GROUPS.map((group) => (
                            <div key={group.label} style={{ animation: 'fadeIn 0.3s ease' }}>
                                {/* Título Sección */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    marginBottom: '12px',
                                    paddingBottom: '8px',
                                    borderBottom: '2px solid rgba(var(--primary-rgb), 0.1)'
                                }}>
                                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--primary)' }}>
                                        {group.label}
                                    </h4>
                                </div>

                                {/* Grid Denso - UPDATE: Column Layout strict */}
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '8px',
                                }}>
                                    {group.permissions.map(perm => {
                                        const isEnabled = editedPermissions.includes(perm);
                                        const permName = perm.split('.').pop() || perm;
                                        const friendlyName: Record<string, string> = {
                                            'view': 'Ver / Acceder',
                                            'create': 'Crear',
                                            'edit': 'Editar',
                                            'delete': 'Eliminar',
                                            'export': 'Exportar'
                                        };

                                        const isDelete = permName === 'delete';
                                        const finalLabel = friendlyName[permName] || permName;

                                        return (
                                            <Checkbox
                                                key={perm}
                                                checked={isEnabled}
                                                onChange={() => togglePermission(perm)}
                                                label={finalLabel}
                                                style={{
                                                    padding: '8px 12px',
                                                    borderRadius: '6px',
                                                    background: isEnabled ? (isDelete ? 'rgba(var(--danger-rgb), 0.05)' : 'rgba(var(--primary-rgb), 0.05)') : 'transparent',
                                                    border: isEnabled ? (isDelete ? '1px solid var(--danger-light)' : '1px solid var(--primary-light)') : '1px solid transparent',
                                                    transition: 'all 0.2s ease',
                                                    width: '100%',
                                                    fontSize: '13px',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card >
            </div >
        );
    }

    return (
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.4s ease' }}>
            <Card
                style={{ flex: 1, minHeight: 0, padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
                bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
            >
                {/* Header Lista con Filtro - Botón Nuevo Rol Restored Locally */}
                <div style={{ flex: '0 0 auto', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ width: '300px' }}>
                        <Input
                            placeholder="Buscar rol..."
                            icon={<Search size={18} />}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ margin: 0 }}
                        />
                    </div>
                    <Button variant="primary" icon={<Plus size={16} />} onClick={openCreateModal}>
                        Nuevo Rol
                    </Button>
                </div>

                {/* Lista Vertical con Scroll Interno */}
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                    {filteredRoles.map(role => {
                        const isSystem = SYSTEM_ROLE_NAMES.includes(role.nombre);

                        return (
                            <div
                                key={role.id}
                                onClick={() => handleEditRole(role)}
                                style={{
                                    padding: '16px 24px',
                                    borderBottom: '1px solid var(--border-light)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    cursor: 'pointer',
                                    background: 'var(--surface)',
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-muted)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--surface)'}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: '8px',
                                        background: isSystem ? 'rgba(var(--warning-rgb), 0.1)' : 'rgba(var(--primary-rgb), 0.1)',
                                        color: isSystem ? 'var(--warning-dark)' : 'var(--primary)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        {isSystem ? <Lock size={20} /> : <Shield size={20} />}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '15px' }}>{role.nombre}</div>
                                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                            {role.permisos.length} permisos habilitados
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Button
                                        variant="ghost"
                                        icon={<Pencil size={16} />}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditRole(role);
                                        }}
                                    >
                                        Editar
                                    </Button>

                                    <Button
                                        variant="ghost"
                                        style={{
                                            color: 'var(--danger)',
                                            opacity: 0.8,
                                            cursor: 'pointer'
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setRoleToDelete(role);
                                            setIsDeleteModalOpen(true);
                                        }}
                                        title="Eliminar Rol"
                                    >
                                        <Trash2 size={16} />
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                    {filteredRoles.length === 0 && (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            No se encontraron roles
                        </div>
                    )}
                </div>
            </Card>

            {/* Modal Creación Simple */}
            <Modal
                open={isNewRoleModalOpen}
                onClose={() => setIsNewRoleModalOpen(false)}
                title="Nuevo Rol"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <Input
                        label="Nombre del Rol"
                        value={newRoleName}
                        onChange={(e) => setNewRoleName(e.target.value)}
                        placeholder="Ej: Supervisor de Zona"
                        autoFocus
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                        <Button variant="ghost" onClick={() => setIsNewRoleModalOpen(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={handleCreateSubmit} disabled={!newRoleName.trim()}>
                            Crear y Configurar
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Modal Confirmación Borrado */}
            <Modal
                open={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Eliminar Rol"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '8px 0' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '50%',
                            background: 'var(--danger-light)', color: 'var(--danger)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: 'var(--text-main)' }}>¿Estás seguro?</h4>
                            <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                Esta acción eliminará permanentemente el rol <strong>{(roleToDelete || selectedRole)?.nombre}</strong>.
                                Los usuarios asignados a este rol perderán sus permisos.
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                        <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</Button>
                        <Button
                            variant="primary"
                            onClick={handleDeleteRole}
                            disabled={isSaving}
                            className="bg-danger border-danger hover:bg-danger-dark"
                        >
                            {isSaving ? 'Eliminando...' : 'Eliminar Rol'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

