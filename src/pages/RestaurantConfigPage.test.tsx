import { render, screen, fireEvent } from '@testing-library/react';
import { RestaurantConfigPage } from './RestaurantConfigPage';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock @core hooks
vi.mock('@core', () => ({
    useRestaurant: vi.fn().mockReturnValue({
        currentRestaurant: {
            id: '1',
            nombre: 'Test Restaurant',
            nombreComercial: 'Test Commercial',
            configuracion: { ivaRestaurante: 10, zonaHoraria: 'Europe/Madrid', moneda: 'EUR' },
        },
        restaurants: [
            { id: '1', nombre: 'Test Restaurant', activo: true },
        ],
        currentCompany: { nombre: 'Test Group', razonSocial: 'Test SL', cif: 'B12345678' },
        loading: false,
        updateRestaurant: vi.fn(),
        updateCompany: vi.fn(),
        createRestaurant: vi.fn(),
        deleteRestaurant: vi.fn(),
        switchRestaurant: vi.fn(),
        currentCompanyId: '1',
    }),
    useRestaurantContext: vi.fn().mockReturnValue({ currentRestaurant: null, restaurants: [] }),
}));

// Mock useUserPermissions
vi.mock('@/shared/hooks/useUserPermissions', () => ({
    useUserPermissions: vi.fn().mockReturnValue({
        permissions: [],
        role: undefined,
        hasPermission: vi.fn().mockReturnValue(true),
        hasAnyPermission: vi.fn().mockReturnValue(true),
        hasAllPermissions: vi.fn().mockReturnValue(true),
        isAuthenticated: true,
    }),
}));

// Mock LoggerService
vi.mock('@core/services/LoggerService', () => ({
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// Mock features/config components
vi.mock('@/features/config', () => ({
    RolesTab: ({ onActionsChange }: { onActionsChange?: (actions: React.ReactNode) => void }) => (
        <div data-testid="roles-tab">Roles Tab Content</div>
    ),
    ResponsablesTab: () => <div data-testid="responsables-tab">Responsables Tab Content</div>,
}));

// Mock ConfigDetailLayout
vi.mock('@/shared/components/config-layout', () => ({
    ConfigDetailLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock shared components
vi.mock('@shared/components', () => ({
    Card: ({ children, style, bodyStyle }: { children: React.ReactNode; style?: React.CSSProperties; bodyStyle?: React.CSSProperties }) => (
        <div data-testid="card" style={style}>{children}</div>
    ),
    Button: ({ onClick, children, disabled }: { onClick?: () => void; children: React.ReactNode; disabled?: boolean }) => (
        <button onClick={onClick} disabled={disabled}>{children}</button>
    ),
    Input: ({ label, value, onChange, placeholder, disabled, icon, style }: {
        label?: string; value?: string; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
        placeholder?: string; disabled?: boolean; icon?: React.ReactNode; style?: React.CSSProperties;
    }) => (
        <div>
            {label && <label>{label}</label>}
            <input placeholder={placeholder} value={value || ''} onChange={onChange} disabled={disabled} />
        </div>
    ),
    PageLayout: ({ children, header }: { children: React.ReactNode; header?: React.ReactNode; disableScroll?: boolean }) => (
        <div>{header}{children}</div>
    ),
    ActionHeader: ({ tabs, activeTab, onTabChange, actions }: {
        tabs: Array<{ id: string; label: string; icon?: React.ReactNode }>;
        activeTab: string;
        onTabChange: (id: string) => void;
        actions?: React.ReactNode;
    }) => (
        <div data-testid="action-header">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    data-active={tab.id === activeTab}
                >
                    {tab.label}
                </button>
            ))}
            {actions}
        </div>
    ),
    Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
    Table: () => <table data-testid="table"><tbody></tbody></table>,
    Switch: ({ checked, onChange, label }: { checked?: boolean; onChange?: (v: boolean) => void; label?: string }) => (
        <label><input type="checkbox" checked={checked} onChange={() => onChange?.(!checked)} />{label}</label>
    ),
    Modal: ({ children, open }: { children: React.ReactNode; open: boolean }) => open ? <div role="dialog">{children}</div> : null,
    PageContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Select: ({ label, value, onChange }: { label?: string; value?: string; onChange?: (v: string) => void }) => (
        <div>
            {label && <label>{label}</label>}
            <select value={value} onChange={(e) => onChange?.(e.target.value)}>
                <option value="Europe/Madrid">Madrid</option>
                <option value="EUR">Euro</option>
            </select>
        </div>
    ),
}));

describe('RestaurantConfigPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the configuration page with tabs', () => {
        render(<RestaurantConfigPage />);

        // Check tabs are rendered
        expect(screen.getByText('Holding / Grupo')).toBeInTheDocument();
        expect(screen.getByText('Restaurantes')).toBeInTheDocument();
        expect(screen.getByText('Responsables')).toBeInTheDocument();
        expect(screen.getByText('Roles')).toBeInTheDocument();
    });

    it('shows group data on the default tab', () => {
        render(<RestaurantConfigPage />);

        // Default tab is 'group' (Holding / Grupo)
        expect(screen.getByText('Nombre Comercial del Grupo')).toBeInTheDocument();
    });

    it('switches tabs correctly', () => {
        render(<RestaurantConfigPage />);

        // Click Roles tab
        fireEvent.click(screen.getByText('Roles'));
        expect(screen.getByTestId('roles-tab')).toBeInTheDocument();

        // Click back to Holding / Grupo
        fireEvent.click(screen.getByText('Holding / Grupo'));
        expect(screen.getByText('Nombre Comercial del Grupo')).toBeInTheDocument();
    });
});
