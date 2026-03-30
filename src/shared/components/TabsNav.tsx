/**
 * TabsNav - Horizontal tabs with pill-style design
 *
 * Features:
 * - Contained within rounded pill-style background
 * - Active tab with primary color and subtle shadow
 * - 36px height for all interactive elements
 * - 8px border-radius
 * - Smooth transitions
 * - Responsive horizontal scroll on mobile with fade indicator
 */
import React from 'react';

export interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}



export interface TabsNavProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  /** Show icons in tabs (default: true on first tab only for visual hierarchy) */
  showIcons?: boolean | 'first-only';
}



export const TabsNav: React.FC<TabsNavProps> = ({
  tabs,
  activeTab,
  onTabChange,
  showIcons = 'first-only',
}) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [showFade, setShowFade] = React.useState(false);

  const checkScroll = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Show fade if there is more content to scroll to the right
    const canScrollRight = el.scrollWidth - el.scrollLeft - el.clientWidth > 2;
    setShowFade(canScrollRight);
  }, []);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    // Also check on resize
    const resizeObserver = new ResizeObserver(checkScroll);
    resizeObserver.observe(el);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      resizeObserver.disconnect();
    };
  }, [checkScroll, tabs]);

  return (
    <div className="tabs-nav-v2-wrapper" style={{ position: 'relative' }}>
      <div
        ref={scrollRef}
        className="tabs-nav-v2"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 4px 8px 4px', // Extra padding inferior para sombra
          backgroundColor: 'rgba(241, 245, 249, 0.5)', // slate-100/50
          borderRadius: 'var(--app-interactive-radius)',
          width: 'fit-content',
          maxWidth: '100%',
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
                flexShrink: 0,
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

      {/* Scroll fade indicator on right edge */}
      {showFade && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: '32px',
            background: 'linear-gradient(to right, transparent, rgba(241, 245, 249, 0.9))',
            borderRadius: '0 var(--app-interactive-radius) var(--app-interactive-radius) 0',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
};
