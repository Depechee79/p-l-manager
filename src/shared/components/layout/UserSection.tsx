/**
 * UserSection - User info and logout button for sidebar
 * Extracted from Layout.tsx
 */
import React from 'react';
import { LogOut, User as UserIcon } from 'lucide-react';
export interface UserSectionProps {
    user: { name: string };
    onLogout?: () => void;
}

export const UserSection: React.FC<UserSectionProps> = ({ user, onLogout }) => {
    return (
        <div
            style={{
                padding: '20px 24px',
                borderTop: '1px solid var(--border)',
                marginTop: 'auto',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '16px',
                }}
            >
                <div
                    style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '10px',
                        background: 'var(--surface-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--accent)',
                    }}
                >
                    <UserIcon size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                        style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: 'var(--text-main)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}
                    >
                        {user.name}
                    </div>
                    <div
                        style={{
                            fontSize: '12px',
                            color: 'var(--text-secondary)',
                            marginTop: '2px',
                        }}
                    >
                        Administrador
                    </div>
                </div>
            </div>
            {onLogout && (
                <button
                    onClick={onLogout}
                    style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '10px',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        background: 'var(--surface)',
                        color: 'var(--text-secondary)',
                        fontSize: '13px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 200ms ease',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--surface-muted)';
                        e.currentTarget.style.borderColor = 'var(--border-focus)';
                        e.currentTarget.style.color = 'var(--text-main)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--surface)';
                        e.currentTarget.style.borderColor = 'var(--border)';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                    }}
                >
                    <LogOut size={16} />
                    <span>Cerrar Sesión</span>
                </button>
            )}
        </div>
    );
};
