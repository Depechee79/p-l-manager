import React, { useState } from 'react';
import { Button, Input, Modal } from '@shared/components';

interface QuickAddModalProps {
    open: boolean;
    onClose: () => void;
    onAdd: (name: string) => void;
    title: string;
    label: string;
    placeholder?: string;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
    open,
    onClose,
    onAdd,
    title,
    label,
    placeholder,
}) => {
    const [name, setName] = useState('');

    const handleAdd = () => {
        if (name.trim()) {
            onAdd(name.trim());
            setName('');
            onClose();
        }
    };

    const handleCancel = () => {
        setName('');
        onClose();
    };

    return (
        <Modal open={open} onClose={handleCancel} title={title}>
            <div style={{ padding: 'var(--spacing-md)' }}>
                <Input
                    label={label}
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={placeholder}
                    fullWidth
                    required
                    autoFocus
                />
                <div
                    style={{
                        display: 'flex',
                        gap: 'var(--spacing-sm)',
                        justifyContent: 'flex-end',
                        marginTop: 'var(--spacing-lg)',
                    }}
                >
                    <Button variant="secondary" onClick={handleCancel}>
                        Cancelar
                    </Button>
                    <Button variant="primary" onClick={handleAdd} disabled={!name.trim()}>
                        Añadir
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
