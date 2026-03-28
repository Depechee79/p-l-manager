/**
 * SignUpPage - Registration for NEW business owners only
 *
 * This page is ONLY for creating a new business (restaurant/group).
 * The user automatically becomes Director de Operaciones.
 * Employees must be invited via the invitation system.
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Input } from '@shared/components';
import { signUpBusinessOwner } from '@core/services/AuthService';
import { Building2, Store, User, ArrowRight, ArrowLeft, Check } from 'lucide-react';

type Step = 1 | 2 | 3;

export const SignUpPage: React.FC = () => {
    const [step, setStep] = useState<Step>(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Form data
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [tipoNegocio, setTipoNegocio] = useState<'restaurante' | 'grupo'>('restaurante');
    const [nombreNegocio, setNombreNegocio] = useState('');

    const validateStep1 = (): boolean => {
        if (!nombre.trim()) {
            setError('Introduce tu nombre');
            return false;
        }
        if (!email.trim() || !email.includes('@')) {
            setError('Introduce un email válido');
            return false;
        }
        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return false;
        }
        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return false;
        }
        setError('');
        return true;
    };

    const validateStep2 = (): boolean => {
        if (!nombreNegocio.trim()) {
            setError('Introduce el nombre de tu negocio');
            return false;
        }
        setError('');
        return true;
    };

    const handleNext = () => {
        if (step === 1 && validateStep1()) {
            setStep(2);
        } else if (step === 2 && validateStep2()) {
            setStep(3);
        }
    };

    const handleBack = () => {
        setError('');
        if (step === 2) setStep(1);
        else if (step === 3) setStep(2);
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        setError('');

        const result = await signUpBusinessOwner({
            nombre,
            email,
            password,
            tipoNegocio,
            nombreNegocio,
        });

        if (result.success) {
            // Store user in localStorage for app to pick up
            localStorage.setItem('app_user', JSON.stringify({
                name: result.user?.nombre,
                roleId: result.user?.rolId,
                uid: result.user?.uid,
            }));
            // Redirect to app
            window.location.href = '/';
        } else {
            setError(result.error || 'Error al crear la cuenta');
            setIsLoading(false);
        }
    };

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
                        background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto var(--spacing-md)'
                    }}>
                        <Building2 size={32} style={{ color: 'white' }} />
                    </div>
                    <h1 style={{
                        fontSize: 'var(--font-size-xl)',
                        fontWeight: 700,
                        color: 'var(--text-main)',
                        margin: 0
                    }}>
                        Crear tu negocio
                    </h1>
                    <p style={{
                        color: 'var(--text-secondary)',
                        fontSize: 'var(--font-size-sm)',
                        marginTop: 'var(--spacing-xs)'
                    }}>
                        Registra tu restaurante o grupo de restaurantes
                    </p>
                </div>

                {/* Progress Steps */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 'var(--spacing-sm)',
                    marginBottom: 'var(--spacing-xl)'
                }}>
                    {[1, 2, 3].map((s) => (
                        <div
                            key={s}
                            style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 'var(--font-size-sm)',
                                fontWeight: 600,
                                backgroundColor: s <= step ? 'var(--primary)' : 'var(--surface-muted)',
                                color: s <= step ? 'white' : 'var(--text-muted)',
                                transition: 'all 0.3s'
                            }}
                        >
                            {s < step ? <Check size={16} /> : s}
                        </div>
                    ))}
                </div>

                {/* Step 1: Personal Data */}
                {step === 1 && (
                    <div>
                        <h2 style={{
                            fontSize: 'var(--font-size-base)',
                            fontWeight: 600,
                            marginBottom: 'var(--spacing-md)',
                            color: 'var(--text-main)'
                        }}>
                            <User size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                            Tus datos
                        </h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                            <Input
                                label="Nombre completo"
                                placeholder="Ej: Juan García López"
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                fullWidth
                                autoFocus
                            />
                            <Input
                                label="Email"
                                type="email"
                                placeholder="tu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
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
                    </div>
                )}

                {/* Step 2: Business Data */}
                {step === 2 && (
                    <div>
                        <h2 style={{
                            fontSize: 'var(--font-size-base)',
                            fontWeight: 600,
                            marginBottom: 'var(--spacing-md)',
                            color: 'var(--text-main)'
                        }}>
                            <Store size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                            Tu negocio
                        </h2>

                        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                            <label style={{
                                display: 'block',
                                fontSize: 'var(--font-size-sm)',
                                fontWeight: 500,
                                marginBottom: 'var(--spacing-sm)',
                                color: 'var(--text-main)'
                            }}>
                                Tipo de negocio
                            </label>
                            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                <div
                                    onClick={() => setTipoNegocio('restaurante')}
                                    style={{
                                        flex: 1,
                                        padding: 'var(--spacing-md)',
                                        borderRadius: 'var(--radius)',
                                        border: tipoNegocio === 'restaurante'
                                            ? '2px solid var(--primary)'
                                            : '1px solid var(--border)',
                                        backgroundColor: tipoNegocio === 'restaurante'
                                            ? 'var(--primary-lighter)'
                                            : 'var(--surface)',
                                        cursor: 'pointer',
                                        textAlign: 'center'
                                    }}
                                >
                                    <Store size={24} style={{
                                        color: tipoNegocio === 'restaurante' ? 'var(--primary)' : 'var(--text-muted)',
                                        marginBottom: '8px'
                                    }} />
                                    <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
                                        Un restaurante
                                    </div>
                                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                                        Negocio individual
                                    </div>
                                </div>
                                <div
                                    onClick={() => setTipoNegocio('grupo')}
                                    style={{
                                        flex: 1,
                                        padding: 'var(--spacing-md)',
                                        borderRadius: 'var(--radius)',
                                        border: tipoNegocio === 'grupo'
                                            ? '2px solid var(--primary)'
                                            : '1px solid var(--border)',
                                        backgroundColor: tipoNegocio === 'grupo'
                                            ? 'var(--primary-lighter)'
                                            : 'var(--surface)',
                                        cursor: 'pointer',
                                        textAlign: 'center'
                                    }}
                                >
                                    <Building2 size={24} style={{
                                        color: tipoNegocio === 'grupo' ? 'var(--primary)' : 'var(--text-muted)',
                                        marginBottom: '8px'
                                    }} />
                                    <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
                                        Grupo de restaurantes
                                    </div>
                                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                                        Varios locales
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Input
                            label={tipoNegocio === 'grupo' ? 'Nombre del grupo' : 'Nombre del restaurante'}
                            placeholder={tipoNegocio === 'grupo' ? 'Ej: Grupo Gastronómico XYZ' : 'Ej: Restaurante La Buena Mesa'}
                            value={nombreNegocio}
                            onChange={(e) => setNombreNegocio(e.target.value)}
                            fullWidth
                        />

                        <p style={{
                            fontSize: 'var(--font-size-xs)',
                            color: 'var(--text-muted)',
                            marginTop: 'var(--spacing-md)'
                        }}>
                            Podrás añadir más restaurantes después desde la configuración.
                        </p>
                    </div>
                )}

                {/* Step 3: Confirmation */}
                {step === 3 && (
                    <div>
                        <h2 style={{
                            fontSize: 'var(--font-size-base)',
                            fontWeight: 600,
                            marginBottom: 'var(--spacing-md)',
                            color: 'var(--text-main)'
                        }}>
                            <Check size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                            Confirmar datos
                        </h2>

                        <div style={{
                            backgroundColor: 'var(--surface-muted)',
                            borderRadius: 'var(--radius)',
                            padding: 'var(--spacing-md)',
                            marginBottom: 'var(--spacing-md)'
                        }}>
                            <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                                <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-xs)' }}>Nombre</span>
                                <div style={{ fontWeight: 500 }}>{nombre}</div>
                            </div>
                            <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                                <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-xs)' }}>Email</span>
                                <div style={{ fontWeight: 500 }}>{email}</div>
                            </div>
                            <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                                <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-xs)' }}>Negocio</span>
                                <div style={{ fontWeight: 500 }}>{nombreNegocio}</div>
                            </div>
                            <div>
                                <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-xs)' }}>Tipo</span>
                                <div style={{ fontWeight: 500 }}>
                                    {tipoNegocio === 'grupo' ? 'Grupo de restaurantes' : 'Restaurante individual'}
                                </div>
                            </div>
                        </div>

                        <div style={{
                            backgroundColor: 'var(--primary-lighter)',
                            borderRadius: 'var(--radius)',
                            padding: 'var(--spacing-md)',
                            border: '1px solid var(--primary)',
                        }}>
                            <div style={{
                                fontWeight: 600,
                                color: 'var(--primary)',
                                marginBottom: 'var(--spacing-xs)'
                            }}>
                                Tu rol: Director de Operaciones
                            </div>
                            <div style={{
                                fontSize: 'var(--font-size-sm)',
                                color: 'var(--text-secondary)'
                            }}>
                                Como creador del negocio, tendrás acceso completo a todas las funcionalidades.
                                Podrás invitar a tu equipo y asignarles roles específicos.
                            </div>
                        </div>
                    </div>
                )}

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

                {/* Navigation Buttons */}
                <div style={{
                    display: 'flex',
                    gap: 'var(--spacing-sm)',
                    marginTop: 'var(--spacing-xl)'
                }}>
                    {step > 1 && (
                        <Button
                            variant="secondary"
                            onClick={handleBack}
                            disabled={isLoading}
                            style={{ flex: 1 }}
                        >
                            <ArrowLeft size={16} style={{ marginRight: '8px' }} />
                            Atrás
                        </Button>
                    )}
                    {step < 3 ? (
                        <Button
                            variant="primary"
                            onClick={handleNext}
                            style={{ flex: 1 }}
                        >
                            Siguiente
                            <ArrowRight size={16} style={{ marginLeft: '8px' }} />
                        </Button>
                    ) : (
                        <Button
                            variant="primary"
                            onClick={handleSubmit}
                            disabled={isLoading}
                            style={{ flex: 1 }}
                        >
                            {isLoading ? 'Creando cuenta...' : 'Crear mi negocio'}
                        </Button>
                    )}
                </div>

                {/* Login Link */}
                <p style={{
                    textAlign: 'center',
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--text-secondary)',
                    marginTop: 'var(--spacing-lg)',
                    marginBottom: 0
                }}>
                    ¿Ya tienes cuenta?{' '}
                    <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>
                        Inicia sesión
                    </Link>
                </p>

                <p style={{
                    textAlign: 'center',
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--text-muted)',
                    marginTop: 'var(--spacing-sm)',
                    marginBottom: 0
                }}>
                    ¿Te han invitado a un equipo? Usa el enlace de invitación que recibiste.
                </p>
            </Card>
        </div>
    );
};
