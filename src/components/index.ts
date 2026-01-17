/**
 * P&L Manager - Components Index
 * 
 * Re-exports de componentes.
 * Los componentes base ahora viven en shared/components.
 * Este archivo mantiene compatibilidad con imports existentes.
 * 
 * @note Para nuevos usos, preferir import desde '@/shared/components'
 */

// =============================================================================
// RE-EXPORTS DESDE SHARED (Componentes migrados)
// =============================================================================

export {
    Button,
    type ButtonProps,
    Card,
    type CardProps,
    Input,
    type InputProps,
    Modal,
    type ModalProps,
    Table,
    type TableProps,
    type TableColumn,
    Select,
    type SelectProps,
    DatePicker,
    type DatePickerProps,
    TimePicker,
    type TimePickerProps,
    FormSection,
    type FormSectionProps,
    StepIndicator,
    type StepIndicatorProps,
    type Step,
    SelectWithAdd,
    type SelectWithAddProps,
    PageHeader,
    type PageHeaderProps,
    PageContainer,
    type PageContainerProps,
    FilterBar,
    type FilterBarProps,
    Badge,
    type BadgeProps,
    ProtectedRoute,
    type ProtectedRouteProps,
    Checkbox
} from '../shared/components';


// =============================================================================
// COMPONENTES LOCALES (No migrados aún)
// =============================================================================

export { Layout } from './Layout';

export { ErrorBoundary } from './ErrorBoundary';