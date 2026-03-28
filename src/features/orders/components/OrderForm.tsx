import React, { useState, useEffect } from 'react';
import { Button, Select, Card, DatePicker, FormSection } from '@components';
import { Save, X } from 'lucide-react';
import type { OrderFormData, Order, OrderProduct, OrderStatus } from '../orders.types';
import type { Product, Provider } from '@types';
import { StockSuggestions } from './StockSuggestions';
import { OrderProductList } from './OrderProductList';

interface OrderFormProps {
    initialData?: Order | null;
    providers: Provider[];
    products: Product[];
    onSave: (data: OrderFormData) => void;
    onCancel: () => void;
}

const DEFAULT_FORM_DATA: OrderFormData = {
    fecha: new Date().toISOString().split('T')[0],
    proveedorId: '',
    productos: [],
    estado: 'borrador',
    notas: ''
};

export const OrderForm: React.FC<OrderFormProps> = ({ initialData, providers, products, onSave, onCancel }) => {
    const [formData, setFormData] = useState<OrderFormData>(DEFAULT_FORM_DATA);

    useEffect(() => {
        if (initialData) {
            setFormData({
                fecha: initialData.fecha,
                fechaEntrega: initialData.fechaEntrega,
                proveedorId: String(initialData.proveedorId),
                productos: initialData.productos.map(p => ({
                    productoId: String(p.productoId),
                    cantidad: p.cantidad,
                    unidad: p.unidad,
                    precioUnitario: p.precioUnitario
                })),
                estado: initialData.estado,
                notas: initialData.notas || ''
            });
        } else {
            setFormData(DEFAULT_FORM_DATA);
        }
    }, [initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.proveedorId || formData.productos.length === 0) return;
        onSave(formData);
    };

    const handleAddStockSuggestions = (newProducts: OrderProduct[]) => {
        setFormData(prev => ({
            ...prev,
            productos: [...prev.productos, ...newProducts.map(p => ({
                productoId: String(p.productoId),
                cantidad: p.cantidad,
                unidad: p.unidad,
                precioUnitario: p.precioUnitario
            }))]
        }));
    };

    return (
        <Card>
            <div style={{ marginBottom: 'var(--spacing-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--text-main)' }}>
                    {initialData ? 'Editar Pedido' : 'Nuevo Pedido'}
                </h2>
                <Button variant="secondary" onClick={onCancel}>
                    <X size={16} /> Cancelar
                </Button>
            </div>

            <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gap: 'var(--spacing-lg)' }}>
                    <FormSection title="Información General">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)' }}>
                            <DatePicker
                                label="Fecha *"
                                value={formData.fecha}
                                onChange={(value) => setFormData({ ...formData, fecha: value })}
                                required
                                fullWidth
                            />
                            <DatePicker
                                label="Fecha Entrega Esperada"
                                value={formData.fechaEntrega || ''}
                                onChange={(value) => setFormData({ ...formData, fechaEntrega: value })}
                                fullWidth
                            />
                            <Select
                                label="Proveedor *"
                                value={formData.proveedorId}
                                onChange={(value) => setFormData({ ...formData, proveedorId: value })}
                                options={providers.map(p => ({
                                    value: String(p.id),
                                    label: p.nombre,
                                }))}
                                placeholder="Seleccionar proveedor..."
                                fullWidth
                                required
                            />
                        </div>
                    </FormSection>

                    <FormSection title="Productos">
                        <StockSuggestions
                            products={products}
                            onAddProducts={handleAddStockSuggestions}
                        />

                        <OrderProductList
                            products={formData.productos.map(p => {
                                const productDef = products.find(prod => String(prod.id) === String(p.productoId));
                                return {
                                    ...p,
                                    nombre: productDef ? productDef.nombre : '',
                                    subtotal: p.cantidad * p.precioUnitario
                                };
                            })}
                            availableProducts={products}
                            onChange={(updatedProducts) => setFormData(prev => ({
                                ...prev,
                                productos: updatedProducts.map(p => ({
                                    productoId: String(p.productoId),
                                    cantidad: p.cantidad,
                                    unidad: p.unidad,
                                    precioUnitario: p.precioUnitario
                                }))
                            }))}
                        />

                    </FormSection>

                    <FormSection title="Estado y Notas">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)' }}>
                            <Select
                                label="Estado"
                                value={formData.estado}
                                onChange={(value) => setFormData({ ...formData, estado: value as OrderStatus })}
                                options={[
                                    { value: 'borrador', label: 'Borrador' },
                                    { value: 'enviado', label: 'Enviado' },
                                    { value: 'recibido', label: 'Recibido' },
                                    { value: 'cancelado', label: 'Cancelado' },
                                ]}
                                fullWidth
                            />
                        </div>
                        <div style={{ marginTop: 'var(--spacing-md)' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--text-main)' }}>Notas</label>
                            <textarea
                                value={formData.notas}
                                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                                style={{
                                    width: '100%',
                                    minHeight: '80px',
                                    padding: 'var(--spacing-sm) var(--spacing-md)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius)',
                                    resize: 'vertical',
                                    fontFamily: 'inherit',
                                    fontSize: 'var(--font-size-sm)'
                                }}
                                placeholder="Notas adicionales sobre el pedido..."
                            />
                        </div>
                    </FormSection>

                    <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end', marginTop: 'var(--spacing-lg)' }}>
                        <Button variant="secondary" onClick={onCancel}>
                            Cancelar
                        </Button>
                        <Button type="submit" variant="primary">
                            <Save size={16} /> Guardar
                        </Button>
                    </div>
                </div>
            </form>
        </Card>
    );
};
