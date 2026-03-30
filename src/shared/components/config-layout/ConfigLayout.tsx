import React from 'react';
import { Card } from '@/shared/components';

interface ConfigListLayoutProps {
    header: React.ReactNode;
    children: React.ReactNode;
}

interface ConfigDetailLayoutProps {
    header: React.ReactNode;
    children: React.ReactNode;
}

/**
 * Layout estandarizado para LISTAS de configuración.
 * Características:
 * - Altura 100% (o calc)
 * - Header fijo (Filtros + CTA)
 * - Cuerpo con scroll independiente
 */
export const ConfigListLayout: React.FC<ConfigListLayoutProps> = ({ header, children }) => {
    return (
        <div style={{
            flex: '1 1 auto',
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            animation: 'fadeIn 0.3s ease'
        }}>
            {/* Header Fijo */}
            {header && (
                <div style={{ flex: '0 0 auto' }}>
                    <Card style={{ padding: '0', overflow: 'hidden' }}>
                        {header}
                    </Card>
                </div>
            )}

            {/* Cuerpo Scrollable */}
            <div style={{
                flex: '1 1 auto',
                minHeight: 0,
                overflowY: 'auto',
                scrollbarWidth: 'thin',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {children}
            </div>
        </div>
    );
};

/**
 * Layout estandarizado para DETALLE/EDICIÓN de configuración.
 * Características similar a ListLayout pero enfocado en contenido de form.
 */
export const ConfigDetailLayout: React.FC<ConfigDetailLayoutProps> = ({ header, children }) => {
    return (
        <div style={{
            flex: '1 1 auto',
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            animation: 'slideInRight 0.3s ease'
        }}>
            {/* Header Detalles Fijo */}
            {header && (
                <div style={{ flex: '0 0 auto', marginBottom: '16px' }}>
                    {header}
                </div>
            )}

            {/* Form Scrollable */}
            <div style={{
                flex: '1 1 auto',
                minHeight: 0,
                overflowY: 'auto',
                scrollbarWidth: 'thin'
            }}>
                <Card style={{ padding: '0', overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {/* El contenido interno del Card debe manejar su propio scroll si es necesario, 
                         o dejamos que el div padre haga scroll y el Card crezca.
                         Opción A (User Request): "la lista y su div es lo que hace scroll".
                         Aquí en detalle, asumiremos que si es largo, scrollea el contenido del Card.
                     */}
                    {children}
                </Card>
            </div>
        </div>
    );
};
