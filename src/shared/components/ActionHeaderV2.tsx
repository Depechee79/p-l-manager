/**
 * ActionHeaderV2 - Header row with tabs and action buttons
 *
 * Session 007: New design matching Almacen reference
 * Features:
 * - Tabs on the left with pill-style container
 * - Action buttons on the right
 * - Responsive: stacks on mobile
 * - Clean flex layout with gap
 */
import React from 'react';
import type { ReactNode } from 'react';
import { TabsNavV2, type TabV2 } from './TabsNavV2';

export interface ActionHeaderV2Props {
  /** Tabs configuration */
  tabs?: TabV2[];
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

export const ActionHeaderV2: React.FC<ActionHeaderV2Props> = ({
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
        <TabsNavV2
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
