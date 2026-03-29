/**
 * InvitationSignUpPage - Registration for INVITED users only
 *
 * This page is used when a user clicks on an invitation link.
 * The role and restaurant are PRE-ASSIGNED by the admin - user cannot change them.
 */
import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, Button, Input } from '@shared/components';
import { getInvitationByToken, signUpWithInvitation } from '@core/services/AuthService';
import { SYSTEM_ROLES } from '@shared/config/systemRoles';
import { UserPlus, Shield, AlertCircle, Lock } from 'lucide-react';
import type { Invitation, RoleId } from '@types';

export const InvitationSignUpPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') || searchParams.get('invitacion') || '';

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [invitation, setInvitation] = useState<Invitation | null>(null);

    // Form data
    const [nombre, setNombre] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [telefono, setTelefono] = useState('');

    // Load invitation on mount
    useEffect(() => {
        const loadInvitation = async () => {
            if (!token) {
                setError('No se proporcionó un enlace de invitación válido');
                setIsLoading(false);
                return;
            }

            const result = await getInvitationByToken(token);

            if (result.success && result.invitation) {
                setInvitation(result.invitation);
                // Pre-fill data if available
                if (result.invitation.datosPrecompletados?.nombre) {
                    setNombre(result.invitation.datosPrecompletados.nombre);
                }
                if (result.invitation.datosPrecompletados?.telefono) {
                    setTelefono(result.invitation.datosPrecompletados.telefono);
                }
            } else {
                setError(result.error || 'Invitación no válida');
            }

            setIsLoading(false);
        };

        loadInvitation();
    }, [token]);

    const handleSubmit = async () => {
        // Validate
        if (!nombre.trim()) {
            setError('Introduce tu nombre');
            return;
        }
        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }
        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        setIsSubmitting(true);
        setError('');

        const result = await signUpWithInvitation({
            token,
            nombre,
            password,
            telefono: telefono || undefined,
        });

        if (result.success) {
            // Firebase Auth state change will be detected by AppContext automatically.
            // Keep loading state — the app will re-render when auth state changes.
        } else {
            setError(result.error || 'Error al crear la cuenta');
            setIsSubmitting(false);
        }
    };

    const roleInfo = invitation ? SYSTEM_ROLES[invitation.rolId as RoleId] : null;

    // Loading state
    if (isLoading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--background)'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        border: '4px solid var(--border)',
                        borderTopColor: 'var(--primary)',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto var(--spacing-md)'
                    }} />
                    <p style={{ color: 'var(--text-secondary)' }}>Verificando invitación...</p>
                </div>
            </div>
        );
    }

    // Invalid invitation
    if (!invitation) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--background)',
                padding: 'var(--spacing-lg)'
            }}>
                <Card style={{
                    maxWidth: '400px',
                    width: '100%',
                    padding: 'var(--spacing-xl)',
                    textAlign: 'center'
                }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--error-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto var(--spacing-md)'
                    }}>
                        <AlertCircle size={32} style={{ color: 'var(--error)' }} />
                    </div>
                    <h1 style={{
                        fontSize: 'var(--font-size-lg)',
                        fontWeight: 700,
                        color: 'var(--text-main)',
                        marginBottom: 'var(--spacing-sm)'
                    }}>
                        Invitación no válida
                    </h1>
                    <p style={{
                        color: 'var(--text-secondary)',
                        marginBottom: 'var(--spacing-lg)'
                    }}>
                        {error || 'Este enlace de invitación no es válido o ha expirado.'}
                    </p>
                    <Link to="/login">
                        <Button variant="primary">Ir al inicio de sesión</Button>
                    </Link>
                </Card>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--background)',
            padding: 'var(--spacing-lg)'
        }}>
            <Card style={{
                maxWidth: '480px',
                width: '100%',
                padding: 'var(--spacing-xl)'
            }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--success), var(--primary))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto var(--spacing-md)'
                    }}>
                        <UserPlus size={32} style={{ color: 'white' }} />
                    </div>
                    <h1 style={{
                        fontSize: 'var(--font-size-xl)',
                        fontWeight: 700,
                        color: 'var(--text-main)',
                        margin: 0
                    }}>
                        Te han invitado
                    </h1>
                    <p style={{
                        color: 'var(--text-secondary)',
                        fontSize: 'var(--font-size-sm)',
                        marginTop: 'var(--spacing-xs)'
                    }}>
                        Completa tu registro para unirte al equipo
                    </p>
                </div>

                {/* Assigned Role & Restaurant (Read-only) */}
                <div style={{
                    backgroundColor: 'var(--surface-muted)',
                    borderRadius: 'var(--radius)',
                    padding: 'var(--spacing-md)',
                    marginBottom: 'var(--spacing-lg)',
                    border: '1px solid var(--border)'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-xs)',
                        marginBottom: 'var(--spacing-sm)',
                        color: 'var(--text-muted)',
                        fontSize: 'var(--font-size-xs)'
                    }}>
                        <Lock size={12} />
                        Asignado por el administrador
                    </div>

                    <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-xs)' }}>
                            Tu rol
                        </span>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-xs)',
                            fontWeight: 600,
                            color: 'var(--text-main)'
                        }}>
                            <Shield size={16} style={{ color: 'var(--primary)' }} />
                            {roleInfo?.nombre || invitation.rolId}
                        </div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                            {roleInfo?.descripcion}
                        </div>
                    </div>

                    <div>
                        <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-xs)' }}>
                            Email
                        </span>
                        <div style={{ fontWeight: 500 }}>{invitation.email}</div>
                    </div>
                </div>

                {/* Form */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                    <Input
                        label="Tu nombre"
                        placeholder="Nombre completo"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        fullWidth
                        autoFocus={!nombre}
                    />

                    <Input
                        label="Teléfono (opcional)"
                        placeholder="666 123 456"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        fullWidth
                    />

                    <Input
                        label="Contraseña"
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        fullWidth
                    />

                    <Input
                        label="Confirmar contraseña"
                        type="password"
                        placeholder="Repite la contraseña"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        fullWidth
                    />
                </div>

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

                {/* Submit Button */}
                <Button
                    variant="primary"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    style={{ width: '100%', marginTop: 'var(--spacing-xl)' }}
                >
                    {isSubmitting ? 'Creando cuenta...' : 'Unirme al equipo'}
                </Button>

                {/* Info */}
                <p style={{
                    textAlign: 'center',
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--text-muted)',
                    marginTop: 'var(--spacing-lg)',
                    marginBottom: 0
                }}>
                    Al registrarte, te unirás al equipo con el rol y permisos asignados.
                </p>
            </Card>
        </div>
    );
};
