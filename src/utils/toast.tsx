import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';
import { ToastService, ToastEvent } from '@/core/services/ToastService';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 11);
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? 5000,
    };

    setToasts((prev) => [...prev, newToast]);

    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // Suscribirse a ToastService para recibir toasts del DatabaseService
  useEffect(() => {
    const unsubscribe = ToastService.subscribe((event: ToastEvent) => {
      setToasts((prev) => [...prev, {
        id: event.id,
        type: event.type,
        title: event.title,
        message: event.message,
        duration: event.duration,
      }]);

      // Auto-dismiss si tiene duración
      if (event.duration && event.duration > 0) {
        setTimeout(() => {
          removeToast(event.id);
        }, event.duration);
      }
    });

    const unsubscribeDismiss = ToastService.onDismiss((id: string) => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    });

    return () => {
      unsubscribe();
      unsubscribeDismiss();
    };
  }, [removeToast]);

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} />;
      case 'error':
        return <AlertCircle size={20} />;
      case 'warning':
        return <AlertTriangle size={20} />;
      case 'info':
        return <Info size={20} />;
      case 'loading':
        return <Loader2 size={20} className="animate-spin" />;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        zIndex: 800, // --z-toast token value
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        maxWidth: '380px',
        pointerEvents: 'none',
      }}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: 'var(--surface)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              border: '1px solid var(--border)',
              pointerEvents: 'auto',
              animation: 'slideIn 0.3s ease',
            }}
          >
            <div style={{
              color: toast.type === 'error' ? 'var(--danger)'
                : toast.type === 'warning' ? 'var(--warning)'
                : toast.type === 'info' ? 'var(--info)'
                : toast.type === 'loading' ? 'var(--text-secondary)'
                : 'var(--success)',
              flexShrink: 0,
            }}>
              {getIcon(toast.type)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {toast.title && (
                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-main)', marginBottom: '2px' }}>
                  {toast.title}
                </div>
              )}
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {toast.message}
              </div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              aria-label="Cerrar"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                color: 'var(--text-muted)',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

