/**
 * Layout - Main application layout component
 * 
 * Refactored from 656 lines to ~80 lines using modular components.
 * Desktop shows sidebar, mobile shows bottom nav + hamburger menu.
 * 
 * @example
 * <Layout user={currentUser} onLogout={handleLogout}>
 *   <DashboardPage />
 * </Layout>
 */
import React, { ReactNode, useState } from 'react';
import { useRestaurantContext } from '@core';
import {
  Sidebar,
  MobileTopBar,
  MobileSidebar,
  MobileBottomNav
} from '../shared/components/layout';
import { useResponsive } from '../shared/hooks';
import type { AppUser as User } from '@types';
import type { ShellUser } from '../shared/components/layout/AppShellV2';

export interface LayoutProps {
  children: ReactNode;
  user?: User | null;
  onLogout?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isMobile } = useResponsive();

  // Restaurant context (optional - only if provider is available)
  let restaurantContext: ReturnType<typeof useRestaurantContext> | null = null;
  try {
    restaurantContext = useRestaurantContext();
  } catch {
    // RestaurantProvider not available, continue without multi-restaurant features
  }

  return (
    <div className="layout-container">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sidebar
          user={user}
          onLogout={onLogout}
          restaurants={restaurantContext?.restaurants || []}
          currentRestaurant={restaurantContext?.currentRestaurant}
          onSwitchRestaurant={restaurantContext?.switchRestaurant}
        />
      )}

      {/* Mobile Header */}
      {isMobile && (
        <MobileTopBar onMenuClick={() => setIsMobileMenuOpen(true)} />
      )}

      {/* Mobile Sidebar Overlay */}
      {isMobile && isMobileMenuOpen && (
        <MobileSidebar
          user={user as ShellUser | null | undefined}
          onLogout={onLogout}
          onClose={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          height: '100%',
          padding: isMobile
            ? 'var(--height-mobile-header) var(--spacing-sm) 100px'
            : 'var(--spacing-sm) var(--spacing-md)',
          backgroundColor: 'var(--background)',
          position: 'relative',
          paddingBottom: isMobile ? '100px' : 'var(--spacing-sm)',
        }}
      >
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      {isMobile && <MobileBottomNav />}
    </div>
  );
};
