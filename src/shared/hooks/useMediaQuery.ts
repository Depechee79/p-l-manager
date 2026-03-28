import { useState, useEffect, useMemo } from 'react';
import { breakpoints, BREAKPOINT_LG, BREAKPOINT_MD, BREAKPOINT_SM, BREAKPOINT_XL } from '../tokens/breakpoints';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Breakpoint device categories
 */
export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'wide';

/**
 * Responsive state object returned by useResponsive
 */
export interface ResponsiveState {
    /** Current breakpoint name */
    breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    /** Current device category */
    device: DeviceType;
    /** True if viewport is mobile (< 768px) */
    isMobile: boolean;
    /** True if viewport is tablet (768px - 1023px) */
    isTablet: boolean;
    /** True if viewport is desktop (>= 1024px) */
    isDesktop: boolean;
    /** True if viewport is wide (>= 1280px) */
    isWide: boolean;
    /** Current viewport width in pixels */
    width: number;
    /** Current viewport height in pixels */
    height: number;
}

// =============================================================================
// BASE HOOK
// =============================================================================

/**
 * useMediaQuery - Hook to detect media query matches
 * 
 * @example
 * const isMobile = useMediaQuery(`(max-width: ${breakpoints.md - 1}px)`);
 * 
 * @param query - CSS media query string
 * @returns boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(() => {
        // SSR safety: check if window exists
        if (typeof window === 'undefined') return false;
        return window.matchMedia(query).matches;
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const media = window.matchMedia(query);
        
        // Set initial value
        setMatches(media.matches);

        // Use the modern API with fallback for older browsers
        const listener = (event: MediaQueryListEvent) => {
            setMatches(event.matches);
        };

        // Modern browsers
        if (media.addEventListener) {
            media.addEventListener('change', listener);
            return () => media.removeEventListener('change', listener);
        } 
        // Legacy fallback
        else {
            media.addListener(listener);
            return () => media.removeListener(listener);
        }
    }, [query]);

    return matches;
}

// =============================================================================
// STANDARDIZED RESPONSIVE HOOK
// =============================================================================

/**
 * useResponsive - Comprehensive responsive hook using design system tokens
 * 
 * Provides a complete responsive state object with breakpoint detection,
 * device categorization, and viewport dimensions.
 * 
 * @example
 * const { isMobile, isDesktop, breakpoint, width } = useResponsive();
 * 
 * @example
 * // Conditional rendering
 * {isMobile ? <MobileNav /> : <DesktopNav />}
 * 
 * @example
 * // Dynamic styles
 * <div style={{ padding: isMobile ? '16px' : '32px' }} />
 * 
 * @returns ResponsiveState object with all responsive information
 */
export function useResponsive(): ResponsiveState {
    // Use individual media queries for each breakpoint
    const isXs = useMediaQuery(`(max-width: ${breakpoints.sm - 1}px)`);
    const isSm = useMediaQuery(`(min-width: ${breakpoints.sm}px) and (max-width: ${breakpoints.md - 1}px)`);
    const isMd = useMediaQuery(`(min-width: ${breakpoints.md}px) and (max-width: ${breakpoints.lg - 1}px)`);
    const isLg = useMediaQuery(`(min-width: ${breakpoints.lg}px) and (max-width: ${breakpoints.xl - 1}px)`);
    const isXl = useMediaQuery(`(min-width: ${breakpoints.xl}px) and (max-width: ${breakpoints['2xl'] - 1}px)`);
    const is2Xl = useMediaQuery(`(min-width: ${breakpoints['2xl']}px)`);

    // Device category detection
    const isMobile = useMediaQuery(`(max-width: ${BREAKPOINT_MD - 1}px)`);
    const isTablet = useMediaQuery(`(min-width: ${BREAKPOINT_MD}px) and (max-width: ${BREAKPOINT_LG - 1}px)`);
    const isDesktop = useMediaQuery(`(min-width: ${BREAKPOINT_LG}px)`);
    const isWide = useMediaQuery(`(min-width: ${BREAKPOINT_XL}px)`);

    // Viewport dimensions
    const [dimensions, setDimensions] = useState(() => ({
        width: typeof window !== 'undefined' ? window.innerWidth : 0,
        height: typeof window !== 'undefined' ? window.innerHeight : 0,
    }));

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleResize = () => {
            setDimensions({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Determine current breakpoint
    const breakpoint = useMemo((): ResponsiveState['breakpoint'] => {
        if (is2Xl) return '2xl';
        if (isXl) return 'xl';
        if (isLg) return 'lg';
        if (isMd) return 'md';
        if (isSm) return 'sm';
        return 'xs';
    }, [isXs, isSm, isMd, isLg, isXl, is2Xl]);

    // Determine device category
    const device = useMemo((): DeviceType => {
        if (isMobile) return 'mobile';
        if (isTablet) return 'tablet';
        if (isWide) return 'wide';
        return 'desktop';
    }, [isMobile, isTablet, isWide]);

    return {
        breakpoint,
        device,
        isMobile,
        isTablet,
        isDesktop,
        isWide,
        width: dimensions.width,
        height: dimensions.height,
    };
}

// =============================================================================
// CONVENIENCE HOOKS
// =============================================================================

/**
 * useIsMobile - Shorthand to detect mobile view (< 768px)
 * 
 * @deprecated Use useResponsive().isMobile for new code
 * @returns boolean true if viewport is mobile
 */
export function useIsMobile(): boolean {
    return useMediaQuery(`(max-width: ${BREAKPOINT_MD - 1}px)`);
}

/**
 * useIsTablet - Detect tablet view (768px - 1023px)
 * @returns boolean true if viewport is tablet
 */
export function useIsTablet(): boolean {
    return useMediaQuery(`(min-width: ${BREAKPOINT_MD}px) and (max-width: ${BREAKPOINT_LG - 1}px)`);
}

/**
 * useIsDesktop - Detect desktop view (>= 1024px)
 * @returns boolean true if viewport is desktop
 */
export function useIsDesktop(): boolean {
    return useMediaQuery(`(min-width: ${BREAKPOINT_LG}px)`);
}

/**
 * useBreakpoint - Check if current breakpoint is at least the specified one
 * 
 * @example
 * const isMdOrLarger = useBreakpoint('md'); // true for md, lg, xl, 2xl
 * 
 * @param breakpoint - Minimum breakpoint to check
 * @returns boolean true if current viewport is at least the specified breakpoint
 */
export function useBreakpoint(breakpoint: 'sm' | 'md' | 'lg' | 'xl' | '2xl'): boolean {
    const breakpointValues = {
        sm: BREAKPOINT_SM,
        md: BREAKPOINT_MD,
        lg: BREAKPOINT_LG,
        xl: BREAKPOINT_XL,
        '2xl': 1536,
    };
    
    return useMediaQuery(`(min-width: ${breakpointValues[breakpoint]}px)`);
}

/**
 * useViewport - Get current viewport dimensions
 * 
 * @returns Object with width and height
 */
export function useViewport(): { width: number; height: number } {
    const [dimensions, setDimensions] = useState(() => ({
        width: typeof window !== 'undefined' ? window.innerWidth : 0,
        height: typeof window !== 'undefined' ? window.innerHeight : 0,
    }));

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleResize = () => {
            setDimensions({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        // Set initial dimensions
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return dimensions;
}
