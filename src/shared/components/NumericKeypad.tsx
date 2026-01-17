import React from 'react';

interface NumericKeypadProps {
    value: number;
    onChange: (value: number) => void;
    allowDecimal?: boolean;
}

export const NumericKeypad: React.FC<NumericKeypadProps> = ({
    value,
    onChange,
    allowDecimal = true
}) => {
    const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0, allowDecimal ? '.' : null, '⌫'].filter(k => k !== null);

    const handleKeyPress = (key: string | number) => {
        if (key === '⌫') {
            const stringValue = String(value);
            const newValue = stringValue.length > 1 ? stringValue.slice(0, -1) : '0';
            onChange(parseFloat(newValue) || 0);
        } else if (key === '.') {
            const stringValue = String(value);
            if (!stringValue.includes('.')) {
                // En un input controlado de número es difícil manejar el punto solo.
                // Pero para la UX de este teclado táctil:
                const newValue = stringValue + '.';
                // Aquí hay un truco: si el usuario pulsa '.' simplemente esperamos al siguiente número.
                // Pero parseFloat de "1." es 1.
                onChange(parseFloat(newValue) || 0);
            }
        } else {
            const stringValue = String(value);
            const newValue = stringValue === '0' ? String(key) : stringValue + String(key);
            onChange(parseFloat(newValue) || 0);
        }
    };

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 'var(--spacing-sm)',
            marginTop: 'var(--spacing-md)',
        }}>
            {keys.map((key) => (
                <button
                    key={key!}
                    type="button"
                    onClick={() => handleKeyPress(key!)}
                    style={{
                        padding: 'var(--spacing-lg)',
                        fontSize: 'var(--font-size-xl)',
                        fontWeight: '700',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        backgroundColor: 'var(--surface)',
                        color: 'var(--text-main)',
                        cursor: 'pointer',
                        minHeight: '60px',
                        transition: 'all 200ms ease',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--surface-muted)';
                        e.currentTarget.style.borderColor = 'var(--accent)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--surface)';
                        e.currentTarget.style.borderColor = 'var(--border)';
                    }}
                >
                    {key}
                </button>
            ))}
        </div>
    );
};
