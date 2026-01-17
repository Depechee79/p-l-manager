export interface ToastOptions {
    type: 'success' | 'error' | 'warning' | 'info';
    title?: string;
    message: string;
    duration?: number;
}

export const useToast = () => {
    const showToast = (options: ToastOptions) => {
        // Placeholder implementation
        // In a real app, this would dispatch to a context
        console.log(`[TOAST] ${options.type.toUpperCase()}: ${options.message}`);
        if (options.type === 'error') {
            console.error(options.message);
        }
    };

    return { showToast };
};
