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
export * from './ButtonV2';
export * from './Switch';
export type { ButtonProps } from './Button';

export { Card } from './Card';
export type { CardProps } from './Card';

export { Input } from './Input';
export type { InputProps } from './Input';

export { Modal } from './Modal';
export type { ModalProps } from './Modal';

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
export type { TabsHorizontalProps, Tab as TabItem } from './TabsHorizontal';

// =============================================================================
// V2 DESIGN SYSTEM COMPONENTS (Session 007)
// Based on Almacen reference design - 36px height, 8px radius, compact filters
// =============================================================================

export { TabsNavV2 } from './TabsNavV2';
export type { TabsNavV2Props, TabV2 } from './TabsNavV2';

export { ButtonV2 } from './ButtonV2';
export type { ButtonV2Props } from './ButtonV2';

export { ActionHeaderV2 } from './ActionHeaderV2';
export type { ActionHeaderV2Props } from './ActionHeaderV2';

export { FilterCardV2, FilterInputV2, FilterTextInput, FilterSelect } from './FilterCardV2';
export type { FilterCardV2Props, FilterInputV2Props, FilterTextInputProps, FilterSelectProps } from './FilterCardV2';

export { DataCardV2 } from './DataCardV2';
export type { DataCardV2Props, KPIItem } from './DataCardV2';

export { PageLayoutV2 } from './PageLayoutV2';
export type { PageLayoutV2Props } from './PageLayoutV2';

export { SelectV2 } from './SelectV2';
export type { SelectV2Props, SelectV2Option } from './SelectV2';

// =============================================================================
// SECURITY COMPONENTS
// =============================================================================

export { ProtectedRoute } from './ProtectedRoute';
export type { ProtectedRouteProps } from './ProtectedRoute';

