/**
 * GastosFijosPage - Fixed expenses management page
 * 
 * CRUD interface for managing recurring operational expenses (OPEX):
 * rent, utilities, insurance, services, marketing, cleaning, etc.
 * 
 * These expenses feed directly into the P&L calculation.
 */
import React, { useState, useMemo } from 'react';
import {
    PlusCircle,
    Search,
    Edit,
    Trash2,
    Save,
    Building2
} from 'lucide-react';
import { Button, Input, Select, Table, Card, FormSection, DatePicker } from '@shared/components';
import { formatDateOnly } from '@shared/utils/dateUtils';
import { useDatabase, useRestaurant } from '@core';
import { logger } from '@core/services/LoggerService';
import { useToast } from '../utils/toast';
import { formatCurrency } from '../utils/formatters';
import type { GastoFijo, GastoFijoTipo } from '../types';
import { GASTO_FIJO_LABELS, GASTO_FIJO_ICONS, calculateGastosFijosSummary } from '../utils/gastosCalculations';

// Type options for the form dropdown
const TIPO_OPTIONS: { value: GastoFijoTipo; label: string }[] = [
    { value: 'alquiler', label: 'Alquiler' },
    { value: 'suministros', label: 'Suministros (Luz, Agua, Gas)' },
    { value: 'servicios', label: 'Servicios (Internet, Teléfono)' },
    { value: 'seguros', label: 'Seguros' },
    { value: 'marketing', label: 'Marketing y Publicidad' },
    { value: 'limpieza', label: 'Limpieza' },
    { value: 'otros', label: 'Otros Gastos Fijos' },
];

