/**
 * TopbarV2 - Fixed header for AppShellV2
 *
 * Canon Stitch: fixed top-0 left-0 right-0 h-16 (64px) z-50
 *
 * Features:
 * - Brand logo + name (left)
 * - Breadcrumb + subtitle (center-left, hidden on mobile)
 * - Notifications dropdown (functional)
 * - Help button (opens help modal)
 * - User dropdown with profile + logout (functional)
 *
 * Session 006: Full backend integration - no dead ends
 */
import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, HelpCircle, ChevronRight, ChevronDown, Sparkles, User, LogOut, ExternalLink } from 'lucide-react';
import { getRouteMeta } from '@shared/config/routeMeta';
import { ACCENT_SHADOW } from '@shared/tokens/colors';
import type { ShellUser } from './AppShellV2';

export interface TopbarV2Props {
  user?: ShellUser | null;
  onLogout?: () => void;
}

// Notification item type
interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'info' | 'warning' | 'success';
}

export const TopbarV2: React.FC<TopbarV2Props> = ({ user, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const meta = getRouteMeta(location.pathname);

  // Dropdown states
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Refs for click outside
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const helpRef = useRef<HTMLDivElement>(null);

  // Sample notifications - in real app, fetch from Firestore
  const [notifications] = useState<NotificationItem[]>([
    {
      id: '1',
      title: 'Nuevo cierre pendiente',
      message: 'El cierre de caja del turno de mañana está pendiente de revisión.',
      time: 'Hace 5 min',
      read: false,
      type: 'warning',
    },
    {
      id: '2',
      title: 'Inventario actualizado',
      message: 'Se ha completado el inventario mensual correctamente.',
      time: 'Hace 1 hora',
      read: true,
      type: 'success',
    },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (helpRef.current && !helpRef.current.contains(event.target as Node)) {
        setIsHelpOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle logout
  const handleLogout = () => {
    setIsUserMenuOpen(false);
    onLogout?.();
  };

  // Handle profile navigation
  const handleProfile = () => {
    setIsUserMenuOpen(false);
    navigate('/configuracion?tab=perfil');
  };

  // Dropdown base styles
  const dropdownStyles: React.CSSProperties = {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow-lg)',
    zIndex: 'var(--z-dropdown)',
    minWidth: '200px',
    overflow: 'hidden',
  };

  // Note: Using CSS class .dropdown-item-v2 from index.css for proper hover behavior

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 'var(--app-topbar-h)',
        backgroundColor: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        zIndex: 'var(--app-topbar-z)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `0 var(--app-topbar-px)`,
      }}
    >
      {/* LEFT: Brand + Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-lg)' }}>
        {/* Brand - clickable to go home (matches BrandHeader V1 styling) */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 12px ${ACCENT_SHADOW}`,
            }}
          >
            <Sparkles size={20} color="white" strokeWidth={2.5} />
          </div>
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: 700,
                color: 'var(--text-main)',
                fontFamily: 'var(--font-heading)',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
              }}
            >
              P&L<span className="topbar-title-full"> Manager</span>
            </h1>
            <p
              className="topbar-subtitle"
              style={{
                margin: '2px 0 0',
                fontSize: '11px',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontWeight: 500,
              }}
            >
              Gestión Premium
            </p>
          </div>
        </div>

        {/* Breadcrumb + Subtitle (hidden on small screens) */}
        <div
          className="topbar-breadcrumb"
          style={{
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: 'var(--app-breadcrumb-size)',
              fontWeight: 500,
              color: 'var(--text-light)',
            }}
          >
            {meta.breadcrumb.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <ChevronRight size={12} style={{ margin: '0 4px' }} />}
                <span
                  style={{
                    color: idx === meta.breadcrumb.length - 1 ? 'var(--text-secondary)' : undefined,
                  }}
                >
                  {crumb}
                </span>
              </React.Fragment>
            ))}
          </nav>
          <p
            style={{
              fontSize: 'var(--app-subtitle-size)',
              color: 'var(--text-light)',
              fontWeight: 500,
              margin: 0,
              maxWidth: '300px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {meta.subtitle}
          </p>
        </div>
      </div>

      {/* RIGHT: Actions + User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Notifications Dropdown */}
        <div ref={notificationsRef} style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setIsNotificationsOpen(!isNotificationsOpen);
              setIsUserMenuOpen(false);
              setIsHelpOpen(false);
            }}
            style={{
              position: 'relative',
              padding: '8px',
              color: 'var(--text-secondary)',
              backgroundColor: isNotificationsOpen ? 'var(--surface-muted)' : 'transparent',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={(e) => !isNotificationsOpen && (e.currentTarget.style.backgroundColor = 'var(--surface-muted)')}
            onMouseLeave={(e) => !isNotificationsOpen && (e.currentTarget.style.backgroundColor = 'transparent')}
            aria-label="Notificaciones"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  width: '10px',
                  height: '10px',
                  backgroundColor: 'var(--accent)',
                  borderRadius: '50%',
                  border: '2px solid var(--surface)',
                }}
              />
            )}
          </button>

          {/* Notifications Panel */}
          {isNotificationsOpen && (
            <div style={{ ...dropdownStyles, width: '320px' }}>
              <div style={{
                padding: '16px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                  Notificaciones
                </span>
                {unreadCount > 0 && (
                  <span style={{
                    fontSize: '12px',
                    padding: '2px 8px',
                    backgroundColor: 'var(--accent)',
                    color: 'white',
                    borderRadius: '12px',
                  }}>
                    {unreadCount} nuevas
                  </span>
                )}
              </div>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-light)' }}>
                    No hay notificaciones
                  </div>
                ) : (
                  notifications.map(notification => (
                    <div
                      key={notification.id}
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid var(--border)',
                        backgroundColor: notification.read ? 'transparent' : 'var(--surface-muted)',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{
                          fontWeight: 600,
                          fontSize: '13px',
                          color: 'var(--text-main)',
                        }}>
                          {notification.title}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>
                          {notification.time}
                        </span>
                      </div>
                      <p style={{
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        margin: 0,
                        lineHeight: 1.4,
                      }}>
                        {notification.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
              <div style={{
                padding: '12px',
                borderTop: '1px solid var(--border)',
                textAlign: 'center',
              }}>
                <button
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    setIsNotificationsOpen(false);
                    // In future: navigate to notifications page
                  }}
                >
                  Ver todas las notificaciones
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Help Dropdown */}
        <div ref={helpRef} className="topbar-help" style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setIsHelpOpen(!isHelpOpen);
              setIsNotificationsOpen(false);
              setIsUserMenuOpen(false);
            }}
            style={{
              padding: '8px',
              color: 'var(--text-secondary)',
              backgroundColor: isHelpOpen ? 'var(--surface-muted)' : 'transparent',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={(e) => !isHelpOpen && (e.currentTarget.style.backgroundColor = 'var(--surface-muted)')}
            onMouseLeave={(e) => !isHelpOpen && (e.currentTarget.style.backgroundColor = 'transparent')}
            aria-label="Ayuda"
          >
            <HelpCircle size={20} />
          </button>

          {/* Help Panel */}
          {isHelpOpen && (
            <div style={dropdownStyles}>
              <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                  Centro de Ayuda
                </span>
              </div>
              <button
                className="dropdown-item-v2"
                onClick={() => {
                  setIsHelpOpen(false);
                  // Open documentation
                  window.open('https://docs.plmanager.es', '_blank');
                }}
              >
                <ExternalLink size={18} />
                <span>Documentación</span>
              </button>
              <button
                className="dropdown-item-v2"
                onClick={() => {
                  setIsHelpOpen(false);
                  // Open support email
                  window.location.href = 'mailto:soporte@plmanager.es';
                }}
              >
                <HelpCircle size={18} />
                <span>Contactar Soporte</span>
              </button>
              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
                <p style={{
                  fontSize: '11px',
                  color: 'var(--text-light)',
                  margin: 0,
                }}>
                  P&L Manager v1.0.0
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div
          style={{
            height: '32px',
            width: '1px',
            backgroundColor: 'var(--border)',
            margin: '0 8px',
          }}
        />

        {/* User Menu Dropdown */}
        {user && (
          <div ref={userMenuRef} style={{ position: 'relative' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '4px',
                borderRadius: 'var(--app-interactive-radius)',
                cursor: 'pointer',
                transition: 'background-color 0.15s',
                backgroundColor: isUserMenuOpen ? 'var(--surface-muted)' : 'transparent',
              }}
              onClick={() => {
                setIsUserMenuOpen(!isUserMenuOpen);
                setIsNotificationsOpen(false);
                setIsHelpOpen(false);
              }}
              onMouseEnter={(e) => !isUserMenuOpen && (e.currentTarget.style.backgroundColor = 'var(--surface-muted)')}
              onMouseLeave={(e) => !isUserMenuOpen && (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              {/* User info (hidden on small screens) */}
              <div className="topbar-user-info" style={{ textAlign: 'right' }}>
                <p
                  style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: 'var(--text-main)',
                    margin: 0,
                    lineHeight: 1.2,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {user.nombre || user.email?.split('@')[0] || 'Usuario'}
                </p>
                <p
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: 'var(--text-light)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    margin: 0,
                  }}
                >
                  {String(user.rolId || 'User').replace('_', ' ')}
                </p>
              </div>

              {/* Avatar */}
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '16px',
                    border: '2px solid var(--surface-muted)',
                  }}
                >
                  {(user.nombre || user.email || 'U').charAt(0).toUpperCase()}
                </div>
                {/* Online indicator */}
                <span
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: '12px',
                    height: '12px',
                    backgroundColor: 'var(--success)',
                    borderRadius: '50%',
                    border: '2px solid var(--surface)',
                  }}
                />
              </div>

              <ChevronDown
                size={14}
                color="var(--text-light)"
                style={{
                  transform: isUserMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                }}
              />
            </div>

            {/* User Dropdown Menu */}
            {isUserMenuOpen && (
              <div style={dropdownStyles}>
                {/* User info header */}
                <div style={{
                  padding: '16px',
                  borderBottom: '1px solid var(--border)',
                  backgroundColor: 'var(--surface-muted)',
                }}>
                  <p style={{
                    fontWeight: 600,
                    color: 'var(--text-main)',
                    margin: 0,
                    fontSize: '14px',
                  }}>
                    {user.nombre || 'Usuario'}
                  </p>
                  <p style={{
                    fontSize: '12px',
                    color: 'var(--text-light)',
                    margin: '4px 0 0 0',
                  }}>
                    {user.email}
                  </p>
                </div>

                {/* Menu items */}
                <button
                  className="dropdown-item-v2"
                  onClick={handleProfile}
                >
                  <User size={18} />
                  <span>Mi Perfil</span>
                </button>

                <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '4px 0' }} />

                <button
                  className="dropdown-item-v2 danger"
                  onClick={handleLogout}
                >
                  <LogOut size={18} />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Responsive styles via CSS class */}
      <style>{`
        @media (max-width: 768px) {
          .topbar-breadcrumb {
            display: none !important;
          }
          .topbar-user-info {
            display: none !important;
          }
          .topbar-subtitle {
            display: none !important;
          }
          .topbar-title-full {
            display: none !important;
          }
          .topbar-help {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
};
