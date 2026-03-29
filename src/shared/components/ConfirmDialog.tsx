/**
 * ConfirmDialog - Confirmation dialog for destructive/important actions
 *
 * Replaces native window.confirm() with an accessible modal dialog.
 * Uses Modal internally with size="sm".
 *
 * @example
 * <ConfirmDialog
 *   open={showConfirm}
 *   onClose={() => setShowConfirm(false)}
 *   onConfirm={handleDelete}
 *   title="Eliminar registro"
 *   description="¿Estás seguro de que deseas eliminar este registro?"
 *   variant="danger"
 *   confirmLabel="Eliminar"
 * />
 */
import { useId } from 'react';

import { Modal } from './Modal';
import { Button } from './Button';

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
  loading?: boolean;
}

export const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'default',
  loading = false,
}: ConfirmDialogProps) => {
  const descriptionId = useId();

  const confirmVariant = variant === 'danger' ? 'danger' : 'primary';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      closeOnOverlayClick={!loading}
      showCloseButton={!loading}
      footer={
        <div
          role="alertdialog"
          aria-describedby={descriptionId}
          aria-label={title}
          style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)' }}
        >
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
            type="button"
          >
            {cancelLabel}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={onConfirm}
            loading={loading}
            type="button"
          >
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <p
        id={descriptionId}
        style={{
          margin: 0,
          color: 'var(--text-secondary)',
          fontSize: 'var(--font-size-base)',
          lineHeight: '1.5',
        }}
      >
        {description}
      </p>
    </Modal>
  );
};
