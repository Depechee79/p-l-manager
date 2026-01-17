import React from 'react';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    description?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({ label, description, className, style, ...props }) => {
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
            <input
                type="checkbox"
                style={{
                    appearance: 'none',
                    width: '18px',
                    height: '18px',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    backgroundColor: 'var(--surface)',
                    marginTop: '2px', // Align with first line of text
                    cursor: 'pointer',
                    display: 'grid',
                    placeContent: 'center',
                }}
                className="custom-checkbox"
                {...props}
            />
            {/* We ideally need CSS for the checkmark, or inline SVG background */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-checkbox:checked {
                    background-color: var(--primary);
                    border-color: var(--primary);
                }
                .custom-checkbox:checked::before {
                    content: "";
                    width: 10px;
                    height: 10px;
                    box-shadow: inset 1em 1em white;
                    transform-origin: center;
                    clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%);
                }
                .custom-checkbox:focus {
                    outline: 2px solid var(--primary-light);
                    outline-offset: 1px;
                }
            `}} />

            {(label || description) && (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {label && (
                        <span style={{
                            fontSize: 'var(--font-size-base)',
                            fontWeight: 500,
                            color: 'var(--text-main)'
                        }}>
                            {label}
                        </span>
                    )}
                    {description && (
                        <span style={{
                            fontSize: 'var(--font-size-sm)',
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
