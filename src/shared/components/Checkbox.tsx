import React from 'react';
import { Check } from 'lucide-react';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    description?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({ label, description, className, style, checked, onChange, ...props }) => {
    return (
        <label
            style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--spacing-sm)',
                cursor: props.disabled ? 'not-allowed' : 'pointer',
                opacity: props.disabled ? 0.6 : 1,
                ...style
            }}
            className={className}
        >
            {/* Hidden native checkbox for accessibility */}
            <input
                type="checkbox"
                checked={checked}
                onChange={onChange}
                style={{
                    position: 'absolute',
                    opacity: 0,
                    width: 0,
                    height: 0,
                }}
                {...props}
            />

            {/* Visual checkbox */}
            <div
                style={{
                    width: '18px',
                    height: '18px',
                    minWidth: '18px',
                    border: checked ? '1px solid var(--primary)' : '1px solid var(--border)',
                    borderRadius: '4px',
                    backgroundColor: checked ? 'var(--primary)' : 'var(--surface)',
                    marginTop: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                }}
            >
                {checked && (
                    <Check size={12} color="var(--surface)" strokeWidth={3} />
                )}
            </div>

            {(label || description) && (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {label && (
                        <span style={{
                            fontSize: 'var(--font-size-sm)',
                            fontWeight: 500,
                            color: 'var(--text-main)'
                        }}>
                            {label}
                        </span>
                    )}
                    {description && (
                        <span style={{
                            fontSize: 'var(--font-size-xs)',
                            color: 'var(--text-secondary)'
                        }}>
                            {description}
                        </span>
                    )}
                </div>
            )}
        </label>
    );
};
