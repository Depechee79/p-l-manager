import React, { useState, useMemo } from 'react';
import { Search, Plus, X, Save, Trash2, ArrowLeft, ArrowRight, QrCode } from 'lucide-react';
import { Card, Input, Select, Button, FormSection } from '@/shared/components';
import { useDatabase } from '@core';
import { InventoryFormData, ProductCount, CountingMethod, ZONES } from '../../../inventory.types';
import { NumericKeypad } from '@/shared/components';
import type { Product } from '@types';
import { useToast } from '@/utils/toast';
import { ProductScanner } from '../../ProductScanner';

interface CountingStepProps {
    formData: InventoryFormData;
    setFormData: (data: InventoryFormData) => void;
    onNext: () => void;
    onBack: () => void;
}

export const CountingStep: React.FC<CountingStepProps> = ({
    formData,
    setFormData,
    onNext,
    onBack
}) => {
    const { db } = useDatabase();
    const { showToast } = useToast();

    const [productSearchQuery, setProductSearchQuery] = useState('');
    const [familyFilter, setFamilyFilter] = useState('');
    const [subfamilyFilter, setSubfamilyFilter] = useState('');
    const [isScannerVisible, setIsScannerVisible] = useState(false);

    const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
    const [currentCount, setCurrentCount] = useState<{
        cantidad: number;
        metodo: CountingMethod;
        unidadesPorPack?: number
    }>({
        cantidad: 0,
        metodo: 'total',
    });

    // Filter products
    const availableProducts = useMemo(() => {
        if (!db.productos) return [];
        let products = db.productos as Product[];

        if (productSearchQuery.trim()) {
            const query = productSearchQuery.toLowerCase().trim();
            products = products.filter(p =>
                p.nombre?.toLowerCase().includes(query) ||
                p.categoria?.toLowerCase().includes(query) ||
                p.familia?.toLowerCase().includes(query) ||
                p.subfamilia?.toLowerCase().includes(query)
            );
        }

        if (familyFilter) {
            products = products.filter(p => p.familia === familyFilter);
        }

        if (subfamilyFilter) {
            products = products.filter(p => p.subfamilia === subfamilyFilter);
        }

        return products;
    }, [db.productos, productSearchQuery, familyFilter, subfamilyFilter]);

    // Unique families/subfamilies
    const families = useMemo(() => {
        const products = db.productos as Product[] || [];
        return Array.from(new Set(products.map(p => p.familia).filter(Boolean)));
    }, [db.productos]);

    /* const subfamilies = useMemo(() => {
        const products = db.productos as Product[] || [];
        if (!familyFilter) return [];
        return Array.from(new Set(products.filter(p => p.familia === familyFilter).map(p => p.subfamilia).filter(Boolean)));
    }, [db.productos, familyFilter]); */

    const handleSelectProduct = (product: Product) => {
        setCurrentProduct(product);
        setCurrentCount({
            cantidad: 0,
            metodo: 'total',
            unidadesPorPack: product.unidadesPorPack || 1,
        });
        setProductSearchQuery('');
    };

    const handleSaveCount = () => {
        if (!currentProduct) return;

        const existingIndex = formData.productos.findIndex(
            p => p.productoId === currentProduct.id && p.zona === formData.zona
        );

        const countData: ProductCount = {
            productoId: currentProduct.id,
            nombre: currentProduct.nombre || '',
            zona: formData.zona,
            metodo: currentCount.metodo,
            cantidadTotal: currentCount.metodo === 'total' ? currentCount.cantidad : undefined,
            cantidadPack: currentCount.metodo === 'pack' ? currentCount.cantidad : undefined,
            unidadesPorPack: currentCount.metodo === 'pack' ? currentCount.unidadesPorPack : undefined,
        };

        if (existingIndex >= 0) {
            const newProductos = [...formData.productos];
            newProductos[existingIndex] = countData;
            setFormData({ ...formData, productos: newProductos });
            showToast({
                type: 'success',
                title: 'Conteo actualizado',
                message: `Conteo de ${currentProduct.nombre} actualizado`,
            });
        } else {
            setFormData({
                ...formData,
                productos: [...formData.productos, countData],
            });
            showToast({
                type: 'success',
                title: 'Producto contado',
                message: `${currentProduct.nombre} añadido al inventario`,
            });
        }

        setCurrentProduct(null);
        setCurrentCount({ cantidad: 0, metodo: 'total' });
    };

    const removeProductCount = (productoId: string | number, zona: string) => {
        setFormData({
            ...formData,
            productos: formData.productos.filter(p => !(p.productoId === productoId && p.zona === zona))
        });
    };

    const productsByZone = useMemo(() => {
        const grouped: Record<string, ProductCount[]> = {};
        formData.productos.forEach(p => {
            if (!grouped[p.zona]) grouped[p.zona] = [];
            grouped[p.zona].push(p);
        });
        return grouped;
    }, [formData.productos]);

    const handleScan = (decodedText: string) => {
        const products = db.productos as Product[] || [];
        // Search by ID or assume it's a barcode (TODO: Add barcode field to Product type)
        // For now, search by exact name match or ID if numeric
        const product = products.find(p =>
            String(p.id) === decodedText ||
            p.nombre?.toLowerCase() === decodedText.toLowerCase()
        );

        if (product) {
            handleSelectProduct(product);
            setIsScannerVisible(false);
            showToast({
                type: 'success',
                title: 'Producto encontrado',
                message: product.nombre,
            });
        } else {
            showToast({
                type: 'warning',
                title: 'No encontrado',
                message: `No se encontró producto con código: ${decodedText}`,
            });
        }
    };

    return (
        <FormSection
            title="Conteo de Productos"
            description={`Zona actual: ${ZONES.find(z => z.value === formData.zona)?.label}`}
        >
            <ProductScanner
                isVisible={isScannerVisible}
                onScan={handleScan}
                onClose={() => setIsScannerVisible(false)}
            />

            {/* Search and Filters */}
            <Card style={{ marginBottom: 'var(--spacing-lg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                    <h4 style={{ margin: 0, fontSize: 'var(--font-size-base)', fontWeight: '600' }}>
                        Buscar Producto
                    </h4>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setIsScannerVisible(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                        <QrCode size={16} /> Escanear
                    </Button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                    <Input
                        type="text"
                        placeholder="Buscar..."
                        value={productSearchQuery}
                        onChange={(e) => setProductSearchQuery(e.target.value)}
                        fullWidth
                        icon={<Search size={18} />}
                        iconPosition="left"
                    />
                    <Select
                        value={familyFilter}
                        onChange={(val) => {
                            setFamilyFilter(val);
                            setSubfamilyFilter('');
                        }}
                        fullWidth
                        options={[
                            { value: '', label: 'Families' },
                            ...families.map(f => ({ value: f!, label: f! })),
                        ]}
                    />
                </div>

                {availableProducts.length > 0 && productSearchQuery && (
                    <div style={{
                        maxHeight: '200px',
                        overflowY: 'auto',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                    }}>
                        {availableProducts.slice(0, 10).map(product => (
                            <div
                                key={product.id}
                                onClick={() => handleSelectProduct(product)}
                                style={{
                                    padding: 'var(--spacing-sm) var(--spacing-md)',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid var(--border)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <div>
                                    <div style={{ fontWeight: '500' }}>{product.nombre}</div>
                                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                                        {product.familia}
                                    </div>
                                </div>
                                <Button size="sm" variant="secondary"><Plus size={14} /></Button>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Entry Panel */}
            {currentProduct && (
                <Card style={{ marginBottom: 'var(--spacing-lg)', border: '2px solid var(--accent)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-md)' }}>
                        <h4 style={{ margin: 0 }}>{currentProduct.nombre}</h4>
                        <Button variant="secondary" size="sm" onClick={() => setCurrentProduct(null)}><X size={14} /></Button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)' }}>
                        <div>
                            <label className="input-label">Método</label>
                            <select
                                value={currentCount.metodo}
                                onChange={(e) => setCurrentCount({ ...currentCount, metodo: e.target.value as CountingMethod, cantidad: 0 })}
                                style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}
                            >
                                <option value="total">Unidades Totales</option>
                                <option value="pack">Por Pack ({currentProduct.unidadesPorPack || 1} uds)</option>
                            </select>
                        </div>

                        <div style={{ gridColumn: '1 / -1' }}>
                            <Input
                                label={currentCount.metodo === 'total' ? "Cantidad Unidades" : "Cantidad Packs"}
                                type="number"
                                value={currentCount.cantidad}
                                onChange={(e) => setCurrentCount({ ...currentCount, cantidad: parseFloat(e.target.value) || 0 })}
                                fullWidth
                                style={{ fontSize: 'var(--font-size-2xl)', textAlign: 'center', fontWeight: '700', minHeight: '60px' }}
                            />
                            <NumericKeypad
                                value={currentCount.cantidad}
                                onChange={(val) => setCurrentCount({ ...currentCount, cantidad: val })}
                            />
                        </div>
                    </div>

                    <div style={{ marginTop: 'var(--spacing-md)', display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)' }}>
                        <Button variant="secondary" onClick={() => setCurrentProduct(null)}>Cancelar</Button>
                        <Button variant="primary" onClick={handleSaveCount}><Save size={16} /> Guardar</Button>
                    </div>
                </Card>
            )}

            {/* List of counted products */}
            {formData.productos.length > 0 && (
                <Card>
                    <h4 style={{ marginBottom: 'var(--spacing-md)' }}>Productos Contados ({formData.productos.length})</h4>
                    {Object.entries(productsByZone).map(([zone, products]) => (
                        <div key={zone} style={{ marginBottom: 'var(--spacing-md)' }}>
                            <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                                {ZONES.find(z => z.value === zone)?.label}
                            </div>
                            {products.map((p, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--spacing-xs)', borderBottom: '1px solid var(--border)' }}>
                                    <span>{p.nombre}</span>
                                    <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
                                        <span style={{ fontWeight: '600' }}>
                                            {p.metodo === 'total' ? `${p.cantidadTotal} uds` : `${p.cantidadPack} pk × ${p.unidadesPorPack}`}
                                        </span>
                                        <Button variant="danger" size="sm" onClick={() => removeProductCount(p.productoId, p.zona)}>
                                            <Trash2 size={12} />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </Card>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--spacing-lg)' }}>
                <Button variant="secondary" onClick={onBack}><ArrowLeft size={16} /> Atrás</Button>
                <Button variant="primary" onClick={onNext} disabled={formData.productos.length === 0}>
                    Siguiente <ArrowRight size={16} />
                </Button>
            </div>
        </FormSection>
    );
};
