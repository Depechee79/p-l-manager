import { render, screen, fireEvent } from '@testing-library/react';
import { RestaurantConfigPage } from './RestaurantConfigPage';
import { useRestaurant } from '@core';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@core', () => ({
    useRestaurant: vi.fn(),
    useRestaurantContext: vi.fn(() => ({ currentRestaurant: null, restaurants: [] })),
}));

// Mock shared components to avoid complexity
vi.mock('@shared/components', () => ({
    Card: ({ children, style }: any) => <div data-testid="card" style={style}>{children}</div>,
    Button: ({ onClick, children, disabled }: any) => <button onClick={onClick} disabled={disabled}>{children}</button>,
    Input: ({ label, value, onChange, placeholder }: any) => (
        <div>
            <label>{label}</label>
            <input placeholder={placeholder} value={value} onChange={onChange} />
        </div>
    ),
    PageHeader: ({ title }: any) => <h1>{title}</h1>,
    Select: ({ label, value, onChange }: any) => (
        <div>
            <label>{label}</label>
            <select value={value} onChange={(e) => onChange(e.target.value)} data-testid="select">
                <option value="Europe/Madrid">Madrid</option>
                <option value="EUR">Euro</option>
            </select>
        </div>
    )
}));

describe('RestaurantConfigPage E2E Verification', () => {
    const mockUpdateRestaurant = vi.fn();
    const mockCreateRestaurant = vi.fn();

    beforeEach(() => {
        (useRestaurant as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            currentRestaurant: {
                id: '1',
                nombre: 'Test Restaurant',
                configuracion: { ivarestaurante: 10 }
            },
            restaurants: [
                { id: '1', nombre: 'Test Restaurant', activo: true }
            ],
            currentCompany: { nombre: 'Test Group' },
            loading: false,
            updateRestaurant: mockUpdateRestaurant,
            createRestaurant: mockCreateRestaurant,
            switchRestaurant: vi.fn(),
            currentCompanyId: '1'
        });
    });

    it('renders the configuration page correctly', () => {
        render(<RestaurantConfigPage />);
        expect(screen.getByText('Configuración Corporativa')).toBeInTheDocument();
        // Check for premium tabs
        expect(screen.getByText('Unidad')).toBeInTheDocument();
        expect(screen.getByText('Holding / Grupo')).toBeInTheDocument();
    });

    it('allows editing restaurant details', () => {
        render(<RestaurantConfigPage />);

        const nameInput = screen.getByPlaceholderText('La Taberna Real');
        fireEvent.change(nameInput, { target: { value: 'Updated Name' } });

        const saveButton = screen.getByText('Guardar Cambios de Unidad');
        fireEvent.click(saveButton);

        expect(mockUpdateRestaurant).toHaveBeenCalledWith(expect.objectContaining({
            nombre: 'Updated Name'
        }));
    });

    it('switches tabs correctly', () => {
        render(<RestaurantConfigPage />);

        fireEvent.click(screen.getByText('Holding / Grupo'));
        expect(screen.getByText('Entidad Matriz')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Unidad'));
        expect(screen.getByText('Identidad de la Unidad')).toBeInTheDocument();
    });
});
