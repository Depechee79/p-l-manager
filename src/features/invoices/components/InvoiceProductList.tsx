import React from 'react';
import { Button, Input } from '@components';
import { Trash2, Plus } from 'lucide-react';
import { CheckCircle2, AlertCircle, MessageSquare } from 'lucide-react';

export interface InvoiceProduct {
    nombre: string;
    cantidad: number;
    unidad: string;
    precioUnitario: number;
    subtotal: number;
    confianza?: number;
    productoId?: number | string;
    // Traceability & Validation
    recibido?: boolean;
    faltas?: number;
    roturas?: number;
    comentarios?: string;
}

interface InvoiceProductListProps {
    products: InvoiceProduct[];
    onChange: (products: InvoiceProduct[]) => void;
    isCheckingMode?: boolean;
}

export const InvoiceProductList: React.FC<InvoiceProductListProps> = ({ products, onChange, isCheckingMode = false }) => {
    const handleAddProduct = () => {
        onChange([
            ...products,
            {
                nombre: '',
                cantidad: 1,
                unidad: 'ud',
                precioUnitario: 0,
                subtotal: 0,
                recibido: true,
                faltas: 0,
                roturas: 0,
                comentarios: ''
            }
        ]);
    };

    const handleRemoveProduct = (index: number) => {
        const newProducts = [...products];
        newProducts.splice(index, 1);
        onChange(newProducts);
    };

    const handleUpdateProduct = (index: number, field: keyof InvoiceProduct, value: any) => {
        const newProducts = [...products];
        const product = { ...newProducts[index], [field]: value };

        // Automatizar cálculo de subtotal
        if (field === 'cantidad' || field === 'precioUnitario') {
            product.subtotal = product.cantidad * product.precioUnitario;
        }

        newProducts[index] = product;
        onChange(newProducts);
    };

    const totalAmount = products.reduce((sum, p) => sum + (p.subtotal || 0), 0);

    return (
        <div style={{ marginBottom: 'var(--spacing-2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-sm)' }}>
                <label style={{ fontSize: 'var(--font-size-base)', fontWeight: '500' }}>Productos / Conceptos</label>
                <Button type="button" size="sm" variant="secondary" onClick={handleAddProduct} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                    <Plus size={14} /> Añadir Línea
                </Button>
            </div>

            {products.length === 0 ? (
                <div style={{ padding: 'var(--spacing-md)', backgroundColor: 'var(--surface-muted)', borderRadius: 'var(--radius)', textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
                    No hay productos añadidos. Añade productos para actualizar el inventario automáticamente.
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {products.map((prod, index) => (
                        <div key={index} style={{
                            backgroundColor: 'var(--surface)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius)',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'minmax(150px, 2fr) minmax(80px, 1fr) minmax(80px, 1fr) minmax(80px, 1fr) auto',
                                gap: 'var(--spacing-1)',
                                alignItems: 'end',
                                padding: 'var(--spacing-sm)',
                            }}>
                                <Input
                                    label={index === 0 ? 'Producto' : ''}
                                    type="text"
                                    placeholder="Nombre del producto"
                                    value={prod.nombre}
                                    onChange={(e) => handleUpdateProduct(index, 'nombre', e.target.value)}
                                />
                                <Input
                                    label={index === 0 ? 'Cant.' : ''}
                                    type="number"
                                    step="0.01"
                                    value={prod.cantidad}
                                    onChange={(e) => handleUpdateProduct(index, 'cantidad', parseFloat(e.target.value) || 0)}
                                />
                                <Input
                                    label={index === 0 ? 'Precio' : ''}
                                    type="number"
                                    step="0.01"
                                    value={prod.precioUnitario}
                                    onChange={(e) => handleUpdateProduct(index, 'precioUnitario', parseFloat(e.target.value) || 0)}
                                />
                                <div style={{ paddingBottom: 'var(--spacing-1)' }}>
                                    {index === 0 && <div style={{ marginBottom: 'var(--spacing-1)', fontSize: 'var(--font-size-base)', fontWeight: '500', color: 'var(--text-secondary)' }}>Subtotal</div>}
                                    <div style={{ padding: 'var(--spacing-1)', textAlign: 'right', fontWeight: '600', color: 'var(--text-main)' }}>
                                        {(prod.cantidad * prod.precioUnitario).toFixed(2)} €
                                    </div>
                                </div>
                                <div style={{ paddingBottom: 'var(--spacing-sm)' }}>
                                    <Button type="button" variant="danger" size="sm" onClick={() => handleRemoveProduct(index)} title="Eliminar línea">
                                        <Trash2 size={16} />
                                    </Button>
                                </div>
                            </div>

                            {/* Traceability Row - Only in Checking Mode */}
                            {isCheckingMode && (
                                <div style={{
                                    padding: 'var(--spacing-xs) var(--spacing-sm)',
                                    borderTop: '1px dotted var(--border)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--spacing-lg)',
                                    flexWrap: 'wrap',
                                    backgroundColor: 'var(--warning-light)',
                                    borderLeft: '4px solid var(--warning)'
                                }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', cursor: 'pointer', fontSize: 'var(--font-size-sm)', fontWeight: '500' }}>
                                        <input
                                            type="checkbox"
                                            checked={prod.recibido ?? true}
                                            onChange={(e) => handleUpdateProduct(index, 'recibido', e.target.checked)}
                                        />
                                        <CheckCircle2 size={14} style={{ color: prod.recibido ? 'var(--success)' : 'var(--text-muted)' }} />
                                        Recibido
                                    </label>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <AlertCircle size={14} style={{ color: 'var(--warning)' }} />
                                        <Input
                                            type="number"
                                            label="Faltas"
                                            value={Number(prod.faltas) || 0}
                                            onChange={(e) => handleUpdateProduct(index, 'faltas', parseFloat(e.target.value) || 0)}
                                            style={{ width: '60px' }}
                                        />
                                        <Input
                                            type="number"
                                            label="Roturas"
                                            value={Number(prod.roturas) || 0}
                                            onChange={(e) => handleUpdateProduct(index, 'roturas', parseFloat(e.target.value) || 0)}
                                            style={{ width: '60px' }}
                                        />
                                    </div>

                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <MessageSquare size={14} style={{ color: 'var(--text-muted)' }} />
                                        <Input
                                            placeholder="Comentarios de entrega..."
                                            value={prod.comentarios || ''}
                                            onChange={(e) => handleUpdateProduct(index, 'comentarios', e.target.value)}
                                            fullWidth
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    <div style={{
                        textAlign: 'right',
                        fontSize: 'var(--font-size-md)',
                        fontWeight: '600',
                        marginTop: 'var(--spacing-1)',
                        paddingTop: 'var(--spacing-1)',
                        borderTop: '1px solid var(--border)'
                    }}>
                        Total Productos: {totalAmount.toFixed(2)} €
                    </div>
                </div>
            )}
        </div>
    );
};
