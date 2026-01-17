import type { ComponentBaseProps, ComponentSize } from '../types';

/**
 * LoadingState - Flexible loading indicators
 * 
 * Provides spinner, skeleton, and overlay loading states.
 * 
 * @example
 * // Spinner
 * <LoadingState variant="spinner" />
 * 
 * // Skeleton placeholder
 * <LoadingState variant="skeleton" width="100%" height="40px" />
 * 
 * // Full screen overlay
 * <LoadingState variant="overlay" text="Loading..." />
 */
export interface LoadingStateProps extends ComponentBaseProps {
    /** Type of loading indicator */
    variant?: 'spinner' | 'skeleton' | 'overlay';
    /** Size of the spinner */
    size?: ComponentSize;
    /** Width for skeleton variant */
    width?: string | number;
    /** Height for skeleton variant */
    height?: string | number;
    /** Loading text for overlay variant */
    text?: string;
    /** Number of skeleton lines to render */
    lines?: number;
    /** Border radius for skeleton */
    rounded?: boolean;
}

// Spinner animation keyframes (inline style approach)
const spinnerStyle: React.CSSProperties = {
    animation: 'spin 0.8s linear infinite',
};

const sizeMap: Record<ComponentSize, number> = {
    sm: 16,
    md: 24,
    lg: 36,
};

export const LoadingState = ({
    variant = 'spinner',
    size = 'md',
    width = '100%',
    height = '16px',
    text = 'Cargando...',
    lines = 1,
    rounded = false,
    className = '',
    style,
    id,
    'data-testid': testId = 'loading-state',
}: LoadingStateProps) => {
    // Spinner variant
    if (variant === 'spinner') {
        const spinnerSize = sizeMap[size];
        return (
            <div
                className={`loading-spinner ${className}`}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    ...style,
                }}
                id={id}
                data-testid={testId}
            >
                <svg
                    width={spinnerSize}
                    height={spinnerSize}
                    viewBox="0 0 24 24"
                    fill="none"
                    style={spinnerStyle}
                >
                    <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="var(--border)"
                        strokeWidth="3"
                    />
                    <path
                        d="M12 2C6.47715 2 2 6.47715 2 12"
                        stroke="var(--accent)"
                        strokeWidth="3"
                        strokeLinecap="round"
                    />
                </svg>
            </div>
        );
    }

    // Skeleton variant
    if (variant === 'skeleton') {
        const skeletonBaseStyle: React.CSSProperties = {
            backgroundColor: 'var(--surface-muted)',
            borderRadius: rounded ? 'var(--radius)' : '4px',
            animation: 'pulse 1.5s ease-in-out infinite',
        };

        return (
            <div
                className={`loading-skeleton ${className}`}
                style={style}
                id={id}
                data-testid={testId}
            >
                {Array.from({ length: lines }).map((_, index) => (
                    <div
                        key={index}
                        style={{
                            ...skeletonBaseStyle,
                            width: typeof width === 'number' ? `${width}px` : width,
                            height: typeof height === 'number' ? `${height}px` : height,
                            marginBottom: index < lines - 1 ? 'var(--spacing-sm)' : 0,
                        }}
                    />
                ))}
            </div>
        );
    }

    // Overlay variant
    if (variant === 'overlay') {
        return (
            <div
                className={`loading-overlay ${className}`}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    ...style,
                }}
                id={id}
                data-testid={testId}
            >
                <svg
                    width={sizeMap['lg']}
                    height={sizeMap['lg']}
                    viewBox="0 0 24 24"
                    fill="none"
                    style={spinnerStyle}
                >
                    <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="rgba(255,255,255,0.3)"
                        strokeWidth="3"
                    />
                    <path
                        d="M12 2C6.47715 2 2 6.47715 2 12"
                        stroke="white"
                        strokeWidth="3"
                        strokeLinecap="round"
                    />
                </svg>
                {text && (
                    <span
                        style={{
                            marginTop: 'var(--spacing-md)',
                            color: 'white',
                            fontSize: 'var(--font-size-base)',
                            fontWeight: 500,
                        }}
                    >
                        {text}
                    </span>
                )}
            </div>
        );
    }

    return null;
};
