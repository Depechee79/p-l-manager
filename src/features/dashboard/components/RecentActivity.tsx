import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@components';
import { Receipt, Wallet, ScanLine, Package, User } from 'lucide-react';
import { formatDate } from '@utils';
import type { DashboardActivity } from '../hooks/useDashboardMetrics';

interface RecentActivityProps {
    activities: DashboardActivity[];
}

const IconMap: Record<string, React.ReactNode> = {
    Receipt: <Receipt size={16} />,
    Wallet: <Wallet size={16} />,
    ScanLine: <ScanLine size={16} />,
    Package: <Package size={16} />,
    User: <User size={16} />,
};

export const RecentActivity: React.FC<RecentActivityProps> = ({ activities }) => {
    return (
        <Card title="Actividad Reciente">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                {activities.length > 0 ? (
                    activities.map((activity, idx) => (
                        <Link
                            key={idx}
                            to={activity.link}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--spacing-md)',
                                padding: 'var(--spacing-md)',
                                borderRadius: 'var(--radius)',
                                border: '1px solid var(--border)',
                                textDecoration: 'none',
                                color: 'var(--text-main)',
                                transition: 'all var(--transition-base)',
                                backgroundColor: 'var(--surface)',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--surface-muted)';
                                e.currentTarget.style.borderColor = 'var(--border-focus)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--surface)';
                                e.currentTarget.style.borderColor = 'var(--border)';
                            }}
                        >
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: 'var(--radius)',
                                backgroundColor: 'var(--surface-muted)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--text-secondary)',
                                flexShrink: 0,
                            }}>
                                {IconMap[activity.icon] || <ScanLine size={16} />}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 'var(--font-size-base)', fontWeight: '600', marginBottom: 'var(--spacing-xs)' }}>
                                    {activity.title}
                                </div>
                                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {activity.subtitle}
                                </div>
                            </div>
                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-light)', flexShrink: 0 }}>
                                {formatDate(activity.date.toISOString())}
                            </div>
                        </Link>
                    ))
                ) : (
                    <div style={{ padding: 'var(--spacing-xl)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        No hay actividad reciente
                    </div>
                )}
            </div>
        </Card>
    );
};
