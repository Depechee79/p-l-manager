import { ReactNode } from 'react';
import { generateId } from '../utils';
import type { ComponentBaseProps } from '../types';

/**
 * FormField - Wrapper component for form controls
 * 
 * Provides consistent layout for label + control + error/helper text.
 * Use this to wrap any form control that needs these features.
 * 
 * @example
 * <FormField label="Name" error={errors.name} required>
 *   <Input name="name" />
 * </FormField>
 */
export interface FormFieldProps extends ComponentBaseProps {
    /** Label text displayed above the control */
    label?: string;
    /** Makes the field take full width */
    fullWidth?: boolean;
    /** Error message to display below the control */
    error?: string;
    /** Helper text displayed below the control (hidden when error is present) */
    helperText?: string;
    /** Shows required indicator (*) after label */
    required?: boolean;
    /** The form control to wrap (Input, Select, Textarea, etc.) */
    children: ReactNode;
    /** Custom ID for label association (auto-generated if not provided) */
    htmlFor?: string;
}

export const FormField = ({
    label,
    fullWidth = false,
    error,
    helperText,
    required = false,
    children,
    htmlFor,
    className = '',
    style,
    id,
    'data-testid': testId,
}: FormFieldProps) => {
    const fieldId = htmlFor || id || generateId('field');

    const containerClasses = [
        'form-field',
        fullWidth ? 'form-field-full-width' : '',
        error ? 'form-field-error' : '',
        className,
    ].filter(Boolean).join(' ');

    return (
        <div
            className={containerClasses}
            style={{
                width: fullWidth ? '100%' : 'auto',
                marginBottom: 'var(--spacing-md)',
                ...style,
            }}
            data-testid={testId}
        >
            {label && (
                <label
                    htmlFor={fieldId}
                    className="form-field-label"
                    style={{
                        display: 'block',
                        marginBottom: 'var(--spacing-xs)',
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 500,
                        color: error ? 'var(--danger)' : 'var(--text-main)',
                    }}
                >
                    {label}
                    {required && (
                        <span style={{ color: 'var(--danger)', marginLeft: '4px' }}>*</span>
                    )}
                </label>
            )}

            {children}

            {error && (
                <span
                    className="form-field-error-text"
                    style={{
                        display: 'block',
                        marginTop: 'var(--spacing-xs)',
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--danger)',
                    }}
                >
                    {error}
                </span>
            )}

            {!error && helperText && (
                <span
                    className="form-field-helper-text"
                    style={{
                        display: 'block',
                        marginTop: 'var(--spacing-xs)',
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--text-secondary)',
                    }}
                >
                    {helperText}
                </span>
            )}
        </div>
    );
};
