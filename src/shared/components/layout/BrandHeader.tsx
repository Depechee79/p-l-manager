/**
 * BrandHeader - Logo and brand title for sidebar
 * Extracted from Layout.tsx
 */
import React from 'react';
import { Sparkles } from 'lucide-react';
import { ACCENT_SHADOW } from '@shared/tokens/colors';

export interface BrandHeaderProps {
    compact?: boolean;
}

export const BrandHeader: React.FC<BrandHeaderProps> = ({ compact = false }) => {
    return (
        <div
            style={{
                padding: compact ? '0' : '0 24px',
                marginBottom: compact ? '0' : '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
            }}
        >
            <div
                style={{
                    width: compact ? '32px' : '44px',
                    height: compact ? '32px' : '44px',
                    borderRadius: compact ? '8px' : '12px',
                    background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: compact ? 'none' : `0 4px 12px ${ACCENT_SHADOW}`,
                }}
            >
                <Sparkles size={compact ? 16 : 20} color="var(--surface)" strokeWidth={2.5} />
            </div>
            <div>
                <h1
                    style={{
                        margin: 0,
                        fontSize: compact ? '18px' : '20px',
                        fontWeight: '700',
                        color: 'var(--text-main)',
                        fontFamily: 'var(--font-heading)',
                        letterSpacing: '-0.02em',
                        lineHeight: 1.2,
                    }}
                >
                    P&L Manager
                </h1>
                {!compact && (
                    <p
                        style={{
                            margin: '2px 0 0',
                            fontSize: '11px',
                            color: 'var(--text-secondary)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            fontWeight: '500',
                        }}
                    >
                        Gestión Premium
                    </p>
                )}
            </div>
        </div>
    );
};
