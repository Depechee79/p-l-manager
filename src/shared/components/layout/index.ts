/**
 * Layout Components - Barrel Export
 * 
 * Modular layout components extracted from the monolithic Layout.tsx
 * 
 * @example
 * import { Sidebar, MobileTopBar, MobileBottomNav } from '@/shared/components/layout';
 */

// Configuration
export { navItems, mobileBottomNavItems } from './navConfig';
export type { NavItem } from './navConfig';

// Atomic Components
export { NavLink } from './NavLink';
export type { NavLinkProps } from './NavLink';

export { BrandHeader } from './BrandHeader';
export type { BrandHeaderProps } from './BrandHeader';

export { UserSection } from './UserSection';
export type { UserSectionProps } from './UserSection';

// Composite Components
export { Sidebar } from './Sidebar';
export type { SidebarProps } from './Sidebar';

export { MobileTopBar } from './MobileTopBar';
export type { MobileTopBarProps } from './MobileTopBar';

export { MobileSidebar } from './MobileSidebar';
export type { MobileSidebarProps } from './MobileSidebar';

export { MobileBottomNav } from './MobileBottomNav';
