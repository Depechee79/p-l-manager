/**
 * MobileTopBar - Top header bar for mobile view
 * Extracted from Layout.tsx
 */
import React from 'react';
import { Menu } from 'lucide-react';
import { BrandHeader } from './BrandHeader';

export interface MobileTopBarProps {
    onMenuClick: () => void;
}

export const MobileTopBar: React.FC<MobileTopBarProps> = ({ onMenuClick }) => {
    return (
        <div className="mobile-top-bar">
            <button
                onClick={onMenuClick}
                style={{
                    background: 'none',
                    border: 'none',
                    width: '44px',
                    height: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--text-main)',
                    transition: 'all 200ms',
                    borderRadius: 'var(--radius)',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--surface-muted)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                }}
            >
                <Menu size={20} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                <BrandHeader compact />
            </div>
        </div>
    );
};
