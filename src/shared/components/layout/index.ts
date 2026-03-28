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

// Page Layout Components
export { PageHeader } from './PageHeader';
export type { PageHeaderProps } from './PageHeader';

export { StickyPageHeader } from './StickyPageHeader';
export type { StickyPageHeaderProps } from './StickyPageHeader';

// ═══════════════════════════════════════════════════════════════════════════
// APP SHELL V2 - New layout components (Canon Stitch design)
// ═══════════════════════════════════════════════════════════════════════════

export { AppShellV2 } from './AppShellV2';
export type { AppShellV2Props } from './AppShellV2';

export { TopbarV2 } from './TopbarV2';
export type { TopbarV2Props } from './TopbarV2';

export { SidebarNavV2 } from './SidebarNavV2';
export type { SidebarNavV2Props } from './SidebarNavV2';
