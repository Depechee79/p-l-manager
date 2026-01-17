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
import { useIsMobile } from '../shared/hooks';
import type { AppUser as User } from '@types';

export interface LayoutProps {
  children: ReactNode;
  user?: User | null;
  onLogout?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

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
          user={user as any}
          onLogout={onLogout}
          onClose={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: isMobile
            ? 'var(--height-mobile-header) var(--spacing-md) 100px'
            : 'var(--spacing-lg) var(--spacing-xl)',
          backgroundColor: 'var(--background)',
          minHeight: '100vh',
          position: 'relative',
          paddingBottom: isMobile ? '100px' : 'var(--spacing-lg)',
        }}
      >
        <div
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            width: '100%',
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
