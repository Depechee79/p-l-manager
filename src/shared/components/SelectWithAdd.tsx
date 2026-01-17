import React, { useState } from 'react';
import { Select, SelectProps } from './Select';
import { Button } from './Button';
import { Modal } from './Modal';

export interface SelectWithAddProps extends Omit<SelectProps, 'onChange'> {
  onChange: (value: string) => void;
  onAddNew?: () => void;
  addLabel?: string;
  addModalTitle?: string;
  addModalContent?: React.ReactNode;
  showAddButton?: boolean;
}

export const SelectWithAdd: React.FC<SelectWithAddProps> = ({
  options,
  onChange,
  onAddNew,
  addLabel = 'Añadir nuevo...',
  addModalTitle = 'Añadir nuevo item',
  addModalContent,
  showAddButton = true,
  ...selectProps
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemValue, setNewItemValue] = useState<string>('');

  const handleAddClick = () => {
    if (onAddNew) {
      // Si hay función personalizada, usarla
      onAddNew();
    } else {
      // Si no, mostrar modal genérico
      setShowAddModal(true);
    }
  };

  const handleAddConfirm = () => {
    if (newItemValue.trim()) {
      // El componente padre debe manejar la creación del item
      // Aquí solo cerramos el modal y notificamos
      setShowAddModal(false);
      setNewItemValue('');
      // El padre debe actualizar las opciones y seleccionar el nuevo item
    }
  };

  const handleAddCancel = () => {
    setShowAddModal(false);
    setNewItemValue('');
  };

  // Añadir opción "Añadir nuevo..." al final de las opciones
  const optionsWithAdd = showAddButton
    ? [
        ...options,
        {
          value: '__add_new__',
          label: `➕ ${addLabel}`,
        },
      ]
    : options;

  const handleSelectChange = (value: string) => {
    if (value === '__add_new__') {
      handleAddClick();
    } else {
      onChange(value);
    }
  };

  return (
    <>
      <Select
        {...selectProps}
        options={optionsWithAdd}
        onChange={handleSelectChange}
      />
      {showAddModal && (
        <Modal
          open={showAddModal}
          onClose={handleAddCancel}
          title={addModalTitle}
        >
          {addModalContent || (
            <div style={{ padding: 'var(--spacing-md)' }}>
              <p style={{ marginBottom: 'var(--spacing-md)', color: 'var(--text-secondary)' }}>
                Esta función debe ser implementada en el componente padre.
              </p>
              <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end' }}>
                <Button variant="secondary" onClick={handleAddCancel}>
                  Cancelar
                </Button>
                <Button variant="primary" onClick={handleAddConfirm}>
                  Añadir
                </Button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </>
  );
};

