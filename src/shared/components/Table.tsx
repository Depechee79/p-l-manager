import React, { ReactNode, useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export interface TableColumn<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (value: T[keyof T], row: T) => ReactNode;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  hoverable?: boolean;
  striped?: boolean;
  loading?: boolean;
  emptyText?: string;
  expandedRowRender?: (row: T) => ReactNode; // New prop for accordion content
  containerStyle?: React.CSSProperties;
}

export const Table = <T extends Record<string, any>>({
  columns,
  data,
  onRowClick,
  onSort,
  hoverable = false,
  striped = false,
  loading = false,
  emptyText = 'No hay datos disponibles',
  expandedRowRender,
  containerStyle,
}: TableProps<T>) => {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string | number>>(new Set());

  const handleHeaderClick = (column: TableColumn<T>) => {
    if (!column.sortable) return;

    const direction = sortConfig?.key === column.key && sortConfig.direction === 'asc' ? 'desc' : 'asc';

    if (onSort) {
      onSort(column.key, direction);
    } else {
      setSortConfig({ key: column.key, direction });
    }
  };

  const toggleRow = (rowId: string | number, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowId)) {
      newExpanded.delete(rowId);
    } else {
      newExpanded.add(rowId);
    }
    setExpandedRows(newExpanded);
  };

  const handleRowClick = (row: T, rowId: string | number, e: React.MouseEvent) => {
    // If clicking on expand icon, don't trigger row click
    if ((e.target as HTMLElement).closest('.table-expand-icon')) {
      toggleRow(rowId, e);
      return;
    }

    if (expandedRowRender) {
      toggleRow(rowId);
    }
    if (onRowClick) {
      onRowClick(row);
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortConfig) return 0;

    let aValue = a[sortConfig.key] as unknown;
    let bValue = b[sortConfig.key] as unknown;

    // Handle null/undefined
    if (aValue == null) aValue = '';
    if (bValue == null) bValue = '';

    // Try to parse as number
    const aNum = typeof aValue === 'string' ? parseFloat(aValue) : (aValue as number);
    const bNum = typeof bValue === 'string' ? parseFloat(bValue) : (bValue as number);

    if (!isNaN(aNum) && !isNaN(bNum) && typeof aValue !== 'boolean') {
      // Numeric comparison
      return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
    }

    // Try to parse as date
    const aDate = new Date(aValue as string | number);
    const bDate = new Date(bValue as string | number);
    if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
      return sortConfig.direction === 'asc'
        ? aDate.getTime() - bDate.getTime()
        : bDate.getTime() - aDate.getTime();
    }

    // String comparison
    const aStr = String(aValue).toLowerCase();
    const bStr = String(bValue).toLowerCase();

    if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const displayData = onSort ? data : sortedData;

  if (loading) {
    return <div style={{ padding: 'var(--spacing-lg)', textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando datos...</div>;
  }

  if (data.length === 0) {
    return <div style={{ padding: 'var(--spacing-lg)', textAlign: 'center', color: 'var(--text-secondary)' }}>{emptyText}</div>;
  }

  const tableClasses = [
    'w-full border-collapse text-left text-sm',
    hoverable ? '[&_tbody_tr]:hover:bg-surface-muted' : '',
    striped ? '[&_tbody_tr:nth-child(even)]:bg-[var(--surface-muted)]' : ''
  ].filter(Boolean).join(' ');

  return (
    <div className="w-full relative rounded-[var(--radius)] overflow-x-auto bg-surface border border-border" style={containerStyle}>
      <table className={tableClasses}>
        <thead>
          <tr className="border-b border-border bg-surface text-text-secondary uppercase text-[10px] tracking-wider font-semibold">
            {columns.map((column) => (
              <th
                key={column.key}
                onClick={() => handleHeaderClick(column)}
                className={`p-3 ${column.sortable ? 'cursor-pointer select-none' : 'cursor-default'}`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span>{column.header}</span>
                  {column.sortable && (
                    <div className={`flex flex-col items-center justify-center transition-opacity duration-200 ${sortConfig?.key === column.key ? 'opacity-100' : 'opacity-30'}`}>
                      {sortConfig?.key === column.key ? (
                        sortConfig.direction === 'asc' ? (
                          <ChevronUp size={14} className="text-accent" />
                        ) : (
                          <ChevronDown size={14} className="text-accent" />
                        )
                      ) : (
                        <div className="flex flex-col -mt-[2px] -mb-[2px]">
                          <ChevronUp size={10} className="opacity-30 -mb-1" />
                          <ChevronDown size={10} className="opacity-30" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </th>
            ))}
            {expandedRowRender && <th className="w-[50px] text-center"></th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {displayData.map((row, index) => {
            const rowId = row.id || index;
            const isExpanded = expandedRows.has(rowId);

            return (
              <React.Fragment key={rowId}>
                <tr
                  onClick={(e) => handleRowClick(row, rowId, e)}
                  className={`transition-colors duration-200 ${isExpanded ? 'bg-surface-muted/50' : ''} ${(onRowClick || expandedRowRender) ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  {columns.map((column) => (
                    <td key={`${rowId}-${column.key}`} className="p-3 text-text-main font-medium">
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </td>
                  ))}
                  {expandedRowRender && (
                    <td
                      className="text-center text-accent cursor-pointer p-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRow(rowId);
                      }}
                    >
                      {isExpanded ? <ChevronUp size={18} className="mx-auto" /> : <ChevronDown size={18} className="mx-auto" />}
                    </td>
                  )}
                </tr>
                {isExpanded && expandedRowRender && (
                  <tr className="bg-surface-muted/30 border-b border-border">
                    <td colSpan={columns.length + 1} className="p-0">
                      <div className="animate-in slide-in-from-top-2 fade-in duration-200">
                        {expandedRowRender(row)}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
