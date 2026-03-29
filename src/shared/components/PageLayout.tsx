/**
 * PageLayout - Page layout with sticky header area
 *
 * Session 007: Layout component for sticky tabs/filters
 * Features:
 * - Sticky header area (tabs, filters)
 * - Scrollable content area (lists, tables)
 * - Uses CSS flex for proper overflow handling
 */
import React from 'react';
import type { ReactNode } from 'react';

export interface PageLayoutProps {
  /** Sticky header content (ActionHeader, FilterCard) */
  header?: ReactNode;
  /** Scrollable content (DataCard, tables, lists) */
  children: ReactNode;
  /** Gap between header and content */
  gap?: string;
  /** Disable internal scroll (use when children handle their own scroll) */
  disableScroll?: boolean;
}


export const PageLayout: React.FC<PageLayoutProps> = ({
  header,
  children,
  gap = 'var(--spacing-md)',
  disableScroll = false,
}) => {
  return (
    <div className="flex flex-col flex-1 h-full min-h-0 overflow-hidden">
      {/* Sticky Header Area */}
      {header && (
        <div
          className="shrink-0 bg-background"
          style={{ paddingBottom: gap }}
        >
          {header}
        </div>
      )}

      {/* Scrollable Content Area */}
      <div
        className={`page-layout-v2-content flex flex-col flex-1 min-h-0 overflow-x-hidden ${disableScroll ? 'overflow-y-hidden' : 'overflow-y-auto'}`}
      >
        {children}
      </div>

      {/* Scrollbar styling (not achievable with Tailwind alone) */}
      <style>{`
        .page-layout-v2-content::-webkit-scrollbar {
          width: 8px;
        }
        .page-layout-v2-content::-webkit-scrollbar-track {
          background: var(--surface-muted);
          border-radius: 4px;
        }
        .page-layout-v2-content::-webkit-scrollbar-thumb {
          background: var(--border);
          border-radius: 4px;
        }
        .page-layout-v2-content::-webkit-scrollbar-thumb:hover {
          background: var(--border-focus);
        }
      `}</style>
    </div>
  );
};
