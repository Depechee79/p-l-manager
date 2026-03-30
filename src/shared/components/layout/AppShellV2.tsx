/**
 * AppShellV2 - Main layout shell for V2 design
 *
 * Canon Stitch layout:
 * - Fixed Topbar (64px) full width at top
 * - Fixed Sidebar (256px) left side, below topbar
 * - Main content area with left margin (desktop) or full width (mobile)
 *
 * Usage:
 * ```tsx
 * <AppShellV2 user={user} onLogout={logout}>
 *   <YourPageContent />
 * </AppShellV2>
 * ```
 */
import React, { ReactNode, useState } from 'react';
import { TopbarV2 } from './TopbarV2';
import { SidebarNavV2 } from './SidebarNavV2';
import { MobileBottomNav } from './MobileBottomNav';
import { MobileSidebar } from './MobileSidebar';
import { useIsDesktop } from '@shared/hooks';
export interface ShellUser {
  name?: string;
  nombre?: string;
  email?: string;
  roleId?: string | number;
  rolId?: string | number;
}

export interface AppShellV2Props {
  children: ReactNode;
  user?: ShellUser | null;
  onLogout?: () => void;
}

export const AppShellV2: React.FC<AppShellV2Props> = ({ children, user, onLogout }) => {
  // Use standardized hook: desktop = >= 1024px (lg breakpoint)
  const isDesktop = useIsDesktop();
  const isMobile = !isDesktop;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div
      className="app-shell-v2"
      style={{
        height: '100dvh',
        overflow: 'hidden',
        backgroundColor: 'var(--background)',
        position: 'relative',
      }}
    >
      {/* Fixed Topbar */}
      <TopbarV2 user={user} onLogout={onLogout} />

      {/* Fixed Sidebar (desktop only) */}
      {!isMobile && <SidebarNavV2 />}

      {/* Mobile Sidebar Overlay */}
      {isMobile && isMobileMenuOpen && (
        <MobileSidebar
          user={user}
          onLogout={onLogout}
          onClose={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content Area - NO scroll here, PageLayout handles scroll */}
      <main
        className="app-shell-main"
        style={{
          position: 'fixed',
          left: isMobile ? 0 : 'var(--app-sidebar-w)',
          top: 'var(--app-topbar-h)',
          right: 0,
          bottom: isMobile ? 'calc(70px + env(safe-area-inset-bottom, 0px))' : 0,
          padding: isMobile
            ? 'var(--app-content-pad)'
            : 'var(--app-content-pad-lg)',
          backgroundColor: 'var(--background)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Content wrapper with responsive max-width for large screens */}
        <div
          className="app-content-wrapper"
          style={{
            width: '100%',
            height: '100%',
            minHeight: 0,
            maxWidth: 'var(--content-max-width-xl)',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      {isMobile && <MobileBottomNav />}
    </div>
  );
};
