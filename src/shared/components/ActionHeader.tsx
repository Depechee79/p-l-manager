/**
 * ActionHeader - Header row with tabs and action buttons
 *
 * Features:
 * - Tabs on the left with pill-style container
 * - Action buttons on the right
 * - Responsive: stacks on mobile
 * - Clean flex layout with gap
 */
import React from 'react';
import type { ReactNode } from 'react';
import { TabsNav, type Tab } from './TabsNav';

export interface ActionHeaderProps {
  /** Tabs configuration */
  tabs?: Tab[];
  /** Currently active tab */
  activeTab?: string;
  /** Tab change handler */
  onTabChange?: (tabId: string) => void;
  /** Action buttons (right side) */
  actions?: ReactNode;
  /** Gap between tabs and actions */
  gap?: string;
  /** Make header sticky */
  sticky?: boolean;
}



export const ActionHeader: React.FC<ActionHeaderProps> = ({
  tabs,
  activeTab,
  onTabChange,
  actions,
  gap = '16px',
  sticky = false,
}) => {
  const hasTabs = !!(tabs && activeTab && onTabChange);

  return (
    <div
      className={`
        flex flex-col md:flex-row items-stretch md:items-center flex-wrap
        ${hasTabs ? 'justify-between' : 'justify-end'}
        ${sticky ? 'sticky top-0 z-10 bg-background pb-md' : 'mb-6'}
        ${hasTabs ? 'pt-0 pb-0' : 'pt-1 pb-2'}
      `.replace(/\s+/g, ' ').trim()}
      style={{ gap }}
    >
      {/* Tabs */}
      {hasTabs && (
        <TabsNav
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={onTabChange}
        />
      )}

      {/* Actions */}
      {actions && (
        <div className="flex items-center gap-2 pt-1 justify-end">
          {actions}
        </div>
      )}
    </div>
  );
};
