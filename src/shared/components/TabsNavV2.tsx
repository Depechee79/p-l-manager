/**
 * TabsNavV2 - Horizontal tabs with V2 design system
 *
 * Session 007: New design matching Almacen reference
 * Features:
 * - Contained within rounded pill-style background
 * - Active tab with primary color and subtle shadow
 * - 36px height for all interactive elements
 * - 8px border-radius
 * - Smooth transitions
 * - Responsive horizontal scroll on mobile
 */
import React from 'react';

export interface TabV2 {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface TabsNavV2Props {
  tabs: TabV2[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  /** Show icons in tabs (default: true on first tab only for visual hierarchy) */
  showIcons?: boolean | 'first-only';
}

export const TabsNavV2: React.FC<TabsNavV2Props> = ({
  tabs,
  activeTab,
  onTabChange,
  showIcons = 'first-only',
}) => {
  return (
    <div
      className="tabs-nav-v2"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 4px 8px 4px', // Extra padding inferior para sombra
        backgroundColor: 'rgba(241, 245, 249, 0.5)', // slate-100/50
        borderRadius: 'var(--app-interactive-radius)',
        width: 'fit-content',
        overflowX: 'auto',
        overflowY: 'visible', // Permitir que sombra se muestre
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      {tabs.map((tab, index) => {
        const isActive = activeTab === tab.id;
        const isDisabled = tab.disabled;
        const shouldShowIcon =
          showIcons === true ||
          (showIcons === 'first-only' && index === 0 && isActive);

        return (
          <button
            key={tab.id}
            onClick={() => !isDisabled && onTabChange(tab.id)}
            disabled={isDisabled}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              height: 'var(--app-interactive-h)',
              padding: '0 16px',
              border: 'none',
              borderRadius: 'var(--app-interactive-radius)',
              backgroundColor: isActive ? 'var(--accent)' : 'transparent',
              color: isActive ? 'white' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: 'var(--app-interactive-font-size)',
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
              boxShadow: isActive
                ? '0 4px 6px -1px rgba(225, 29, 72, 0.2), 0 2px 4px -2px rgba(225, 29, 72, 0.1)'
                : 'none',
              opacity: isDisabled ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isActive && !isDisabled) {
                e.currentTarget.style.backgroundColor = 'rgba(148, 163, 184, 0.2)'; // slate-200/50
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive && !isDisabled) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            {shouldShowIcon && tab.icon && (
              <span style={{
                display: 'flex',
                alignItems: 'center',
                fontSize: '16px',
              }}>
                {tab.icon}
              </span>
            )}
            <span>{tab.label}</span>
          </button>
        );
      })}

      {/* Hide scrollbar */}
      <style>{`
        .tabs-nav-v2::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};