export const GastosFijosPage: React.FC = () => {
    const { db } = useDatabase();
    const { showToast } = useToast();
    const { currentRestaurant } = useRestaurant();

    // AUDIT-FIX: Ensure data is loaded (R-14)
    React.useEffect(() => {
        const loadData = async () => {
            try {
                await db.ensureLoaded('gastosFijos');
            } catch (error: unknown) {
                logger.error('Error loading GastosFijosPage data', error);
            }
        };
        loadData();
    }, [db]);

    const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
    const [editingGasto, setEditingGasto] = useState<GastoFijo | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Form state
    const [formData, setFormData] = useState<{
        tipo: GastoFijoTipo;
        descripcion: string;
        importeMensual: number;
        proveedor: string;
        fechaInicio: string;
        fechaFin: string;
        notas: string;
        activo: boolean;
    }>({
        tipo: 'alquiler',
        descripcion: '',
        importeMensual: 0,
        proveedor: '',
        fechaInicio: formatDateOnly(new Date()),
        fechaFin: '',
        notas: '',
        activo: true,
    });

    // Get gastos from database
    const gastosFijos = db.gastosFijos as GastoFijo[];

    // Filter by current restaurant and search query
    const filteredGastos = useMemo(() => {
        return gastosFijos.filter(g => {
            const matchSearch =
                g.descripcion.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (g.proveedor || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                GASTO_FIJO_LABELS[g.tipo].toLowerCase().includes(searchQuery.toLowerCase());
            const matchRestaurant = currentRestaurant?.id
                ? String(g.restaurantId) === String(currentRestaurant.id)
                : true;
            return matchSearch && matchRestaurant;
        }).sort((a, b) => {
            // Sort by active first, then by tipo
            if (a.activo !== b.activo) return a.activo ? -1 : 1;
            return GASTO_FIJO_LABELS[a.tipo].localeCompare(GASTO_FIJO_LABELS[b.tipo]);
        });
    }, [gastosFijos, searchQuery, currentRestaurant]);

    // Calculate summary for display
    const summary = useMemo(() => {
        const restaurantGastos = currentRestaurant?.id
            ? gastosFijos.filter(g => String(g.restaurantId) === String(currentRestaurant.id))
            : gastosFijos;
        return calculateGastosFijosSummary(restaurantGastos);
    }, [gastosFijos, currentRestaurant]);

    // Reset form when opening new
    const handleOpenForm = () => {
        setEditingGasto(null);
        setFormData({
            tipo: 'alquiler',
            descripcion: '',
            importeMensual: 0,
            proveedor: '',
            fechaInicio: formatDateOnly(new Date()),
            fechaFin: '',
            notas: '',
            activo: true,
        });
        setViewMode('form');
    };

    // Edit existing gasto
    const handleEdit = (gasto: GastoFijo) => {
        setEditingGasto(gasto);
        setFormData({
            tipo: gasto.tipo,
            descripcion: gasto.descripcion,
            importeMensual: gasto.importeMensual,
            proveedor: gasto.proveedor || '',
            fechaInicio: gasto.fechaInicio,
            fechaFin: gasto.fechaFin || '',
            notas: gasto.notas || '',
            activo: gasto.activo,
        });
        setViewMode('form');
    };

    // Save gasto
    const handleSave = () => {
        if (!formData.descripcion || formData.importeMensual <= 0) {
            showToast({
                type: 'warning',
                title: 'Campos incompletos',
                message: 'Descripción e importe mensual son obligatorios'
            });
            return;
        }

        if (!currentRestaurant?.id) {
            showToast({
                type: 'error',
                title: 'Error',
                message: 'Selecciona un restaurante primero'
            });
            return;
        }

        const gastoData: Omit<GastoFijo, 'id'> = {
            restaurantId: currentRestaurant.id,
            tipo: formData.tipo,
            descripcion: formData.descripcion,
            importeMensual: formData.importeMensual,
            proveedor: formData.proveedor || undefined,
            fechaInicio: formData.fechaInicio,
            fechaFin: formData.fechaFin || undefined,
            activo: formData.activo,
            notas: formData.notas || undefined,
        };

        try {
            if (editingGasto) {
                db.update('gastosFijos', editingGasto.id, gastoData);
                showToast({
                    type: 'success',
                    title: 'Gasto actualizado',
                    message: 'El gasto fijo ha sido actualizado correctamente'
                });
            } else {
                db.add('gastosFijos', gastoData);
                showToast({
                    type: 'success',
                    title: 'Gasto añadido',
                    message: 'El gasto fijo ha sido registrado correctamente'
                });
            }
            setViewMode('list');
        } catch (error: unknown) {
            logger.error('Error saving gasto fijo', error);
            showToast({
                type: 'error',
                title: 'Error',
                message: 'No se pudo guardar el gasto fijo'
            });
        }
    };

    // Delete gasto
    const handleDelete = (gasto: GastoFijo) => {
        if (confirm(`¿Eliminar "${gasto.descripcion}"?`)) {
            try {
                db.delete('gastosFijos', gasto.id);
                showToast({
                    type: 'success',
                    title: 'Gasto eliminado',
                    message: 'El gasto fijo ha sido eliminado'
                });
            } catch (error: unknown) {
                logger.error('Error deleting gasto fijo', error);
                showToast({
                    type: 'error',
                    title: 'Error',
                    message: 'No se pudo eliminar el gasto fijo'
                });
            }
        }
    };

    // Toggle active status
    const handleToggleActive = (gasto: GastoFijo) => {
        try {
            db.update<GastoFijo>('gastosFijos', gasto.id, { activo: !gasto.activo });
            showToast({
                type: 'info',
                title: gasto.activo ? 'Gasto desactivado' : 'Gasto activado',
                message: `"${gasto.descripcion}" ${gasto.activo ? 'ya no se incluirá' : 'se incluirá'} en el P&L`
            });
        } catch (error: unknown) {
            logger.error('Error toggling gasto fijo status', error);
            showToast({ type: 'error', title: 'Error', message: 'No se pudo actualizar el estado' });
        }
    };

    return (
        <div style={{ padding: 'var(--spacing-md)', paddingBottom: '80px' }}>
            {/* Header */}
            <div style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--spacing-sm)' }}>
                <div>
                    <h1 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                        <Building2 size={24} />
                        Gastos Fijos
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                        Gastos operativos recurrentes (OPEX) {currentRestaurant && ` - ${currentRestaurant.nombre}`}
                    </p>
                </div>
                {viewMode === 'list' && (
                    <Button variant="primary" onClick={handleOpenForm}>
                        <PlusCircle size={18} style={{ marginRight: '8px' }} /> Nuevo Gasto
                    </Button>
                )}
            </div>

            {viewMode === 'list' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                    {/* Summary Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--spacing-sm)' }}>
                        <Card>
                            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>Total Mensual</p>
                            <p style={{ fontSize: '20px', fontWeight: '700', color: 'var(--accent)' }}>{formatCurrency(summary.total)}</p>
                        </Card>
                        <Card>
                            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {GASTO_FIJO_ICONS.alquiler} Alquiler
                            </p>
                            <p style={{ fontSize: '16px', fontWeight: '600' }}>{formatCurrency(summary.alquiler)}</p>
                        </Card>
                        <Card>
                            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {GASTO_FIJO_ICONS.suministros} Suministros
                            </p>
                            <p style={{ fontSize: '16px', fontWeight: '600' }}>{formatCurrency(summary.suministros)}</p>
                        </Card>
                        <Card>
                            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {GASTO_FIJO_ICONS.seguros} Seguros
                            </p>
                            <p style={{ fontSize: '16px', fontWeight: '600' }}>{formatCurrency(summary.seguros)}</p>
                        </Card>
                    </div>

                    {/* Search */}
                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                        <div style={{ flex: 1 }}>
                            <Input
                                placeholder="Buscar por descripción o proveedor..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                icon={<Search size={18} />}
                                fullWidth
                            />
                        </div>
                    </div>

                    {/* List */}
                    <Card>
                        {filteredGastos.length === 0 ? (
                            <div style={{ padding: 'var(--spacing-xl)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                {gastosFijos.length === 0
                                    ? 'No hay gastos fijos registrados. Añade alquiler, suministros, seguros...'
                                    : 'No se encontraron gastos con los filtros actuales.'}
                            </div>
                        ) : (
                            <Table<Record<string, React.ReactNode>>
                                columns={[
                                    { key: 'tipo', header: 'Tipo' },
                                    { key: 'descripcion', header: 'Descripción' },
                                    { key: 'importe', header: 'Mensual' },
                                    { key: 'acciones', header: '' }
                                ]}
                                data={filteredGastos.map(g => ({
                                    id: g.id,
                                    tipo: (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                                            <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>{GASTO_FIJO_ICONS[g.tipo]}</span>
                                            <span style={{
                                                fontWeight: '500',
                                                opacity: g.activo ? 1 : 0.5,
                                                textDecoration: g.activo ? 'none' : 'line-through'
                                            }}>
                                                {GASTO_FIJO_LABELS[g.tipo]}
                                            </span>
                                        </div>
                                    ),
                                    descripcion: (
                                        <div style={{ opacity: g.activo ? 1 : 0.5 }}>
                                            <div style={{ fontWeight: '600' }}>{g.descripcion}</div>
                                            {g.proveedor && (
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{g.proveedor}</div>
                                            )}
                                        </div>
                                    ),
                                    importe: (
                                        <span style={{
                                            fontWeight: '700',
                                            color: g.activo ? 'var(--text-main)' : 'var(--text-muted)',
                                            textDecoration: g.activo ? 'none' : 'line-through'
                                        }}>
                                            {formatCurrency(g.importeMensual)}
                                        </span>
                                    ),
                                    acciones: (
                                        <div style={{ display: 'flex', gap: 'var(--spacing-xs)', justifyContent: 'flex-end' }}>
                                            <Button
                                                variant={g.activo ? 'secondary' : 'primary'}
                                                size="sm"
                                                onClick={() => handleToggleActive(g)}
                                                title={g.activo ? 'Desactivar' : 'Activar'}
                                            >
                                                {g.activo ? '⏸️' : '▶️'}
                                            </Button>
                                            <Button variant="secondary" size="sm" onClick={() => handleEdit(g)}>
                                                <Edit size={14} />
                                            </Button>
                                            <Button variant="danger" size="sm" onClick={() => handleDelete(g)}>
                                                <Trash2 size={14} />
                                            </Button>
                                        </div>
                                    )
                                }))}
                            />
                        )}
                    </Card>
                </div>
            ) : (
                /* Form View */
                <Card>
                    <div style={{ marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                        <Button variant="ghost" size="sm" onClick={() => setViewMode('list')}>
                            ← Volver
                        </Button>
                        <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600' }}>
                            {editingGasto ? 'Editar Gasto Fijo' : 'Nuevo Gasto Fijo'}
                        </h2>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                        <FormSection title="Información del Gasto">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                                <Select
                                    label="Tipo de Gasto *"
                                    value={formData.tipo}
                                    onChange={(val) => setFormData({ ...formData, tipo: val as GastoFijoTipo })}
                                    options={TIPO_OPTIONS}
                                    fullWidth
                                    required
                                />
                                <Input
                                    label="Importe Mensual (€) *"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.importeMensual}
                                    onChange={(e) => setFormData({ ...formData, importeMensual: parseFloat(e.target.value) || 0 })}
                                    fullWidth
                                    required
                                />
                            </div>

                            <div style={{ marginTop: 'var(--spacing-md)' }}>
                                <Input
                                    label="Descripción *"
                                    value={formData.descripcion}
                                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                    placeholder="Ej: Alquiler local comercial, Factura luz..."
                                    fullWidth
                                    required
                                />
                            </div>

                            <div style={{ marginTop: 'var(--spacing-md)' }}>
                                <Input
                                    label="Proveedor / Empresa"
                                    value={formData.proveedor}
                                    onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
                                    placeholder="Ej: Endesa, Mapfre, Vodafone..."
                                    fullWidth
                                />
                            </div>
                        </FormSection>

                        <FormSection title="Período de Vigencia">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                                <DatePicker
                                    label="Fecha Inicio *"
                                    value={formData.fechaInicio}
                                    onChange={(date) => setFormData({ ...formData, fechaInicio: date })}
                                    fullWidth
                                    required
                                />
                                <DatePicker
                                    label="Fecha Fin (opcional)"
                                    value={formData.fechaFin}
                                    onChange={(date) => setFormData({ ...formData, fechaFin: date })}
                                    fullWidth
                                />
                            </div>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 'var(--spacing-xs)' }}>
                                Deja "Fecha Fin" vacía si el gasto es indefinido.
                            </p>
                        </FormSection>

                        <FormSection title="Estado">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.activo}
                                        onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                                        style={{ width: '20px', height: '20px' }}
                                    />
                                    <span style={{ fontWeight: '500' }}>Gasto activo</span>
                                </label>
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                    (Los gastos inactivos no se incluyen en el P&L)
                                </span>
                            </div>
                        </FormSection>

                        <FormSection title="Notas Adicionales">
                            <Input
                                value={formData.notas}
                                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                                placeholder="Observaciones opcionales..."
                                fullWidth
                            />
                        </FormSection>

                        <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end', marginTop: 'var(--spacing-lg)' }}>
                            <Button variant="secondary" onClick={() => setViewMode('list')}>
                                Cancelar
                            </Button>
                            <Button variant="primary" onClick={handleSave}>
                                <Save size={16} /> {editingGasto ? 'Actualizar' : 'Guardar Gasto'}
                            </Button>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
};
