import React, { useMemo } from 'react';
import { Button, Card } from '@components';
import { Package } from 'lucide-react';
import type { Product } from '@types';
import type { OrderProduct } from '../orders.types';

interface StockSuggestionsProps {
    products: Product[];
    onAddProducts: (products: OrderProduct[]) => void;
}

export const StockSuggestions: React.FC<StockSuggestionsProps> = ({ products, onAddProducts }) => {
    const lowStockProducts = useMemo(() => {
        return products.filter(p => {
            const stock = p.stockActualUnidades || 0;
            const minimo = p.stockMinimoUnidades || 0;
            return stock < minimo && minimo > 0;
        });
    }, [products]);

    const handleAddAll = () => {
        const newProducts: OrderProduct[] = lowStockProducts.map(p => ({
            productoId: String(p.id),
            nombre: p.nombre,
            cantidad: (p.stockMinimoUnidades || 0) - (p.stockActualUnidades || 0),
            unidad: p.unidadBase || 'ud',
            precioUnitario: p.precioCompra || 0,
            subtotal: ((p.stockMinimoUnidades || 0) - (p.stockActualUnidades || 0)) * (p.precioCompra || 0)
        })).filter(p => p.cantidad > 0);

        onAddProducts(newProducts);
    };

    if (lowStockProducts.length === 0) return null;

    return (
        <Card style={{
            backgroundColor: 'var(--warning-lighter)',
            border: '1px solid var(--warning-light)',
            marginBottom: 'var(--spacing-md)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                    <div style={{
                        backgroundColor: 'var(--white)',
                        padding: 'var(--spacing-sm)',
                        borderRadius: '50%',
                        color: 'var(--warning-dark)'
                    }}>
                        <Package size={20} />
                    </div>
                    <div>
                        <div style={{ fontWeight: '600', color: 'var(--text-main)', marginBottom: 'var(--spacing-xs)' }}>
                            {lowStockProducts.length} productos con stock bajo
                        </div>
                        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                            Se sugiere reponer inventario automáticamente.
                        </div>
                    </div>
                </div>
                <Button variant="secondary" onClick={handleAddAll} size="sm" style={{ borderColor: 'var(--warning)' }}>
                    Añadir sugerencias
                </Button>
            </div>
        </Card>
    );
};
