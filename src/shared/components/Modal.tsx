import { ReactNode, MouseEvent, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import type { ComponentSize } from '../types';
import { generateId } from '../utils';

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

const sizeClassMap: Record<ComponentSize, string> = {
  sm: 'modal-small',
  md: '',
  lg: 'modal-large',
};

export function Modal({
  open,
  onClose,
  children,
  title,
  footer,
  size = 'md',
  closeOnOverlayClick = true,
  showCloseButton = true,
}: ModalProps) {
  const titleId = useRef(generateId('modal-title'));
  const contentRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Store previously focused element and focus modal on open
  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
      // Focus the modal content after render
      requestAnimationFrame(() => {
        contentRef.current?.focus();
      });
    }
    return () => {
      // Restore focus when closing
      if (open && previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [open]);

  // Close on Escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, handleKeyDown]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

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
      <div
        ref={contentRef}
        className={contentClasses}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId.current : undefined}
        tabIndex={-1}
      >
        {(title || showCloseButton) && (
          <div className="modal-header">
            {title && <h2 className="modal-title" id={titleId.current}>{title}</h2>}
            {showCloseButton && (
              <button
                type="button"
                className="modal-close-button"
                onClick={onClose}
                aria-label="Cerrar"
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
}
