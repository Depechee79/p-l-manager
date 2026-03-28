/**
 * TabsHorizontal - Reusable horizontal tabs component
 *
 * Session 004: Created for UI standardization across all pages
 * Based on EscandallosPage tabs style but enhanced with:
 * - Better hover states
 * - Subtle shadow on active tab
 * - Smooth transitions
 * - Responsive scroll on mobile
 */
import React from 'react';

export interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface TabsHorizontalProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  /** Optional: hide the bottom border line */
  noBorder?: boolean;
  /** Optional: smaller size variant */
  size?: 'default' | 'small';
}

export const TabsHorizontal: React.FC<TabsHorizontalProps> = ({
  tabs,
  activeTab,
  onTabChange,
  noBorder = false,
  size = 'default',
}) => {
  const isSmall = size === 'small';

  return (
    <div
      className="tabs-horizontal-container"
      style={{
        backgroundColor: 'var(--background)',
        display: 'flex',
        gap: 'var(--spacing-xs)',
        borderBottom: noBorder ? 'none' : '1px solid var(--border)',
        paddingBottom: 'var(--spacing-xs)',
        paddingTop: 'var(--spacing-xs)',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const isDisabled = tab.disabled;

        return (
          <button
            key={tab.id}
            onClick={() => !isDisabled && onTabChange(tab.id)}
            disabled={isDisabled}
            className={`tab-horizontal-item ${isActive ? 'active' : ''}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-xs)',
              padding: isSmall
                ? 'var(--spacing-xs) var(--spacing-sm)'
                : 'var(--spacing-sm) var(--spacing-md)',
              border: 'none',
              borderRadius: 'var(--radius) var(--radius) 0 0',
              background: isActive ? 'var(--accent)' : 'transparent',
              color: isActive ? 'white' : isDisabled ? 'var(--text-light)' : 'var(--text-secondary)',
              fontWeight: isActive ? '600' : '500',
              fontSize: isSmall ? 'var(--font-size-xs)' : 'var(--font-size-sm)',
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              transition: 'all 200ms ease',
              whiteSpace: 'nowrap',
              minHeight: isSmall ? '32px' : '40px',
              boxShadow: isActive ? '0 2px 8px rgba(225, 29, 72, 0.25)' : 'none',
              opacity: isDisabled ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isActive && !isDisabled) {
                e.currentTarget.style.background = 'var(--surface-muted)';
                e.currentTarget.style.color = 'var(--text-main)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive && !isDisabled) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }
            }}
          >
            {tab.icon && (
              <span style={{
                display: 'flex',
                alignItems: 'center',
                opacity: isActive ? 1 : 0.7,
              }}>
                {tab.icon}
              </span>
            )}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
