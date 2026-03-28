import React from 'react';
import { Button, Input, FormSection, Card } from '@shared/components';
import { ArrowRight, ArrowLeft, Plus, Search, Trash2, Package } from 'lucide-react';
import { EscandalloFormData } from '../wizard.types';
import { formatCurrency } from '@utils/formatters';
import { EscandalloService } from '@/services/escandallo-service';
import type { Product, EscandaloIngrediente as Ingredient } from '@types';

interface IngredientsStepProps {
    data: EscandalloFormData;
    onChange: (updates: Partial<EscandalloFormData>) => void;
    onNext: () => void;
    onPrevious: () => void;
    availableProducts: Product[];
    productSearchQuery: string;
    setProductSearchQuery: (query: string) => void;
}

export const IngredientsStep: React.FC<IngredientsStepProps> = ({
    data,
    onChange,
    onNext,
    onPrevious,
    availableProducts,
    productSearchQuery,
    setProductSearchQuery,
}) => {
    const addIngredient = (product?: Product) => {
        const newIngredient: Ingredient = product
            ? {
                productoId: String(product.id),
                nombre: product.nombre || '',
                cantidad: 0,
                unidad: product.unidadBase || 'kg',
                costeUnitario: product.precioCompra || 0,
                costeTotal: 0,
            }
            : {
                productoId: `manual_${Date.now()}`,
                nombre: '',
                cantidad: 0,
                unidad: 'kg',
                costeUnitario: 0,
                costeTotal: 0,
            };

        onChange({
            ingredientes: [...data.ingredientes, newIngredient],
        });
        setProductSearchQuery('');
    };

    const updateIngredient = (index: number, field: keyof Ingredient, value: string | number) => {
        const newIngredientes = [...data.ingredientes];
        newIngredientes[index] = {
            ...newIngredientes[index],
            [field]: value,
        };

        if (field === 'cantidad' || field === 'costeUnitario') {
            newIngredientes[index].costeTotal = EscandalloService.calculateIngredientCost(
                newIngredientes[index].cantidad,
                newIngredientes[index].costeUnitario
            );
        }

        onChange({ ingredientes: newIngredientes });
    };

    const removeIngredient = (index: number) => {
        onChange({
            ingredientes: data.ingredientes.filter((_, i) => i !== index),
        });
    };

    return (
        <FormSection
            title="Ingredientes"
            description="Añade los ingredientes del plato y sus cantidades"
        >
            <Card style={{ marginBottom: 'var(--spacing-lg)' }}>
                <h4 style={{ marginBottom: 'var(--spacing-md)', fontSize: 'var(--font-size-base)', fontWeight: '600' }}>
                    Buscar Producto del Almacén
                </h4>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    <Input
                        type="text"
                        placeholder="Buscar producto..."
                        value={productSearchQuery}
                        onChange={(e) => setProductSearchQuery(e.target.value)}
                        fullWidth
                        icon={<Search size={18} />}
                        iconPosition="left"
                    />
                </div>

                {productSearchQuery && availableProducts.length > 0 && (
                    <div
                        style={{
                            marginTop: 'var(--spacing-md)',
                            maxHeight: '200px',
                            overflowY: 'auto',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius)',
                        }}
                    >
                        {availableProducts.slice(0, 10).map((product) => (
                            <div
                                key={String(product.id)}
                                onClick={() => addIngredient(product)}
                                style={{
                                    padding: 'var(--spacing-sm) var(--spacing-md)',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid var(--border)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    transition: 'background-color var(--transition-base)',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'var(--surface-muted)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                            >
                                <div>
                                    <div style={{ fontWeight: '500' }}>{product.nombre}</div>
                                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                                        {formatCurrency(product.precioCompra)} / {product.unidadBase}
                                    </div>
                                </div>
                                <Button size="sm" variant="secondary" onClick={(e) => {
                                    e.stopPropagation();
                                    addIngredient(product);
                                }}>
                                    <Plus size={14} />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}

                <div style={{ marginTop: 'var(--spacing-md)', display: 'flex', justifyContent: 'flex-start' }}>
                    <Button type="button" variant="secondary" onClick={() => addIngredient()}>
                        <Plus size={16} /> Añadir Ingrediente Manual
                    </Button>
                </div>
            </Card>

            {data.ingredientes.length === 0 ? (
                <Card style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                    <Package size={48} style={{ color: 'var(--text-light)', marginBottom: 'var(--spacing-md)' }} />
                    <p style={{ color: 'var(--text-secondary)' }}>
                        No hay ingredientes añadidos. Busca productos del almacén o añade uno manualmente.
                    </p>
                </Card>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                    {data.ingredientes.map((ing, index) => (
                        <Card key={ing.productoId || index}>
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                                    gap: 'var(--spacing-md)',
                                    alignItems: 'end',
                                }}
                            >
                                <Input
                                    label="Producto"
                                    type="text"
                                    placeholder="Nombre"
                                    value={ing.nombre}
                                    onChange={(e) => updateIngredient(index, 'nombre', e.target.value)}
                                    fullWidth
                                />
                                <Input
                                    label="Cantidad"
                                    type="number"
                                    step="0.001"
                                    value={ing.cantidad}
                                    onChange={(e) => updateIngredient(index, 'cantidad', parseFloat(e.target.value) || 0)}
                                    fullWidth
                                />
                                <Input
                                    label="Unidad"
                                    type="text"
                                    placeholder="kg, ud, l..."
                                    value={ing.unidad}
                                    onChange={(e) => updateIngredient(index, 'unidad', e.target.value)}
                                    fullWidth
                                />
                                <Input
                                    label="Coste Unit. (€)"
                                    type="number"
                                    step="0.01"
                                    value={ing.costeUnitario}
                                    onChange={(e) => updateIngredient(index, 'costeUnitario', parseFloat(e.target.value) || 0)}
                                    fullWidth
                                />
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                                    <label className="input-label" style={{ fontSize: 'var(--font-size-sm)', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                                        Total
                                    </label>
                                    <div
                                        style={{
                                            padding: 'var(--spacing-sm) var(--spacing-md)',
                                            backgroundColor: 'var(--surface-muted)',
                                            borderRadius: 'var(--radius)',
                                            textAlign: 'right',
                                            fontWeight: '600',
                                            minHeight: '40px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'flex-end',
                                            border: '1px solid transparent'
                                        }}
                                    >
                                        {formatCurrency(ing.costeTotal)}
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="danger"
                                    size="sm"
                                    onClick={() => removeIngredient(index)}
                                    style={{ alignSelf: 'end', padding: 'var(--spacing-sm)' }}
                                >
                                    <Trash2 size={16} />
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'space-between', marginTop: 'var(--spacing-xl)' }}>
                <Button type="button" variant="secondary" onClick={onPrevious}>
                    <ArrowLeft size={16} /> Atrás
                </Button>
                <Button type="button" variant="primary" onClick={onNext} disabled={data.ingredientes.length === 0}>
                    Siguiente <ArrowRight size={16} />
                </Button>
            </div>
        </FormSection>
    );
};
