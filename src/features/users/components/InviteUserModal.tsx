/**
 * InviteUserModal - Modal for admins to invite new users
 *
 * Allows selecting role, restaurant, and optionally pre-filling user data.
 * Generates an invitation link that can be shared.
 */
import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, FormSection } from '@shared/components';
import { createInvitation } from '@core/services/AuthService';
import { SYSTEM_ROLES, getInvitableRoles } from '@shared/config/systemRoles';
import { useDatabase } from '@core';
import { Mail, Shield, Copy, Check, Link as LinkIcon } from 'lucide-react';
import type { RoleId, Restaurant } from '@types';

interface InviteUserModalProps {
    open: boolean;
    onClose: () => void;
    currentUserRoleId: RoleId;
    currentUserUid: string;
    currentUserRestaurantIds: string[];
    companyId?: string;
}

export const InviteUserModal: React.FC<InviteUserModalProps> = ({
    open,
    onClose,
    currentUserRoleId,
    currentUserUid,
    currentUserRestaurantIds,
    companyId,
}) => {
    const { db } = useDatabase();

    // Form state
    const [email, setEmail] = useState('');
    const [selectedRoleId, setSelectedRoleId] = useState<RoleId | ''>('');
    const [selectedRestaurantIds, setSelectedRestaurantIds] = useState<string[]>([]);
    const [nombre, setNombre] = useState('');
    const [telefono, setTelefono] = useState('');

    // UI state
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [generatedLink, setGeneratedLink] = useState('');
    const [copied, setCopied] = useState(false);

    // Available options
    const invitableRoles = getInvitableRoles(currentUserRoleId);
    const availableRestaurants = (db.restaurants || []) as Restaurant[];

    // Reset form when modal opens
    useEffect(() => {
        if (open) {
            setEmail('');
            setSelectedRoleId('');
            setSelectedRestaurantIds(currentUserRestaurantIds.slice(0, 1)); // Default to first restaurant
            setNombre('');
            setTelefono('');
            setError('');
            setGeneratedLink('');
            setCopied(false);
        }
    }, [open, currentUserRestaurantIds]);

    const handleCreateInvitation = async () => {
        // Validate
        if (!email.trim() || !email.includes('@')) {
            setError('Introduce un email válido');
            return;
        }
        if (!selectedRoleId) {
            setError('Selecciona un rol');
            return;
        }
        if (selectedRestaurantIds.length === 0) {
            setError('Selecciona al menos un restaurante');
            return;
        }

        setIsLoading(true);
        setError('');

        const result = await createInvitation(
            currentUserUid,
            email,
            selectedRoleId,
            selectedRestaurantIds,
            companyId,
            nombre || telefono ? { nombre: nombre || undefined, telefono: telefono || undefined } : undefined
        );

        if (result.success && result.invitation) {
            // Generate the invitation link
            const baseUrl = window.location.origin;
            const link = `${baseUrl}/registro?token=${result.invitation.token}`;
            setGeneratedLink(link);
        } else {
            setError(result.error || 'Error al crear la invitación');
        }

        setIsLoading(false);
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(generatedLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const toggleRestaurant = (restaurantId: string) => {
        if (selectedRestaurantIds.includes(restaurantId)) {
            setSelectedRestaurantIds(prev => prev.filter(id => id !== restaurantId));
        } else {
            setSelectedRestaurantIds(prev => [...prev, restaurantId]);
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Invitar usuario"
            size="md"
        >
            {generatedLink ? (
                // Success state - show link
                <div>
                    <div style={{
                        textAlign: 'center',
                        marginBottom: 'var(--spacing-lg)'
                    }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--success-light)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto var(--spacing-md)'
                        }}>
                            <Check size={32} style={{ color: 'var(--success)' }} />
                        </div>
                        <h3 style={{ marginBottom: 'var(--spacing-xs)' }}>Invitación creada</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                            Comparte este enlace con {email}
                        </p>
                    </div>

                    <div style={{
                        backgroundColor: 'var(--surface-muted)',
                        borderRadius: 'var(--radius)',
                        padding: 'var(--spacing-md)',
                        marginBottom: 'var(--spacing-md)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-sm)'
                    }}>
                        <LinkIcon size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                        <div style={{
                            flex: 1,
                            fontSize: 'var(--font-size-sm)',
                            wordBreak: 'break-all',
                            color: 'var(--text-main)'
                        }}>
                            {generatedLink}
                        </div>
                        <Button
                            variant={copied ? 'success' : 'secondary'}
                            onClick={handleCopyLink}
                            style={{ flexShrink: 0 }}
                        >
                            {copied ? <Check size={16} /> : <Copy size={16} />}
                        </Button>
                    </div>

                    <div style={{
                        backgroundColor: 'var(--warning-light)',
                        borderRadius: 'var(--radius)',
                        padding: 'var(--spacing-md)',
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--warning-dark)'
                    }}>
                        <strong>Nota:</strong> El enlace expira en 7 días. El usuario recibirá
                        el rol de <strong>{SYSTEM_ROLES[selectedRoleId as RoleId]?.nombre}</strong>.
                    </div>

                    <div style={{ marginTop: 'var(--spacing-lg)', display: 'flex', gap: 'var(--spacing-sm)' }}>
                        <Button variant="secondary" onClick={onClose} style={{ flex: 1 }}>
                            Cerrar
                        </Button>
                        <Button
                            variant="primary"
                            onClick={() => {
                                setGeneratedLink('');
                                setEmail('');
                                setNombre('');
                                setTelefono('');
                            }}
                            style={{ flex: 1 }}
                        >
                            Invitar otro
                        </Button>
                    </div>
                </div>
            ) : (
                // Form state
                <div>
                    <FormSection>
                        <Input
                            label="Email del usuario"
                            type="email"
                            placeholder="usuario@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            fullWidth
                            autoFocus
                        />
                    </FormSection>

                    {/* Role Selection */}
                    <FormSection title="Rol asignado">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                            {invitableRoles.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                                    No tienes permisos para invitar usuarios.
                                </p>
                            ) : (
                                invitableRoles.map(roleId => {
                                    const role = SYSTEM_ROLES[roleId];
                                    return (
                                        <div
                                            key={roleId}
                                            onClick={() => setSelectedRoleId(roleId)}
                                            style={{
                                                padding: 'var(--spacing-sm) var(--spacing-md)',
                                                borderRadius: 'var(--radius)',
                                                border: selectedRoleId === roleId
                                                    ? '2px solid var(--primary)'
                                                    : '1px solid var(--border)',
                                                backgroundColor: selectedRoleId === roleId
                                                    ? 'var(--primary-lighter)'
                                                    : 'var(--surface)',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 'var(--spacing-sm)'
                                            }}
                                        >
                                            <Shield size={16} style={{
                                                color: selectedRoleId === roleId ? 'var(--primary)' : 'var(--text-muted)'
                                            }} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 500, fontSize: 'var(--font-size-sm)' }}>
                                                    {role.nombre}
                                                </div>
                                                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                                                    {role.descripcion}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </FormSection>

                    {/* Restaurant Selection */}
                    <FormSection title="Restaurante(s) asignado(s)">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                            {availableRestaurants
                                .filter(r => currentUserRestaurantIds.includes(r.id as string))
                                .map(restaurant => (
                                    <div
                                        key={restaurant.id as string}
                                        onClick={() => toggleRestaurant(restaurant.id as string)}
                                        style={{
                                            padding: 'var(--spacing-sm) var(--spacing-md)',
                                            borderRadius: 'var(--radius)',
                                            border: selectedRestaurantIds.includes(restaurant.id as string)
                                                ? '2px solid var(--primary)'
                                                : '1px solid var(--border)',
                                            backgroundColor: selectedRestaurantIds.includes(restaurant.id as string)
                                                ? 'var(--primary-lighter)'
                                                : 'var(--surface)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'var(--spacing-sm)'
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedRestaurantIds.includes(restaurant.id as string)}
                                            onChange={() => { }}
                                            style={{ margin: 0 }}
                                        />
                                        <div style={{ fontWeight: 500, fontSize: 'var(--font-size-sm)' }}>
                                            {restaurant.nombre}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </FormSection>

                    {/* Optional Pre-filled Data */}
                    <FormSection title="Datos opcionales (pre-completar)">
                        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                            <Input
                                label="Nombre"
                                placeholder="Nombre del usuario"
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                fullWidth
                            />
                            <Input
                                label="Teléfono"
                                placeholder="666 123 456"
                                value={telefono}
                                onChange={(e) => setTelefono(e.target.value)}
                                fullWidth
                            />
                        </div>
                    </FormSection>

                    {/* Error Message */}
                    {error && (
                        <div style={{
                            padding: 'var(--spacing-sm)',
                            backgroundColor: 'var(--error-light)',
                            color: 'var(--error)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: 'var(--font-size-sm)',
                            marginTop: 'var(--spacing-md)',
                            textAlign: 'center'
                        }}>
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div style={{ marginTop: 'var(--spacing-lg)', display: 'flex', gap: 'var(--spacing-sm)' }}>
                        <Button variant="secondary" onClick={onClose} style={{ flex: 1 }}>
                            Cancelar
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleCreateInvitation}
                            disabled={isLoading || invitableRoles.length === 0}
                            style={{ flex: 1 }}
                        >
                            <Mail size={16} style={{ marginRight: '8px' }} />
                            {isLoading ? 'Generando...' : 'Generar invitación'}
                        </Button>
                    </div>
                </div>
            )}
        </Modal>
    );
};
