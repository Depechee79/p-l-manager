import React, { ReactNode, useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export interface TableColumn<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (value: any, row: T) => ReactNode;
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
    
    let aValue: any = a[sortConfig.key];
    let bValue: any = b[sortConfig.key];

    // Handle null/undefined
    if (aValue == null) aValue = '';
    if (bValue == null) bValue = '';

    // Try to parse as number
    const aNum = typeof aValue === 'string' ? parseFloat(aValue) : aValue;
    const bNum = typeof bValue === 'string' ? parseFloat(bValue) : bValue;
    
    if (!isNaN(aNum) && !isNaN(bNum) && typeof aValue !== 'boolean') {
      // Numeric comparison
      return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
    }

    // Try to parse as date
    const aDate = new Date(aValue);
    const bDate = new Date(bValue);
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
    return <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando datos...</div>;
  }

  if (data.length === 0) {
    return <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>{emptyText}</div>;
  }

  const tableClasses = [
    'table',
    hoverable ? 'table-hover' : '',
    striped ? 'table-striped' : ''
  ].filter(Boolean).join(' ');

  return (
    <div className="table-container">
      <table className={tableClasses}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                onClick={() => handleHeaderClick(column)}
                style={{ 
                  cursor: column.sortable ? 'pointer' : 'default',
                  userSelect: 'none',
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 'var(--spacing-xs)',
                  justifyContent: 'space-between',
                }}>
                  <span>{column.header}</span>
                  {column.sortable && (
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: sortConfig?.key === column.key ? 1 : 0.3,
                      transition: 'opacity var(--transition-base)',
                    }}>
                      {sortConfig?.key === column.key ? (
                        sortConfig.direction === 'asc' ? (
                          <ChevronUp size={14} color="var(--accent)" />
                        ) : (
                          <ChevronDown size={14} color="var(--accent)" />
                        )
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', marginTop: '-2px', marginBottom: '-2px' }}>
                          <ChevronUp size={10} style={{ opacity: 0.3, marginBottom: '-4px' }} />
                          <ChevronDown size={10} style={{ opacity: 0.3 }} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </th>
            ))}
            {/* Add extra column for expand icon if expandable */}
            {expandedRowRender && <th style={{ width: '50px', textAlign: 'center' }}></th>}
          </tr>
        </thead>
        <tbody>
          {displayData.map((row, index) => {
            const rowId = row.id || index;
            const isExpanded = expandedRows.has(rowId);
            
            return (
              <React.Fragment key={rowId}>
                <tr
                  onClick={(e) => handleRowClick(row, rowId, e)}
                  className={isExpanded ? 'table-row-expanded' : ''}
                  style={{ 
                    cursor: (onRowClick || expandedRowRender) ? 'pointer' : 'default',
                  }}
                >
                  {columns.map((column) => (
                    <td key={`${rowId}-${column.key}`}>
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </td>
                  ))}
                  {expandedRowRender && (
                    <td 
                      className="table-expand-icon"
                      style={{ 
                        textAlign: 'center', 
                        color: 'var(--accent)',
                        cursor: 'pointer',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRow(rowId);
                      }}
                    >
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </td>
                  )}
                </tr>
                {isExpanded && expandedRowRender && (
                  <tr className="table-row-details">
                    <td colSpan={columns.length}>
                      <div className="details-content">
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
