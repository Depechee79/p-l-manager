/**
 * DataCard - Data display card with integrated KPI header
 *
 * Session 007: New design matching Almacen reference
 * Features:
 * - White card with subtle border and shadow
 * - Optional KPI header row with metrics
 * - Empty state with icon and message
 * - Clean, modern look
 */
import React from 'react';
import type { ReactNode } from 'react';
import { Package } from 'lucide-react';

export interface KPIItem {
  label: string;
  value: string | number;
  /** Color variant for the value */
  variant?: 'default' | 'danger' | 'warning' | 'success';
}

export interface DataCardProps {
  /** KPI items to show in header row */
  kpis?: KPIItem[];
  /** Main content */
  children?: ReactNode;
  /** Show empty state instead of children */
  isEmpty?: boolean;
  /** Empty state title */
  emptyTitle?: string;
  /** Empty state description */
  emptyDescription?: string;
  /** Empty state icon */
  emptyIcon?: ReactNode;
  /** Action button for empty state */
  emptyAction?: ReactNode;
  /** No padding on content area */
  noPadding?: boolean;
}


export const DataCard: React.FC<DataCardProps> = ({
  kpis,
  children,
  isEmpty = false,
  emptyTitle = 'No hay datos disponibles',
  emptyDescription = 'Utiliza los filtros superiores o añade nuevos datos para comenzar.',
  emptyIcon,
  emptyAction,
  noPadding = false,
}) => {
  const getVariantColor = (variant?: KPIItem['variant']) => {
    switch (variant) {
      case 'danger':
        return 'var(--accent)';
      case 'warning':
        return 'var(--warning)';
      case 'success':
        return 'var(--success)';
      default:
        return 'var(--text-main)';
    }
  };

  return (
    <div className="bg-surface rounded-[var(--radius)] border border-border overflow-hidden flex flex-col">
      {/* KPI Header */}
      {kpis && kpis.length > 0 && (
        <div
          className="grid gap-md px-md py-sm border-b border-border"
          style={{ gridTemplateColumns: `repeat(${kpis.length}, 1fr)` }}
        >
          {kpis.map((kpi, idx) => (
            <div key={idx} className="flex flex-col">
              <span className="text-[9px] font-bold text-text-light tracking-widest mb-[2px]">
                {kpi.label}
              </span>
              <span
                className="text-sm font-bold"
                style={{ color: getVariantColor(kpi.variant) }}
              >
                {kpi.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Content or Empty State */}
      {isEmpty ? (
        <div className="py-10 px-4 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-surface-muted rounded-full flex items-center justify-center mb-3">
            {emptyIcon || <Package size={32} color="var(--text-light)" strokeWidth={1.5} />}
          </div>
          <h3 className="text-lg font-bold text-text-main m-0">
            {emptyTitle}
          </h3>
          <p className="text-sm text-text-secondary max-w-xs mt-2 mb-0 leading-relaxed">
            {emptyDescription}
          </p>
          {emptyAction && (
            <div className="mt-6">
              {emptyAction}
            </div>
          )}
        </div>
      ) : (
        <div className={noPadding ? '' : 'p-4'}>
          {children}
        </div>
      )}
    </div>
  );
};
