/**
 * ToastService - Sistema de notificaciones para operaciones de datos
 *
 * Permite que DatabaseService emita notificaciones sin depender de React.
 * Los componentes React se suscriben a los eventos.
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface ToastEvent {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

type ToastListener = (toast: ToastEvent) => void;
type ToastDismissListener = (id: string) => void;

class ToastServiceClass {
  private listeners: ToastListener[] = [];
  private dismissListeners: ToastDismissListener[] = [];
  private activeToasts: Map<string, ToastEvent> = new Map();

  /**
   * Suscribirse a nuevos toasts
   */
  subscribe(listener: ToastListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Suscribirse a dismissals
   */
  onDismiss(listener: ToastDismissListener): () => void {
    this.dismissListeners.push(listener);
    return () => {
      this.dismissListeners = this.dismissListeners.filter(l => l !== listener);
    };
  }

  /**
   * Generar ID único
   */
  private generateId(): string {
    return `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Emitir un toast
   */
  private emit(toast: Omit<ToastEvent, 'id'>): string {
    const id = this.generateId();
    const fullToast: ToastEvent = { ...toast, id };
    this.activeToasts.set(id, fullToast);
    this.listeners.forEach(listener => listener(fullToast));
    return id;
  }

  /**
   * Dismiss un toast específico
   */
  dismiss(id: string): void {
    this.activeToasts.delete(id);
    this.dismissListeners.forEach(listener => listener(id));
  }

  /**
   * Mostrar toast de "Guardando..."
   */
  saving(message: string = 'Guardando...'): string {
    return this.emit({
      type: 'loading',
      message,
      duration: 0, // No auto-dismiss
    });
  }

  /**
   * Mostrar toast de éxito
   */
  success(message: string, title?: string): string {
    return this.emit({
      type: 'success',
      message,
      title,
      duration: 3000,
    });
  }

  /**
   * Mostrar toast de error
   */
  error(message: string, title?: string): string {
    return this.emit({
      type: 'error',
      message,
      title,
      duration: 5000,
    });
  }

  /**
   * Mostrar toast de warning
   */
  warning(message: string, title?: string): string {
    return this.emit({
      type: 'warning',
      message,
      title,
      duration: 4000,
    });
  }

  /**
   * Mostrar toast de info
   */
  info(message: string, title?: string): string {
    return this.emit({
      type: 'info',
      message,
      title,
      duration: 3000,
    });
  }

  /**
   * Actualizar toast existente (para cambiar de "loading" a "success/error")
   */
  update(id: string, updates: Partial<Omit<ToastEvent, 'id'>>): void {
    const existing = this.activeToasts.get(id);
    if (existing) {
      const updated = { ...existing, ...updates };
      this.activeToasts.set(id, updated);
      // Dismiss y re-emit para actualizar UI
      this.dismiss(id);
      this.listeners.forEach(listener => listener(updated));
    }
  }

  /**
   * Helper: Operación con feedback automático
   * Muestra "Guardando...", ejecuta la operación, muestra resultado
   */
  async withFeedback<T>(
    operation: () => Promise<T>,
    messages: {
      loading?: string;
      success?: string;
      error?: string;
    } = {}
  ): Promise<T> {
    const loadingId = this.saving(messages.loading || 'Guardando...');

    try {
      const result = await operation();
      this.dismiss(loadingId);
      this.success(messages.success || 'Guardado correctamente');
      return result;
    } catch (error) {
      this.dismiss(loadingId);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      this.error(messages.error || `Error: ${errorMessage}`);
      throw error;
    }
  }
}

// Singleton export
export const ToastService = new ToastServiceClass();
