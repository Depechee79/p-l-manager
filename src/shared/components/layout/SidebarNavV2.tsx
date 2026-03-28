/**
 * SidebarNavV2 - Fixed sidebar for AppShellV2
 *
 * Session 006: Rewritten to match V1 Sidebar styling exactly
 * - Same NavLink styling (padding, gap, fontSize)
 * - Same colors (accent for active, text-secondary for inactive)
 * - Same hover effects
 * - Brand is in TopbarV2, not here
 */
import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { filterNavigationByPermissions } from './navConfig';
import { useUserPermissions } from '@shared/hooks';
import type { LucideIcon } from 'lucide-react';

export interface SidebarNavV2Props {
  /** Reserved for future use */
  className?: string;
}

interface NavItemProps {
  path: string;
  label: string;
  icon: LucideIcon;
}

const NavItem: React.FC<NavItemProps> = ({ path, label, icon: Icon }) => {
  const location = useLocation();

  // Match exact for root, startsWith for others
  const active = path === '/'
    ? location.pathname === '/'
    : location.pathname.startsWith(path);

  return (
    <Link
      to={path}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        height: 'var(--app-interactive-h)',
        padding: '0 16px',
        textDecoration: 'none',
        color: active ? 'var(--surface)' : 'var(--text-secondary)',
        background: active ? 'var(--accent)' : 'transparent',
        borderRadius: 'var(--app-interactive-radius)',
        fontWeight: active ? '600' : '500',
        fontSize: 'var(--app-interactive-font-size)',
        transition: 'all 200ms ease',
        border: 'none',
        position: 'relative',
        boxShadow: active ? 'var(--btn-shadow-primary)' : 'none',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'var(--surface-muted)';
          e.currentTarget.style.color = 'var(--text-main)';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'var(--text-secondary)';
        }
      }}
    >
      <Icon
        size={16}
        strokeWidth={active ? 2.5 : 2}
        style={{ flexShrink: 0 }}
      />
      <span>{label}</span>
    </Link>
  );
};

export const SidebarNavV2: React.FC<SidebarNavV2Props> = () => {
  const { permissions } = useUserPermissions();

  // Get flat list of nav items filtered by permissions
  const navItems = useMemo(() => {
    const filtered = filterNavigationByPermissions(permissions);
    return filtered.flatMap(category => category.items);
  }, [permissions]);

  return (
    <aside
      className="sidebar-v2"
      style={{
        position: 'fixed',
        left: 0,
        bottom: 0,
        top: 'var(--app-topbar-h)',
        width: 'var(--app-sidebar-w)',
        backgroundColor: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        overflowY: 'auto',
        zIndex: 'var(--app-sidebar-z)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Navigation */}
      <nav
        style={{
          flex: 1,
          padding: 'var(--spacing-lg) var(--spacing-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-xs)',
        }}
      >
        {navItems.map((item) => (
          <NavItem
            key={item.path}
            path={item.path}
            label={item.label}
            icon={item.icon}
          />
        ))}
      </nav>

      {/* Hide on mobile via CSS */}
      <style>{`
        @media (max-width: 1023px) {
          .sidebar-v2 {
            display: none !important;
          }
        }
      `}</style>
    </aside>
  );
};
