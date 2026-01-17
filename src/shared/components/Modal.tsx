import { ReactNode, MouseEvent } from 'react';
import { X } from 'lucide-react';
import type { ComponentSize } from '../types';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  footer?: ReactNode;
  size?: ComponentSize;
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
}

// Map new size values to CSS classes
const sizeClassMap: Record<ComponentSize, string> = {
  sm: 'modal-small',
  md: '',
  lg: 'modal-large',
};

export const Modal = ({
  open,
  onClose,
  children,
  title,
  footer,
  size = 'md',
  closeOnOverlayClick = true,
  showCloseButton = true,
}: ModalProps) => {
  if (!open) return null;

  const handleOverlayClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  const sizeClass = sizeClassMap[size];
  const contentClasses = ['modal-content', sizeClass].filter(Boolean).join(' ');

  return (
    <div
      className="modal-overlay"
      onClick={handleOverlayClick}
      data-testid="modal-overlay"
    >
      <div className={contentClasses}>
        {(title || showCloseButton) && (
          <div className="modal-header">
            {title && <h2 className="modal-title">{title}</h2>}
            {showCloseButton && (
              <button
                className="modal-close-button"
                onClick={onClose}
                aria-label="Close"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={24} />
              </button>
            )}
          </div>
        )}
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};
