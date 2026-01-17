import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@components';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import type { DashboardAlert } from '../hooks/useDashboardMetrics';

interface AlertsPanelProps {
    alerts: DashboardAlert[];
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts }) => {
    if (alerts.length === 0) return null;

    return (
        <Card title="Alertas y Notificaciones">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                {alerts.map((alert, idx) => (
                    <div
                        key={idx}
                        style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 'var(--spacing-md)',
                            padding: 'var(--spacing-md)',
                            borderRadius: 'var(--radius)',
                            border: `1px solid var(--${alert.type}-light)`,
                            backgroundColor: `var(--${alert.type}-lighter)`,
                        }}
                    >
                        <div style={{
                            color: `var(--${alert.type})`,
                            flexShrink: 0,
                            marginTop: '2px',
                        }}>
                            <AlertTriangle size={20} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 'var(--font-size-base)', fontWeight: '600', marginBottom: 'var(--spacing-xs)' }}>
                                {alert.title}
                            </div>
                            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                                {alert.message}
                            </div>
                        </div>
                        {alert.link && (
                            <Link
                                to={alert.link}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--spacing-xs)',
                                    color: `var(--${alert.type})`,
                                    textDecoration: 'none',
                                    fontSize: 'var(--font-size-sm)',
                                    fontWeight: '600',
                                    flexShrink: 0,
                                }}
                            >
                                Ver <ArrowRight size={14} />
                            </Link>
                        )}
                    </div>
                ))}
            </div>
        </Card>
    );
};
