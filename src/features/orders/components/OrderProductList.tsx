import React from 'react';
import { Button, Input, Select } from '@components';
import { Trash2, Plus, Share } from 'lucide-react';
import type { OrderProduct } from '../orders.types';
import type { Product } from '@types';
import { formatCurrency } from '@utils';

interface OrderProductListProps {
    products: OrderProduct[];
    availableProducts: Product[];
    onChange: (products: OrderProduct[]) => void;
}

export const OrderProductList: React.FC<OrderProductListProps> = ({ products, availableProducts, onChange }) => {
    const handleAddProduct = () => {
        onChange([
            ...products,
            {
                productoId: '',
                nombre: '',
                cantidad: 0,
                unidad: 'ud',
                precioUnitario: 0,
                subtotal: 0
            }
        ]);
    };

    const handleRemoveProduct = (index: number) => {
        const newProducts = [...products];
        newProducts.splice(index, 1);
        onChange(newProducts);
    };

    const handleUpdateProduct = (index: number, field: keyof OrderProduct, value: any) => {
        if (index < 0 || index >= products.length) return;

        const newProducts = [...products];
        const product = { ...newProducts[index] };

        if (field === 'productoId') {
            const p = availableProducts.find(ap => String(ap.id) === String(value));
            product.productoId = String(value);
            if (p) {
                product.nombre = p.nombre;
                product.precioUnitario = p.precioCompra || 0;
                product.unidad = p.unidadBase || 'ud';
            }
        } else {
            (product as any)[field] = value;
        }

        // Auto-calculate subtotal
        product.subtotal = (Number(product.cantidad) || 0) * (Number(product.precioUnitario) || 0);

        newProducts[index] = product;
        onChange(newProducts);
    };

    const totalAmount = products.reduce((sum, p) => sum + (p.subtotal || 0), 0);

    const handleShareOrder = () => {
        const productList = products
            .filter(p => p.productoId && p.cantidad > 0)
            .map(p => `- ${p.nombre || 'Producto'}: ${p.cantidad} ${p.unidad}`)
            .join('\n');

        const text = `📦 *Nuevo Pedido*\n\nProductos:\n${productList}\n\nTotal estimado: ${formatCurrency(totalAmount)}\n\n_Sent from P&L Manager_`;
        const encodedText = encodeURIComponent(text);
        window.open(`https://wa.me/?text=${encodedText}`, '_blank');
    };

    return (
        <div style={{ marginTop: 'var(--spacing-md)' }}>
            <div style={{ marginBottom: '16px' }}>
                {products.length === 0 ? (
                    <div style={{ padding: 'var(--spacing-md)', backgroundColor: 'var(--surface-muted)', borderRadius: 'var(--radius)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        No hay productos en el pedido.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                        {products.map((prod, index) => (
                            <div key={`prod-${index}-${prod.productoId}`} style={{
                                display: 'grid',
                                gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
                                gap: 'var(--spacing-sm)',
                                alignItems: 'end',
                                padding: 'var(--spacing-sm)',
                                backgroundColor: 'var(--surface)',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius)'
                            }}>
                                <Select
                                    label={index === 0 ? 'Producto' : ''}
                                    value={String(prod.productoId)}
                                    onChange={(value) => handleUpdateProduct(index, 'productoId', value)}
                                    options={availableProducts.map(p => ({
                                        value: String(p.id),
                                        label: p.nombre,
                                    }))}
                                    placeholder="Seleccionar..."
                                    fullWidth
                                />
                                <Input
                                    label={index === 0 ? 'Cantidad' : ''}
                                    type="number"
                                    step="0.01"
                                    value={prod.cantidad}
                                    onChange={(e) => handleUpdateProduct(index, 'cantidad', parseFloat(e.target.value) || 0)}
                                    fullWidth
                                />
                                <Input
                                    label={index === 0 ? 'Unidad' : ''}
                                    value={prod.unidad}
                                    onChange={(e) => handleUpdateProduct(index, 'unidad', e.target.value)}
                                    fullWidth
                                />
                                <Input
                                    label={index === 0 ? 'Precio' : ''}
                                    type="number"
                                    step="0.01"
                                    value={prod.precioUnitario}
                                    onChange={(e) => handleUpdateProduct(index, 'precioUnitario', parseFloat(e.target.value) || 0)}
                                    fullWidth
                                />
                                <div style={{ paddingBottom: 'var(--spacing-sm)' }}>
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={() => handleRemoveProduct(index)}
                                    >
                                        <Trash2 size={14} />
                                    </Button>
                                </div>
                            </div>
                        ))}
                        <div style={{
                            marginTop: 'var(--spacing-md)',
                            paddingTop: 'var(--spacing-md)',
                            borderTop: '1px solid var(--border)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 'var(--spacing-md)'
                        }}>
                            <Button variant="secondary" size="sm" onClick={handleShareOrder} disabled={products.length === 0}>
                                <Share size={14} style={{ marginRight: '4px' }} /> Compartir Pedido
                            </Button>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                                <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>Total Estimado:</span>
                                <span style={{ fontSize: 'var(--font-size-xl)', fontWeight: '700', color: 'var(--text-main)' }}>
                                    {formatCurrency(totalAmount)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <Button variant="secondary" onClick={handleAddProduct} fullWidth>
                <Plus size={16} /> Añadir Producto
            </Button>
        </div>
    );
};
