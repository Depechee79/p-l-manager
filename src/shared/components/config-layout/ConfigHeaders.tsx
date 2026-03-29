import React from 'react';
import { Button, Badge } from '@/shared/components'; // Asumiendo imports
import { ArrowLeft } from 'lucide-react';

interface ConfigListHeaderProps {
    actions?: React.ReactNode; // Botón Nuevo, etc.
    children?: React.ReactNode; // Inputs de filtro
}

/**
 * Header de Lista Estandarizado.
 * Garantiza alineación base de Filtros (izq) y Acciones (der).
 */
export const ConfigListHeader: React.FC<ConfigListHeaderProps> = ({ actions, children }) => {
    return (
        <div style={{
            padding: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center', // Alineación vertical al centro para Inputs y Botones
            borderBottom: '1px solid var(--border)',
            flexWrap: 'wrap',
            gap: '16px'
        }}>
            {/* Área de Filtros (Expandible) */}
            <div style={{
                display: 'flex',
                gap: '16px',
                flex: '1 1 auto',
                minWidth: '300px',
                alignItems: 'center' // Asegura que inputs internos se alineen
            }}>
                {children}
            </div>

            {/* Área de Acciones (Fija a la derecha) */}
            {actions && (
                <div style={{ flex: '0 0 auto' }}>
                    {actions}
                </div>
            )}
        </div>
    );
};

interface ConfigDetailHeaderProps {
    title: string;
    badge?: string | React.ReactNode;
    badgeVariant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
    onBack: () => void;
    actions?: React.ReactNode; // Boton Guardar, Reset, etc.
}

/**
 * Header de Detalle Estandarizado.
 * Alineación correcta: Atrás <-> Titulo <-> Badge ........... Acciones
 */
export const ConfigDetailHeader: React.FC<ConfigDetailHeaderProps> = ({
    title,
    badge,
    badgeVariant = 'secondary',
    onBack,
    actions
}) => {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Grupo Izquierda: Atrás + Título + Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <Button variant="ghost" icon={<ArrowLeft size={18} />} onClick={onBack}>
                    Atrás
                </Button>

                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {title}
                </h3>

                {badge && (
                    <Badge variant={badgeVariant}>{badge}</Badge>
                )}
            </div>

            {/* Grupo Derecha: Acciones */}
            {actions && (
                <div style={{ display: 'flex', gap: '12px' }}>
                    {actions}
                </div>
            )}
        </div>
    );
};
