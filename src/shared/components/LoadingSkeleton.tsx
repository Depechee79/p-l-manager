/**
 * LoadingSkeleton - Reusable loading placeholder component
 * AUDIT-FIX: P2.6 - Replaces "Cargando..." text with visual skeleton
 *
 * Provides visual feedback during data loading with animated placeholders
 * that match the layout of the content being loaded.
 */
import React from 'react';

interface SkeletonProps {
  /** Width of the skeleton (CSS value) */
  width?: string | number;
  /** Height of the skeleton (CSS value) */
  height?: string | number;
  /** Border radius (CSS value) */
  borderRadius?: string | number;
  /** Custom className */
  className?: string;
  /** Custom inline styles */
  style?: React.CSSProperties;
}

/**
 * Base skeleton element with shimmer animation
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '1rem',
  borderRadius = 'var(--radius)',
  className = '',
  style = {},
}) => {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius,
        backgroundColor: 'var(--surface-muted)',
        animation: 'skeleton-shimmer 1.5s ease-in-out infinite',
        ...style,
      }}
    />
  );
};

/**
 * Text line skeleton (single line of text)
 */
export const SkeletonText: React.FC<{ lines?: number; lastLineWidth?: string }> = ({
  lines = 1,
  lastLineWidth = '70%',
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="14px"
          width={i === lines - 1 && lines > 1 ? lastLineWidth : '100%'}
        />
      ))}
    </div>
  );
};

/**
 * Avatar/Circle skeleton
 */
export const SkeletonCircle: React.FC<{ size?: number }> = ({ size = 40 }) => {
  return <Skeleton width={size} height={size} borderRadius="50%" />;
};

/**
 * Card skeleton with title, lines and optional image
 */
export const SkeletonCard: React.FC<{ showImage?: boolean }> = ({ showImage = false }) => {
  return (
    <div
      style={{
        padding: 'var(--spacing-md)',
        backgroundColor: 'var(--surface)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
      }}
    >
      {showImage && (
        <Skeleton height={120} style={{ marginBottom: 'var(--spacing-md)' }} />
      )}
      <Skeleton height="20px" width="60%" style={{ marginBottom: 'var(--spacing-sm)' }} />
      <SkeletonText lines={2} />
    </div>
  );
};

/**
 * Table row skeleton
 */
export const SkeletonTableRow: React.FC<{ columns?: number }> = ({ columns = 4 }) => {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} style={{ padding: '16px 24px' }}>
          <Skeleton height="16px" width={i === 0 ? '80%' : '60%'} />
        </td>
      ))}
    </tr>
  );
};

/**
 * Full table skeleton
 */
export const SkeletonTable: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 4,
}) => {
  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i}>
                <Skeleton height="12px" width="70%" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonTableRow key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * List item skeleton
 */
export const SkeletonListItem: React.FC = () => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-md)',
        padding: 'var(--spacing-md)',
        backgroundColor: 'var(--surface)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
      }}
    >
      <SkeletonCircle size={48} />
      <div style={{ flex: 1 }}>
        <Skeleton height="16px" width="40%" style={{ marginBottom: '8px' }} />
        <Skeleton height="12px" width="60%" />
      </div>
      <Skeleton height="32px" width="80px" />
    </div>
  );
};

/**
 * List skeleton (multiple items)
 */
export const SkeletonList: React.FC<{ items?: number }> = ({ items = 5 }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
      {Array.from({ length: items }).map((_, i) => (
        <SkeletonListItem key={i} />
      ))}
    </div>
  );
};

/**
 * KPI Card skeleton
 */
export const SkeletonKPI: React.FC = () => {
  return (
    <div
      style={{
        padding: 'var(--spacing-md)',
        backgroundColor: 'var(--surface)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
      }}
    >
      <Skeleton height="12px" width="50%" style={{ marginBottom: 'var(--spacing-sm)' }} />
      <Skeleton height="28px" width="40%" style={{ marginBottom: 'var(--spacing-xs)' }} />
      <Skeleton height="12px" width="70%" />
    </div>
  );
};

/**
 * Grid of KPI skeletons
 */
export const SkeletonKPIGrid: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 'var(--spacing-md)',
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonKPI key={i} />
      ))}
    </div>
  );
};
