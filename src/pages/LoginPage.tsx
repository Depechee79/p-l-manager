/**
 * LoginPage - Firebase Auth login screen
 *
 * Authenticates users via email/password with Firebase Auth.
 * User role is retrieved from Firestore, NOT selected by the user.
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Input } from '@shared/components';
import { loginUser } from '@core/services/AuthService';
import { User } from 'lucide-react';

export const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        if (!email.trim()) {
            setError('Introduce tu email');
            return;
        }
        if (!password) {
            setError('Introduce tu contraseña');
            return;
        }

        setIsLoading(true);
        setError('');

        const result = await loginUser(email, password);

        if (result.success && result.user) {
            // Firebase Auth listener in AppContext will pick up the auth state change
            // and redirect automatically - no need to do anything here
            // Keep loading state - the app will re-render when auth state changes
        } else {
            setError(result.error || 'Error al iniciar sesión');
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleLogin();
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
                maxWidth: '400px',
                width: '100%',
                padding: 'var(--spacing-xl)'
            }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto var(--spacing-md)'
                    }}>
                        <User size={32} style={{ color: 'white' }} />
                    </div>
                    <h1 style={{
                        fontSize: 'var(--font-size-xl)',
                        fontWeight: 700,
                        color: 'var(--text-main)',
                        margin: 0
                    }}>
                        P&L Manager
                    </h1>
                    <p style={{
                        color: 'var(--text-secondary)',
                        fontSize: 'var(--font-size-sm)',
                        marginTop: 'var(--spacing-xs)'
                    }}>
                        Gestión de restaurante inteligente
                    </p>
                </div>

                {/* Login Form */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                    <Input
                        label="Email"
                        type="email"
                        placeholder="tu@email.com"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            setError('');
                        }}
                        onKeyPress={handleKeyPress}
                        fullWidth
                        autoFocus
                    />

                    <Input
                        label="Contraseña"
                        type="password"
                        placeholder="Tu contraseña"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            setError('');
                        }}
                        onKeyPress={handleKeyPress}
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

                {/* Login Button */}
                <Button
                    variant="primary"
                    onClick={handleLogin}
                    disabled={isLoading}
                    style={{ width: '100%', marginTop: 'var(--spacing-xl)' }}
                >
                    {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                </Button>

                {/* Register Link */}
                <p style={{
                    textAlign: 'center',
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--text-secondary)',
                    marginTop: 'var(--spacing-lg)',
                    marginBottom: 0
                }}>
                    ¿No tienes cuenta?{' '}
                    <Link to="/crear-negocio" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>
                        Crea tu negocio
                    </Link>
                </p>

                <p style={{
                    textAlign: 'center',
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--text-muted)',
                    marginTop: 'var(--spacing-sm)',
                    marginBottom: 0
                }}>
                    ¿Te han invitado? Usa el enlace de invitación que recibiste.
                </p>
            </Card>
        </div>
    );
};
