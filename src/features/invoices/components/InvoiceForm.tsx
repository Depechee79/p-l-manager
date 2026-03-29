import React, { useState, useEffect } from 'react';
import { Button, Input, Select, DatePicker } from '@components';
import { formatDateOnly } from '@shared/utils/dateUtils';
import { InvoiceProductList } from './InvoiceProductList';
import type { InvoiceFormData, Invoice, InvoiceProduct } from '../invoices.types';
import type { Provider } from '@types';

interface InvoiceFormProps {
    initialData?: Invoice | null;
    providers: Provider[];
    onSave: (data: InvoiceFormData) => void;
    onCancel: () => void;
}

const DEFAULT_FORM_DATA: InvoiceFormData = {
    tipo: 'factura',
    numeroFactura: '',
    proveedorId: null,
    fecha: formatDateOnly(new Date()),
    total: 0,
    productos: [],
    metodoPago: '',
    notas: ''
};

export const InvoiceForm: React.FC<InvoiceFormProps> = ({ initialData, providers, onSave, onCancel }) => {
    const [isCheckingMode, setIsCheckingMode] = useState(false);
    const [formData, setFormData] = useState<InvoiceFormData>(DEFAULT_FORM_DATA);

    useEffect(() => {
        if (initialData) {
            setFormData({
                tipo: initialData.tipo || 'factura',
                numeroFactura: initialData.numero,
                proveedorId: initialData.proveedorId,
                fecha: initialData.fecha,
                total: initialData.total,
                productos: initialData.productos || [],
                metodoPago: initialData.metodoPago || '',
                notas: initialData.notas || ''
            });
        }
    }, [initialData]);

    const handleProductsChange = (newProducts: InvoiceProduct[]) => {
        setFormData(prev => ({ ...prev, productos: newProducts }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div style={{ backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: 'var(--spacing-xl)', boxShadow: 'var(--shadow)' }}>
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: 'var(--text-main)' }}>
                    {initialData ? 'Editar Factura' : 'Nueva Factura'}
                </h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                        variant={isCheckingMode ? 'warning' : 'secondary'}
                        onClick={() => setIsCheckingMode(!isCheckingMode)}
                        title="Activar modo de validación de mercancía"
                    >
                        {isCheckingMode ? 'Desactivar Punteo' : '🛡️ Validar Mercancía'}
                    </Button>
                    <Button variant="secondary" onClick={onCancel}>
                        Cancelar
                    </Button>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)', maxWidth: '900px' }}>

                    {/* ... existing fields ... */}
                    {/* Simplified for diff: Keeping lines 76-121 essentially same, just ensuring context */}

                    {/* Cabecera */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                        <Select
                            label="Tipo"
                            value={formData.tipo}
                            onChange={(value) => setFormData({ ...formData, tipo: value as 'factura' | 'albaran' })}
                            required
                            options={[
                                { value: 'factura', label: 'Factura' },
                                { value: 'albaran', label: 'Albarán' },
                            ]}
                            fullWidth
                        />

                        <Input
                            label="Número Factura / Albarán"
                            type="text"
                            value={formData.numeroFactura}
                            onChange={(e) => setFormData({ ...formData, numeroFactura: e.target.value })}
                            placeholder="Ej: F-2024-001"
                            required
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 2fr) 1fr', gap: 'var(--spacing-md)' }}>
                        <Select
                            label="Proveedor"
                            value={formData.proveedorId?.toString() || ''}
                            onChange={(value) => setFormData({ ...formData, proveedorId: parseInt(value) })}
                            required
                            options={providers.map(p => ({
                                value: p.id.toString(),
                                label: p.nombre
                            }))}
                            placeholder="Seleccionar proveedor..."
                            fullWidth
                        />

                        <DatePicker
                            label="Fecha"
                            value={formData.fecha}
                            onChange={(value) => setFormData({ ...formData, fecha: value })}
                            required
                            fullWidth
                        />
                    </div>

                    {/* Lista de Productos */}
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 'var(--spacing-md)' }}>
                        <InvoiceProductList
                            products={formData.productos}
                            onChange={handleProductsChange}
                            isCheckingMode={isCheckingMode}
                        />
                    </div>

                    {/* Totales y Notas */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--spacing-xl)', alignItems: 'start' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                            <Input
                                label="Método de Pago"
                                type="text"
                                value={formData.metodoPago}
                                onChange={(e) => setFormData({ ...formData, metodoPago: e.target.value })}
                                placeholder="Transferencia, Efectivo, Tarjeta..."
                            />

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label htmlFor="notas" style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-main)' }}>
                                    Notas
                                </label>
                                <textarea
                                    id="notas"
                                    value={formData.notas}
                                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                                    placeholder="Observaciones adicionales..."
                                    rows={3}
                                    style={{
                                        padding: 'var(--spacing-sm) var(--spacing-md)',
                                        border: '1px solid var(--border)',
                                        borderRadius: 'var(--radius)',
                                        fontSize: 'var(--font-size-sm)',
                                        fontFamily: 'inherit',
                                        resize: 'vertical',
                                        width: '100%'
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{ backgroundColor: 'var(--surface-muted)', padding: '16px', borderRadius: 'var(--radius)' }}>
                            <Input
                                label="Total Factura (€)"
                                type="number"
                                step="0.01"
                                value={formData.total}
                                onChange={(e) => setFormData({ ...formData, total: parseFloat(e.target.value) || 0 })}
                                required
                                style={{ fontSize: '18px', fontWeight: 'bold', textAlign: 'right' }}
                            />
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px', textAlign: 'right' }}>
                                * El total puede diferir de la suma de productos si hay impuestos o cargos extra no desglosados.
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end', marginTop: 'var(--spacing-xl)', borderTop: '1px solid var(--border)', paddingTop: 'var(--spacing-md)' }}>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onCancel}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" variant="primary">
                            Guardar Factura
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
};
