/**
 * NominasPage - Payroll management page
 * 
 * CRUD interface for managing employee payroll (nóminas).
 * This data feeds into P&L for accurate Labor Cost calculation.
 */
import React, { useState, useMemo } from 'react';
import {
    PlusCircle,
    Search,
    Edit,
    Trash2,
    Save,
    Users,
    Check
} from 'lucide-react';
import { Button, Input, Select, Table, Card, FormSection, Badge } from '@shared/components';
import { formatDateOnly } from '@shared/utils/dateUtils';
import { useDatabase, useRestaurant } from '@core';
import { logger } from '@core/services/LoggerService';
import { useToast } from '../utils/toast';
import { formatCurrency } from '../utils/formatters';
import type { Nomina, NominaStatus, Worker } from '../types';
import { NOMINA_STATUS_LABELS, calculateNominaSummary } from '../utils/personalCalculations';

// Month names for display
const MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// Status options for select
const STATUS_OPTIONS: { value: NominaStatus; label: string }[] = [
    { value: 'borrador', label: '📝 Borrador' },
    { value: 'pendiente', label: '⏳ Pendiente de Pago' },
    { value: 'pagada', label: '✅ Pagada' },
    { value: 'anulada', label: '❌ Anulada' },
];

export const NominasPage: React.FC = () => {
    const { db } = useDatabase();
    const { showToast } = useToast();
    const { currentRestaurant } = useRestaurant();

    const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
    const [editingNomina, setEditingNomina] = useState<Nomina | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterMes, setFilterMes] = useState<number>(new Date().getMonth() + 1);
    const [filterAnio, setFilterAnio] = useState<number>(new Date().getFullYear());

    // AUDIT-FIX: Ensure data is loaded (R-14)
    React.useEffect(() => {
        const loadData = async () => {
            try {
                await Promise.all([
                    db.ensureLoaded('workers'),
                    db.ensureLoaded('nominas')
                ]);
            } catch (error: unknown) {
                logger.error('Error loading NominasPage data', error);
            }
        };
        loadData();
    }, [db]);

    // Form state
    const [formData, setFormData] = useState<{
        workerId: string;
        mes: number;
        anio: number;
        salarioBruto: number;
        seguridadSocialEmpresa: number;
        seguridadSocialTrabajador: number;
        irpf: number;
        horasNormales: number;
        horasExtras: number;
        importeHorasExtras: number;
        complementos: number;
        deducciones: number;
        status: NominaStatus;
        notas: string;
    }>({
        workerId: '',
        mes: new Date().getMonth() + 1,
        anio: new Date().getFullYear(),
        salarioBruto: 0,
        seguridadSocialEmpresa: 0,
        seguridadSocialTrabajador: 0,
        irpf: 0,
        horasNormales: 160,
        horasExtras: 0,
        importeHorasExtras: 0,
        complementos: 0,
        deducciones: 0,
        status: 'borrador',
        notas: '',
    });

    // Get data from database
    const nominas = db.nominas as Nomina[];
    const workers = db.workers as Worker[];

    // Filter by restaurant, period and search
    const filteredNominas = useMemo(() => {
        return nominas.filter(n => {
            const matchSearch = n.workerNombre.toLowerCase().includes(searchQuery.toLowerCase());
            const matchRestaurant = currentRestaurant?.id
                ? String(n.restaurantId) === String(currentRestaurant.id)
                : true;
            const matchPeriod = n.mes === filterMes && n.anio === filterAnio;
            return matchSearch && matchRestaurant && matchPeriod;
        }).sort((a, b) => a.workerNombre.localeCompare(b.workerNombre));
    }, [nominas, searchQuery, currentRestaurant, filterMes, filterAnio]);

    // Calculate summary
    const summary = useMemo(() => {
        const restaurantNominas = currentRestaurant?.id
            ? nominas.filter(n =>
                String(n.restaurantId) === String(currentRestaurant.id) &&
                n.mes === filterMes && n.anio === filterAnio
            )
            : nominas.filter(n => n.mes === filterMes && n.anio === filterAnio);
        return calculateNominaSummary(restaurantNominas);
    }, [nominas, currentRestaurant, filterMes, filterAnio]);

    // Calculate salario neto from form data
    const calcularSalarioNeto = () => {
        return formData.salarioBruto
            + formData.importeHorasExtras
            + formData.complementos
            - formData.seguridadSocialTrabajador
            - formData.irpf
            - formData.deducciones;
    };

    // Auto-calculate SS empresa when bruto changes (~30%)
    const handleBrutoChange = (bruto: number) => {
        const ssEmpresa = Math.round(bruto * 0.30 * 100) / 100;
        const ssTrabajador = Math.round(bruto * 0.0635 * 100) / 100;
        setFormData({
            ...formData,
            salarioBruto: bruto,
            seguridadSocialEmpresa: ssEmpresa,
            seguridadSocialTrabajador: ssTrabajador,
        });
    };

    // Open form for new nomina
    const handleOpenForm = () => {
        setEditingNomina(null);
        setFormData({
            workerId: '',
            mes: filterMes,
            anio: filterAnio,
            salarioBruto: 0,
            seguridadSocialEmpresa: 0,
            seguridadSocialTrabajador: 0,
            irpf: 0,
            horasNormales: 160,
            horasExtras: 0,
            importeHorasExtras: 0,
            complementos: 0,
            deducciones: 0,
            status: 'borrador',
            notas: '',
        });
        setViewMode('form');
    };

    // Edit existing nomina
    const handleEdit = (nomina: Nomina) => {
        setEditingNomina(nomina);
        setFormData({
            workerId: String(nomina.workerId),
            mes: nomina.mes,
            anio: nomina.anio,
            salarioBruto: nomina.salarioBruto,
            seguridadSocialEmpresa: nomina.seguridadSocialEmpresa,
            seguridadSocialTrabajador: nomina.seguridadSocialTrabajador,
            irpf: nomina.irpf,
            horasNormales: nomina.horasNormales,
            horasExtras: nomina.horasExtras,
            importeHorasExtras: nomina.importeHorasExtras,
            complementos: nomina.complementos,
            deducciones: nomina.deducciones,
            status: nomina.status,
            notas: nomina.notas || '',
        });
        setViewMode('form');
    };

    // Save nomina
    const handleSave = () => {
        if (!formData.workerId || formData.salarioBruto <= 0) {
            showToast({
                type: 'warning',
                title: 'Campos incompletos',
                message: 'Selecciona un trabajador y el salario bruto'
            });
            return;
        }

        if (!currentRestaurant?.id) {
            showToast({ type: 'error', title: 'Error', message: 'Selecciona un restaurante' });
            return;
        }

        const worker = workers.find(w => String(w.id) === formData.workerId);
        if (!worker) {
            showToast({ type: 'error', title: 'Error', message: 'Trabajador no encontrado' });
            return;
        }

        const nominaData: Omit<Nomina, 'id'> = {
            restaurantId: currentRestaurant.id,
            workerId: formData.workerId,
            workerNombre: `${worker.nombre} ${worker.apellidos || ''}`.trim(),
            mes: formData.mes,
            anio: formData.anio,
            periodo: `${formData.anio}-${String(formData.mes).padStart(2, '0')}`,
            salarioBruto: formData.salarioBruto,
            seguridadSocialEmpresa: formData.seguridadSocialEmpresa,
            seguridadSocialTrabajador: formData.seguridadSocialTrabajador,
            irpf: formData.irpf,
            salarioNeto: calcularSalarioNeto(),
            horasNormales: formData.horasNormales,
            horasExtras: formData.horasExtras,
            importeHorasExtras: formData.importeHorasExtras,
            complementos: formData.complementos,
            deducciones: formData.deducciones,
            status: formData.status,
            notas: formData.notas || undefined,
        };

        try {
            if (editingNomina) {
                db.update<Nomina>('nominas', editingNomina.id, nominaData);
                showToast({ type: 'success', title: 'Nómina actualizada', message: 'Los cambios se han guardado' });
            } else {
                db.add<Nomina>('nominas', nominaData);
                showToast({ type: 'success', title: 'Nómina creada', message: 'La nómina se ha registrado correctamente' });
            }
            setViewMode('list');
        } catch (error: unknown) {
            logger.error('Error saving nomina', error);
            showToast({ type: 'error', title: 'Error', message: 'No se pudo guardar la nómina' });
        }
    };

    // Delete nomina
    const handleDelete = (nomina: Nomina) => {
        if (confirm(`¿Eliminar nómina de ${nomina.workerNombre}?`)) {
            try {
                db.delete('nominas', nomina.id);
                showToast({ type: 'success', title: 'Eliminada', message: 'La nómina ha sido eliminada' });
            } catch (error: unknown) {
                logger.error('Error deleting nomina', error);
                showToast({ type: 'error', title: 'Error', message: 'No se pudo eliminar' });
            }
        }
    };

    // Mark as paid
    const handleMarkPaid = (nomina: Nomina) => {
        try {
            db.update<Nomina>('nominas', nomina.id, {
                status: 'pagada',
                fechaPago: formatDateOnly(new Date())
            });
            showToast({ type: 'success', title: 'Marcada como pagada', message: `Nómina de ${nomina.workerNombre}` });
        } catch (error: unknown) {
            logger.error('Error marking nomina as paid', error);
            showToast({ type: 'error', title: 'Error', message: 'No se pudo actualizar' });
        }
    };

    // Year options
    const yearOptions = Array.from({ length: 3 }, (_, i) => ({
        value: String(new Date().getFullYear() - 1 + i),
        label: String(new Date().getFullYear() - 1 + i),
    }));

    // Month options
    const monthOptions = MESES.map((mes, i) => ({
        value: String(i + 1),
        label: mes,
    }));

    return (
        <div style={{ padding: 'var(--spacing-md)', paddingBottom: '80px' }}>
            {/* Header */}
            <div style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--spacing-sm)' }}>
                <div>
                    <h1 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                        <Users size={24} />
                        Nóminas
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                        Gestión de nóminas mensuales {currentRestaurant && ` - ${currentRestaurant.nombre}`}
                    </p>
                </div>
                {viewMode === 'list' && (
                    <Button variant="primary" onClick={handleOpenForm}>
                        <PlusCircle size={18} style={{ marginRight: '8px' }} /> Nueva Nómina
                    </Button>
                )}
            </div>

            {viewMode === 'list' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                    {/* Period Selector */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-sm)' }}>
                        <Select
                            label="Mes"
                            value={String(filterMes)}
                            onChange={(v) => setFilterMes(Number(v))}
                            options={monthOptions}
                            fullWidth
                        />
                        <Select
                            label="Año"
                            value={String(filterAnio)}
                            onChange={(v) => setFilterAnio(Number(v))}
                            options={yearOptions}
                            fullWidth
                        />
                    </div>

                    {/* Summary Cards — grid-cols-2 on mobile, auto-fit on desktop */}
                    <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: 'var(--spacing-sm)' }}>
                        <Card>
                            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Coste Personal Total</p>
                            <p style={{ fontSize: '20px', fontWeight: '700', color: 'var(--accent)' }}>{formatCurrency(summary.totalCostePersonal)}</p>
                        </Card>
                        <Card>
                            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Salarios Brutos</p>
                            <p style={{ fontSize: '16px', fontWeight: '600' }}>{formatCurrency(summary.totalSalarioBruto)}</p>
                        </Card>
                        <Card>
                            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Seg. Social Empresa</p>
                            <p style={{ fontSize: '16px', fontWeight: '600' }}>{formatCurrency(summary.totalSeguridadSocialEmpresa)}</p>
                        </Card>
                        <Card>
                            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Nóminas</p>
                            <p style={{ fontSize: '16px', fontWeight: '600' }}>{summary.countNominas}</p>
                        </Card>
                    </div>

                    {/* Search */}
                    <Input
                        placeholder="Buscar por nombre de trabajador..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        icon={<Search size={18} />}
                        fullWidth
                    />

                    {/* List — Desktop table */}
                    <div className="hidden md:block">
                        <Card>
                            {filteredNominas.length === 0 ? (
                                <div style={{ padding: 'var(--spacing-xl)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                    No hay nóminas para {MESES[filterMes - 1]} {filterAnio}
                                </div>
                            ) : (
                                <Table<Record<string, React.ReactNode>>
                                    columns={[
                                        { key: 'trabajador', header: 'Trabajador' },
                                        { key: 'bruto', header: 'Bruto' },
                                        { key: 'coste', header: 'Coste Total' },
                                        { key: 'status', header: 'Estado' },
                                        { key: 'acciones', header: '' }
                                    ]}
                                    data={filteredNominas.map(n => ({
                                        id: n.id,
                                        trabajador: (
                                            <div>
                                                <div style={{ fontWeight: '600' }}>{n.workerNombre}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                                    {MESES[n.mes - 1]} {n.anio}
                                                </div>
                                            </div>
                                        ),
                                        bruto: formatCurrency(n.salarioBruto),
                                        coste: (
                                            <span style={{ fontWeight: '600' }}>
                                                {formatCurrency(n.salarioBruto + n.seguridadSocialEmpresa)}
                                            </span>
                                        ),
                                        status: (
                                            <Badge
                                                variant={n.status === 'pagada' ? 'success' : n.status === 'pendiente' ? 'warning' : 'secondary'}
                                            >
                                                {NOMINA_STATUS_LABELS[n.status]}
                                            </Badge>
                                        ),
                                        acciones: (
                                            <div style={{ display: 'flex', gap: 'var(--spacing-xs)', justifyContent: 'flex-end' }}>
                                                {n.status === 'pendiente' && (
                                                    <Button variant="success" size="sm" onClick={() => handleMarkPaid(n)} title="Marcar pagada">
                                                        <Check size={14} />
                                                    </Button>
                                                )}
                                                <Button variant="secondary" size="sm" onClick={() => handleEdit(n)}>
                                                    <Edit size={14} />
                                                </Button>
                                                <Button variant="danger" size="sm" onClick={() => handleDelete(n)}>
                                                    <Trash2 size={14} />
                                                </Button>
                                            </div>
                                        )
                                    }))}
                                />
                            )}
                        </Card>
                    </div>

                    {/* List — Mobile cards */}
                    <div className="md:hidden" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                        {filteredNominas.length === 0 ? (
                            <div style={{ padding: 'var(--spacing-xl)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                No hay nóminas para {MESES[filterMes - 1]} {filterAnio}
                            </div>
                        ) : (
                            filteredNominas.map(n => (
                                <div
                                    key={String(n.id)}
                                    style={{
                                        background: 'var(--surface)',
                                        borderRadius: 'var(--radius)',
                                        padding: 'var(--spacing-md)',
                                        border: '1px solid var(--border)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 'var(--spacing-sm)',
                                    }}
                                >
                                    {/* Row 1: Name + Status */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ fontWeight: '600', fontSize: 'var(--font-size-base)' }}>{n.workerNombre}</div>
                                        <Badge
                                            variant={n.status === 'pagada' ? 'success' : n.status === 'pendiente' ? 'warning' : 'secondary'}
                                        >
                                            {NOMINA_STATUS_LABELS[n.status]}
                                        </Badge>
                                    </div>
                                    {/* Row 2: Period + Amounts */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                                        <span>{MESES[n.mes - 1]} {n.anio}</span>
                                        <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                                            <span>Bruto: {formatCurrency(n.salarioBruto)}</span>
                                            <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                                                Coste: {formatCurrency(n.salarioBruto + n.seguridadSocialEmpresa)}
                                            </span>
                                        </div>
                                    </div>
                                    {/* Row 3: Actions */}
                                    <div style={{ display: 'flex', gap: 'var(--spacing-xs)', justifyContent: 'flex-end', paddingTop: 'var(--spacing-xs)', borderTop: '1px solid var(--border)' }}>
                                        {n.status === 'pendiente' && (
                                            <Button variant="success" size="sm" onClick={() => handleMarkPaid(n)} title="Marcar pagada" style={{ minHeight: '44px', minWidth: '44px' }}>
                                                <Check size={14} />
                                            </Button>
                                        )}
                                        <Button variant="secondary" size="sm" onClick={() => handleEdit(n)} style={{ minHeight: '44px', minWidth: '44px' }}>
                                            <Edit size={14} />
                                        </Button>
                                        <Button variant="danger" size="sm" onClick={() => handleDelete(n)} style={{ minHeight: '44px', minWidth: '44px' }}>
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            ) : (
                /* Form View */
                <Card>
                    <div style={{ marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                        <Button variant="ghost" size="sm" onClick={() => setViewMode('list')}>
                            ← Volver
                        </Button>
                        <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600' }}>
                            {editingNomina ? 'Editar Nómina' : 'Nueva Nómina'}
                        </h2>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                        <FormSection title="Trabajador y Período">
                            <Select
                                label="Trabajador *"
                                value={formData.workerId}
                                onChange={(v) => setFormData({ ...formData, workerId: v })}
                                options={workers.map(w => ({
                                    value: String(w.id),
                                    label: `${w.nombre} ${w.apellidos || ''}`.trim()
                                }))}
                                placeholder="Seleccionar trabajador..."
                                fullWidth
                                required
                            />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-md)' }}>
                                <Select
                                    label="Mes *"
                                    value={String(formData.mes)}
                                    onChange={(v) => setFormData({ ...formData, mes: Number(v) })}
                                    options={monthOptions}
                                    fullWidth
                                    required
                                />
                                <Select
                                    label="Año *"
                                    value={String(formData.anio)}
                                    onChange={(v) => setFormData({ ...formData, anio: Number(v) })}
                                    options={yearOptions}
                                    fullWidth
                                    required
                                />
                            </div>
                        </FormSection>

                        <FormSection title="Importes">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                                <Input
                                    label="Salario Bruto (€) *"
                                    type="number"
                                    step="0.01"
                                    value={formData.salarioBruto}
                                    onChange={(e) => handleBrutoChange(parseFloat(e.target.value) || 0)}
                                    fullWidth
                                    required
                                />
                                <Input
                                    label="SS Empresa (~30%)"
                                    type="number"
                                    step="0.01"
                                    value={formData.seguridadSocialEmpresa}
                                    onChange={(e) => setFormData({ ...formData, seguridadSocialEmpresa: parseFloat(e.target.value) || 0 })}
                                    fullWidth
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-md)' }}>
                                <Input
                                    label="SS Trabajador"
                                    type="number"
                                    step="0.01"
                                    value={formData.seguridadSocialTrabajador}
                                    onChange={(e) => setFormData({ ...formData, seguridadSocialTrabajador: parseFloat(e.target.value) || 0 })}
                                    fullWidth
                                />
                                <Input
                                    label="IRPF"
                                    type="number"
                                    step="0.01"
                                    value={formData.irpf}
                                    onChange={(e) => setFormData({ ...formData, irpf: parseFloat(e.target.value) || 0 })}
                                    fullWidth
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-md)' }}>
                                <Input
                                    label="Complementos (propinas, bonus)"
                                    type="number"
                                    step="0.01"
                                    value={formData.complementos}
                                    onChange={(e) => setFormData({ ...formData, complementos: parseFloat(e.target.value) || 0 })}
                                    fullWidth
                                />
                                <Input
                                    label="Deducciones (anticipos)"
                                    type="number"
                                    step="0.01"
                                    value={formData.deducciones}
                                    onChange={(e) => setFormData({ ...formData, deducciones: parseFloat(e.target.value) || 0 })}
                                    fullWidth
                                />
                            </div>
                        </FormSection>

                        <FormSection title="Horas">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--spacing-md)' }}>
                                <Input
                                    label="Horas Normales"
                                    type="number"
                                    value={formData.horasNormales}
                                    onChange={(e) => setFormData({ ...formData, horasNormales: parseFloat(e.target.value) || 0 })}
                                    fullWidth
                                />
                                <Input
                                    label="Horas Extras"
                                    type="number"
                                    value={formData.horasExtras}
                                    onChange={(e) => setFormData({ ...formData, horasExtras: parseFloat(e.target.value) || 0 })}
                                    fullWidth
                                />
                                <Input
                                    label="Importe H. Extras (€)"
                                    type="number"
                                    step="0.01"
                                    value={formData.importeHorasExtras}
                                    onChange={(e) => setFormData({ ...formData, importeHorasExtras: parseFloat(e.target.value) || 0 })}
                                    fullWidth
                                />
                            </div>
                        </FormSection>

                        <FormSection title="Estado">
                            <Select
                                label="Estado de la Nómina"
                                value={formData.status}
                                onChange={(v) => setFormData({ ...formData, status: v as NominaStatus })}
                                options={STATUS_OPTIONS}
                                fullWidth
                            />
                        </FormSection>

                        {/* Net Salary Preview */}
                        <Card style={{ backgroundColor: 'var(--bg-card-hover)', border: '2px solid var(--accent)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>Salario Neto (calculado):</span>
                                <span style={{ fontSize: 'var(--font-size-xl)', fontWeight: '700', color: 'var(--accent)' }}>
                                    {formatCurrency(calcularSalarioNeto())}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--spacing-sm)' }}>
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Coste Empresa Total:</span>
                                <span style={{ fontWeight: '600' }}>
                                    {formatCurrency(formData.salarioBruto + formData.seguridadSocialEmpresa)}
                                </span>
                            </div>
                        </Card>

                        <FormSection title="Notas">
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
                                <Save size={16} /> {editingNomina ? 'Actualizar' : 'Guardar Nómina'}
                            </Button>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
};
