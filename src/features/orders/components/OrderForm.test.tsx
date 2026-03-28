import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OrderForm } from './OrderForm';
import type { Product, Provider } from '@types';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@components', () => ({
    Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Button: ({ onClick, children, disabled }: { onClick?: () => void; children: React.ReactNode; disabled?: boolean }) => <button onClick={onClick} disabled={disabled}>{children}</button>,
    Input: ({ label, value, onChange, placeholder, type }: { label?: string; value?: string | number; onChange?: React.ChangeEventHandler<HTMLInputElement>; placeholder?: string; type?: string }) => (
        <div>
            <label>{label}</label>
            <input type={type} placeholder={placeholder} value={value} onChange={onChange} data-testid={`input-${label}`} />
        </div>
    ),
    Select: ({ label, value, onChange, options }: { label?: string; value?: string; onChange?: (value: string) => void; options: Array<{ value: string; label: string }> }) => (
        <div>
            <label>{label}</label>
            <select value={value} onChange={(e) => onChange?.(e.target.value)} data-testid={`select-${label}`}>
                <option value="">Select...</option>
                {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
        </div>
    ),
    DatePicker: ({ label, value, onChange }: { label?: string; value?: string; onChange?: (value: string) => void }) => (
        <div>
            <label>{label}</label>
            <input type="date" value={value} onChange={(e) => onChange?.(e.target.value)} />
        </div>
    ),
    FormSection: ({ title, children }: { title: string; children: React.ReactNode }) => <div><h3>{title}</h3>{children}</div>,
}));

// Mock child components
vi.mock('../components/StockSuggestions', () => ({
    StockSuggestions: () => <div>StockSuggestions Mock</div>
}));

// Mock internal component to ensure stable test environment
vi.mock('../components/OrderProductList', () => ({
    OrderProductList: ({ products, onChange }: { products: Array<{ productoId: string | number; nombre?: string; cantidad: number; unidad: string; precioUnitario: number }>; onChange: (products: Array<{ productoId: string | number; cantidad: number; unidad: string; precioUnitario: number }>) => void }) => (
        <div>
            <div data-testid="product-list">
                {products.map((p, i: number) => (
                    <div key={i} data-testid={`product-row-${i}`}>
                        <span>{p.nombre}</span>
                        <button onClick={() => {
                            const newP = [...products];
                            newP.splice(i, 1);
                            onChange(newP);
                        }}>Remove</button>
                    </div>
                ))}
            </div>
            <button onClick={() => onChange([...products, { productoId: '1', cantidad: 1, unidad: 'kg', precioUnitario: 10 }])}>
                Add Mock Product
            </button>
        </div>
    )
}));

const mockProviders: Provider[] = [
    { id: 1, nombre: 'Proveedor A', cif: 'B12345678', email: 'a@test.com', telefono: '123', contacto: 'John' }
];

const mockProducts: Product[] = [
    { id: 1, nombre: 'Tomatoes', categoria: 'Food', unidadBase: 'kg', precioCompra: 2.5, stockActualUnidades: 10, stockMinimoUnidades: 5, proveedorId: 1, proveedor: 'Proveedor A', esEmpaquetado: false }
];

describe('OrderForm Integration Test', () => {
    const mockOnSave = vi.fn();
    const mockOnCancel = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders and allows creating a new order', async () => {
        render(
            <OrderForm
                initialData={null}
                providers={mockProviders}
                products={mockProducts}
                onSave={mockOnSave}
                onCancel={mockOnCancel}
            />
        );

        expect(screen.getByText('Nuevo Pedido')).toBeInTheDocument();

        // Select Provider
        const providerSelect = screen.getByTestId('select-Proveedor *');
        fireEvent.change(providerSelect, { target: { value: '1' } });

        // Add Product (via mock button)
        fireEvent.click(screen.getByText('Add Mock Product'));

        // Verify product name resolution works (Fix verification)
        await waitFor(() => {
            expect(screen.getByText('Tomatoes')).toBeInTheDocument();
        });

        // Submit
        fireEvent.click(screen.getByText('Guardar'));

        expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
            proveedorId: '1',
            productos: expect.arrayContaining([
                expect.objectContaining({ productoId: '1', cantidad: 1 })
            ])
        }));
    });
});
