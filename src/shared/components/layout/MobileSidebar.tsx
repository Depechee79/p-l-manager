/**
 * MobileSidebar - Full-screen sidebar overlay for mobile
 * Extracted from Layout.tsx
 */
import React from 'react';
import { X } from 'lucide-react';
import { NavLink } from './NavLink';
import { UserSection } from './UserSection';
import { navigation } from './navConfig';
import type { User } from '@/core';

export interface MobileSidebarProps {
    user?: User | null;
    onLogout?: () => void;
    onClose: () => void;
}

export const MobileSidebar: React.FC<MobileSidebarProps> = ({
    user,
    onLogout,
    onClose,
}) => {
    return (
        <>
            {/* Overlay backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 200,
                }}
            />

            {/* Sidebar panel */}
            <aside
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: '280px',
                    backgroundColor: 'var(--surface)',
                    borderRight: '1px solid var(--border)',
                    padding: '80px 0 0',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 300,
                    boxShadow: 'var(--shadow-lg)',
                }}
            >
                {/* Close button */}
                <div style={{ padding: '0 24px', marginBottom: '24px' }}>
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            top: '20px',
                            right: '20px',
                            background: 'var(--surface-muted)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius)',
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: 'var(--text-secondary)',
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>

                <nav
                    style={{
                        flex: 1,
                        padding: '0 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--spacing-md)',
                        overflowY: 'auto',
                        paddingBottom: '24px',
                    }}
                >
                    {navigation.map((category) => (
                        <div key={category.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div
                                style={{
                                    fontSize: '10px',
                                    fontWeight: '700',
                                    color: 'var(--text-light)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    paddingLeft: '12px',
                                    marginBottom: '4px',
                                }}
                            >
                                {category.label}
                            </div>
                            {category.items.map((item) => (
                                <NavLink key={item.path} {...item} onClick={onClose} />
                            ))}
                        </div>
                    ))}
                </nav>

                {/* User Section */}
                {user && <UserSection user={user} onLogout={onLogout} />}
            </aside>
        </>
    );
};
