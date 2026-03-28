import React, { useState, useEffect } from 'react';
import { Play, Square } from 'lucide-react';
import { Button, Card, Table } from '@shared/components';
import { useRestaurantContext, useDatabase, useApp } from '@core';
import { logger } from '@core/services/LoggerService';
import { useToast } from '@utils/toast';
import type { TimeEntry } from '@types';

export const FichajesPage: React.FC = () => {
    const { currentRestaurant } = useRestaurantContext();
    const { user } = useApp();
    const { showToast } = useToast();
    const { db } = useDatabase();

    const [status, setStatus] = useState<'idle' | 'working' | 'break'>('idle');
    const [entryTime, setEntryTime] = useState<Date | null>(null);
    const [todayEntries, setTodayEntries] = useState<TimeEntry[]>([]);

    const [isLoadingLocation, setIsLoadingLocation] = useState(false);

    // AUDIT-FIX: Ensure data is loaded (R-14)
    useEffect(() => {
        const loadData = async () => {
            try {
                await Promise.all([
                    db.ensureLoaded('fichajes'),
                    db.ensureLoaded('workers')
                ]);
            } catch (error: unknown) {
                logger.error('Error loading FichajesPage data', error);
            }
        };
        loadData();
    }, [db]);

    // Derived state from DB
    useEffect(() => {
        const entries = (db.fichajes as TimeEntry[]).filter((f: TimeEntry) =>
            f.restaurantId === String(currentRestaurant?.id) &&
            f.date === new Date().toISOString().split('T')[0]
        );
        setTodayEntries(entries);

        // Determine current status based on last entry
        const lastEntry = entries[entries.length - 1];
        if (lastEntry && !lastEntry.exitTime) {
            setStatus('working');
            setEntryTime(new Date(lastEntry.entryTime));
        } else {
            setStatus('idle');
            setEntryTime(null);
        }
    }, [db.fichajes, currentRestaurant]);

    const handleClockIn = () => {
        setIsLoadingLocation(true);
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    createEntry({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    });
                },
                (geoError) => {
                    logger.warn('Geolocation error', geoError);
                    showToast({ title: 'Aviso', message: 'No se pudo obtener la ubicación. Fichaje registrado sin geo.', type: 'warning' });
                    createEntry();
                },
                { timeout: 5000, enableHighAccuracy: true }
            );
        } else {
            createEntry();
        }
    };

    const createEntry = async (location?: { lat: number; lng: number; accuracy: number }) => {
        try {
            const now = new Date();
            const newEntry: TimeEntry = {
                id: Date.now(), // Firestore will replace this ID usually, or we use uuid
                workerId: user?.name || 'unknown',
                restaurantId: String(currentRestaurant?.id || ''),
                date: now.toISOString().split('T')[0],
                entryTime: now.toISOString(),
                breaks: [],
                status: 'activo',
                location
            };

            await db.add('fichajes', newEntry);

            setIsLoadingLocation(false);
            showToast({
                title: 'Entrada registrada',
                message: location ? 'Has iniciado jornada 📍' : 'Has iniciado jornada',
                type: 'success'
            });
        } catch (error: unknown) {
            logger.error('Error creating time entry', error);
            setIsLoadingLocation(false);
            showToast({ title: 'Error', message: 'No se pudo registrar la entrada', type: 'error' });
        }
    };

    const handleClockOut = async () => {
        try {
            // Find active entry to close
            const activeEntry = todayEntries.find(e => !e.exitTime);
            if (activeEntry) {
                await db.update<TimeEntry>('fichajes', activeEntry.id, {
                    exitTime: new Date().toISOString(),
                    status: 'validado'
                });
                showToast({ title: 'Salida registrada', message: 'Has finalizado tu jornada', type: 'info' });
            } else {
                showToast({ title: 'Error', message: 'No tienes una jornada activa', type: 'warning' });
            }
        } catch (error: unknown) {
            logger.error('Error clocking out', error);
            showToast({ title: 'Error', message: 'No se pudo registrar la salida', type: 'error' });
        }
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: 'var(--spacing-lg)' }}>
            {/* Control Panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                <Card style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
                    <h2 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--spacing-md)' }}>
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </h2>
                    <div style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xl)' }}>
                        {new Date().toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--spacing-md)' }}>
                        {status === 'idle' ? (
                            <Button
                                variant="success"
                                size="lg"
                                style={{ width: '100%', height: '60px', fontSize: 'var(--font-size-lg)' }}
                                onClick={handleClockIn}
                                disabled={isLoadingLocation}
                            >
                                <Play size={24} style={{ marginRight: 'var(--spacing-sm)' }} />
                                {isLoadingLocation ? 'Localizando...' : 'Entrar'}
                            </Button>
                        ) : (
                            <Button
                                variant="danger"
                                size="lg"
                                style={{ width: '100%', height: '60px', fontSize: 'var(--font-size-lg)' }}
                                onClick={handleClockOut}
                            >
                                <Square size={24} style={{ marginRight: 'var(--spacing-sm)' }} /> Salir
                            </Button>
                        )}
                    </div>

                    {status === 'working' && (
                        <div style={{ marginTop: 'var(--spacing-lg)', padding: 'var(--spacing-md)', background: 'var(--success-light)', borderRadius: 'var(--radius)', color: 'var(--success-dark)' }}>
                            <div style={{ fontWeight: 600 }}>Jornada en curso</div>
                            <div style={{ fontSize: 'var(--font-size-xs)' }}>Iniciado a las {entryTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                    )}
                </Card>

                <Card>
                    <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>Resumen Semanal</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--spacing-sm) 0', borderBottom: '1px solid var(--border-light)' }}>
                        <span>Horas Trabajadas</span>
                        <span style={{ fontWeight: 600 }}>38.5h</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--spacing-sm) 0', borderBottom: '1px solid var(--border-light)' }}>
                        <span>Objetivo</span>
                        <span style={{ fontWeight: 600 }}>40h</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--spacing-sm) 0' }}>
                        <span>Balance</span>
                        <span style={{ fontWeight: 600, color: 'var(--warning)' }}>-1.5h</span>
                    </div>
                </Card>
            </div>

            {/* List */}
            <Card>
                <div style={{ marginBottom: 'var(--spacing-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>Historial de Fichajes</h3>
                    <Button variant="ghost" size="sm">Ver todo</Button>
                </div>
                <Table
                    data={todayEntries}
                    columns={[
                        { key: 'date', header: 'Fecha', render: () => new Date().toLocaleDateString() },
                        { key: 'entryTime', header: 'Hora Entrada', render: (_, row) => row.entryTime ? new Date(row.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-' },
                        { key: 'status', header: 'Estado', render: () => <span style={{ color: 'var(--success)' }}>Validado</span> },
                    ]}
                />
            </Card>
        </div>
    );
};
