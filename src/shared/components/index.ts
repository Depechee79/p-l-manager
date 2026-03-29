/**
 * P&L Manager - Shared Components Index
 * 
 * Barrel export de componentes compartidos del sistema de diseño.
 * Estos componentes son la base reutilizable de toda la aplicación.
 * 
 * @example
 * import { Button, Card, Input, Modal } from '@/shared/components';
 * 
 * @version 1.0.0
 * @date 2025-12-30
 */

// =============================================================================
// CORE COMPONENTS
// =============================================================================

export * from './Checkbox';
export * from './Button';
export * from './Switch';

export { Card } from './Card';
export type { CardProps } from './Card';

export { Input } from './Input';
export type { InputProps } from './Input';

export { Modal } from './Modal';
export type { ModalProps } from './Modal';

export { ConfirmDialog } from './ConfirmDialog';
export type { ConfirmDialogProps } from './ConfirmDialog';

export { Table } from './Table';
export type { TableProps, TableColumn } from './Table';

// =============================================================================
// FORM COMPONENTS
// =============================================================================

export { FormField } from './FormField';
export type { FormFieldProps } from './FormField';

export { Select } from './Select';
export type { SelectProps } from './Select';

export { DatePicker } from './DatePicker';
export type { DatePickerProps } from './DatePicker';

export { TimePicker } from './TimePicker';
export type { TimePickerProps } from './TimePicker';

export { FormSection } from './FormSection';
export type { FormSectionProps } from './FormSection';

export { SelectWithAdd } from './SelectWithAdd';
export type { SelectWithAddProps } from './SelectWithAdd';

// =============================================================================
// FEEDBACK COMPONENTS
// =============================================================================

export { LoadingState } from './LoadingState';
export type { LoadingStateProps } from './LoadingState';

// AUDIT-FIX: P2.6 - Loading Skeleton components
export {
  Skeleton,
  SkeletonText,
  SkeletonCircle,
  SkeletonCard,
  SkeletonTableRow,
  SkeletonTable,
  SkeletonListItem,
  SkeletonList,
  SkeletonKPI,
  SkeletonKPIGrid,
} from './LoadingSkeleton';

export { Badge } from './Badge';
export type { BadgeProps } from './Badge';

// =============================================================================
// LAYOUT COMPONENTS
// =============================================================================

export { StepIndicator } from './StepIndicator';
export type { StepIndicatorProps, Step } from './StepIndicator';

export { NumericKeypad } from './NumericKeypad';

export { PageHeader } from './layout/PageHeader';
export type { PageHeaderProps } from './layout/PageHeader';

export { PageContainer } from './layout/PageContainer';
export type { PageContainerProps } from './layout/PageContainer';

export { FilterBar } from './layout/FilterBar';
export type { FilterBarProps } from './layout/FilterBar';

// =============================================================================
// NAVIGATION COMPONENTS
// =============================================================================

export { TabsHorizontal } from './TabsHorizontal';
export type { TabsHorizontalProps } from './TabsHorizontal';

export * from './TabsNav';

// =============================================================================
// DESIGN SYSTEM COMPONENTS
// =============================================================================

export * from './ActionHeader';

export { FilterCard, FilterInput, FilterTextInput, FilterSelect } from './FilterCard';
export type { FilterCardProps, FilterInputProps, FilterTextInputProps, FilterSelectProps } from './FilterCard';

export { DataCard } from './DataCard';
export type { DataCardProps, KPIItem } from './DataCard';

export { PageLayout } from './PageLayout';
export type { PageLayoutProps } from './PageLayout';

// =============================================================================
// SECURITY COMPONENTS
// =============================================================================

export { ProtectedRoute } from './ProtectedRoute';
export type { ProtectedRouteProps } from './ProtectedRoute';

// =============================================================================
// ERROR HANDLING COMPONENTS
// =============================================================================

export { ErrorBoundary } from './ErrorBoundary';

