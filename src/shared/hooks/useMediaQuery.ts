import { useState, useEffect } from 'react';
import { breakpoints } from '../tokens/breakpoints';

/**
 * useMediaQuery - Hook to detect media query matches
 * 
 * @example
 * const isMobile = useMediaQuery(`(max-width: ${breakpoints.md - 1}px)`);
 */
export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const media = window.matchMedia(query);
        if (media.matches !== matches) {
            setMatches(media.matches);
        }

        const listener = () => setMatches(media.matches);
        media.addEventListener('change', listener);

        return () => media.removeEventListener('change', listener);
    }, [matches, query]);

    return matches;
}

/**
 * useIsMobile - Shorthand to detect mobile view
 */
export function useIsMobile(): boolean {
    return useMediaQuery(`(max-width: ${breakpoints.md - 1}px)`);
}
