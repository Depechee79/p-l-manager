import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InvoicesPage } from './InvoicesPage';
import type { Invoice, Provider } from '../types';

// Mock hooks
vi.mock('@core', () => ({
  useDatabase: vi.fn()
}));

vi.mock('../hooks/useInvoices', () => ({
  useInvoices: vi.fn()
}));

vi.mock('../hooks/useProviders', () => ({
  useProviders: vi.fn()
}));

// Mock feature components to isolate page-level behavior
vi.mock('@/features/invoices', () => ({
  InvoiceForm: vi.fn(({ onCancel }: { onCancel: () => void }) => (
    <div data-testid="invoice-form">
      <span>Formulario Factura</span>
      <button type="button" onClick={onCancel}>Cancelar</button>
    </div>
  )),
  InvoicesList: vi.fn(({ invoices, loading, onEdit, onDelete }: {
    invoices: Invoice[];
    loading: boolean;
    onEdit: (inv: Invoice) => void;
    onDelete: (inv: Invoice) => void;
  }) => (
    <div data-testid="invoices-list">
      {loading && <span>Cargando...</span>}
      {!loading && invoices.length === 0 && <span>No hay facturas registradas</span>}
      {invoices.map((inv) => (
        <div key={inv.id} data-testid={`invoice-${inv.id}`}>
          <span>{inv.numero || inv.numeroFactura}</span>
          <span>{inv.proveedor}</span>
          <button type="button" onClick={() => onEdit(inv)}>Editar</button>
          <button type="button" onClick={() => onDelete(inv)}>Eliminar</button>
        </div>
      ))}
    </div>
  )),
}));

vi.mock('@core/services/LoggerService', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }
}));

import { useDatabase } from '@core';
import { useInvoices } from '../hooks/useInvoices';
import { useProviders } from '../hooks/useProviders';

describe('InvoicesPage', () => {
  const mockInvoices: Invoice[] = [
    {
      id: 1,
      tipo: 'factura',
      numero: 'F001',
      numeroFactura: 'F001',
      proveedor: 'Proveedor Test',
      proveedorId: 1,
      fecha: '2024-01-15',
      total: 1210,
      productos: [
        {
          nombre: 'Producto 1',
          cantidad: 10,
          unidad: 'kg',
          precioUnitario: 100,
          subtotal: 1000
        }
      ],
      metodoPago: 'transferencia',
      notas: ''
    },
    {
      id: 2,
      tipo: 'factura',
      numero: 'F002',
      numeroFactura: 'F002',
      proveedor: 'Otro Proveedor',
      proveedorId: 2,
      fecha: '2024-01-20',
      total: 605,
      productos: [
        {
          nombre: 'Producto 2',
          cantidad: 5,
          unidad: 'l',
          precioUnitario: 100,
          subtotal: 500
        }
      ]
    }
  ];

  const mockProviders: Provider[] = [
    {
      id: 1,
      nombre: 'Proveedor Test',
      cif: '12345678A',
      contacto: 'Juan Perez',
      telefono: '600000000',
      email: 'test@test.com',
      direccion: 'Calle Test 1',
      codigoPostal: '28001',
      ciudad: 'Madrid',
      provincia: 'Madrid',
      notas: ''
    }
  ];

  const mockUseInvoices = {
    invoices: mockInvoices,
    filteredInvoices: mockInvoices,
    loading: false,
    error: null,
    totalAmount: 1815,
    createInvoice: vi.fn(),
    updateInvoice: vi.fn(),
    deleteInvoice: vi.fn(),
    filterByProvider: vi.fn(),
    filterByPeriod: vi.fn(),
    refreshInvoices: vi.fn(),
    setError: vi.fn(),
    clearError: vi.fn()
  };

  const mockUseProviders = {
    providers: mockProviders,
    filteredProviders: mockProviders,
    loading: false,
    error: null,
    createProvider: vi.fn(),
    updateProvider: vi.fn(),
    deleteProvider: vi.fn(),
    searchProviders: vi.fn(),
    refreshProviders: vi.fn(),
    stats: { total: 1, withInvoices: 1, withoutInvoices: 0, totalSpent: 1815 },
    setError: vi.fn(),
    clearError: vi.fn()
  };

  const mockDb = {
    ensureLoaded: vi.fn().mockResolvedValue(undefined),
    productos: [],
    proveedores: [],
    facturas: [],
    update: vi.fn().mockResolvedValue(null),
    add: vi.fn().mockResolvedValue({ id: 999 }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (vi.mocked(useDatabase)).mockReturnValue({ db: mockDb } as ReturnType<typeof useDatabase>);
    (vi.mocked(useInvoices)).mockReturnValue(mockUseInvoices);
    (vi.mocked(useProviders)).mockReturnValue(mockUseProviders);
  });

  it('renders page title', () => {
    render(<InvoicesPage />);
    expect(screen.getByText('Facturas')).toBeInTheDocument();
  });

  it('displays add invoice button', () => {
    render(<InvoicesPage />);
    expect(screen.getByText(/Nueva Factura/)).toBeInTheDocument();
  });

  it('displays empty state when no invoices', () => {
    (vi.mocked(useInvoices)).mockReturnValue({
      ...mockUseInvoices,
      invoices: [],
      filteredInvoices: []
    });

    render(<InvoicesPage />);
    expect(screen.getByText('No hay facturas registradas')).toBeInTheDocument();
  });

  it('displays list of invoices', () => {
    render(<InvoicesPage />);

    expect(screen.getByText('F001')).toBeInTheDocument();
    expect(screen.getByText('F002')).toBeInTheDocument();
    expect(screen.getAllByText('Proveedor Test').length).toBeGreaterThan(0);
    expect(screen.getByText('Otro Proveedor')).toBeInTheDocument();
  });

  it('switches to form view when clicking add invoice', async () => {
    const user = userEvent.setup();
    render(<InvoicesPage />);

    await user.click(screen.getByText(/Nueva Factura/));

    expect(screen.getByTestId('invoice-form')).toBeInTheDocument();
  });

  it('returns to list view when clicking cancel in form', async () => {
    const user = userEvent.setup();
    render(<InvoicesPage />);

    await user.click(screen.getByText(/Nueva Factura/));
    expect(screen.getByTestId('invoice-form')).toBeInTheDocument();

    await user.click(screen.getByText('Cancelar'));
    expect(screen.getByTestId('invoices-list')).toBeInTheDocument();
  });

  it('calls deleteInvoice after confirmation', async () => {
    const user = userEvent.setup();

    render(<InvoicesPage />);

    const deleteButtons = screen.getAllByText('Eliminar');
    await user.click(deleteButtons[0]);

    // ConfirmDialog opens — click the confirm button inside it
    const confirmDialog = screen.getByRole('alertdialog');
    const confirmButton = within(confirmDialog).getByText('Eliminar');
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockUseInvoices.deleteInvoice).toHaveBeenCalledWith(1);
    });
  });

  it('does not delete invoice when confirmation is cancelled', async () => {
    const user = userEvent.setup();

    render(<InvoicesPage />);

    const deleteButtons = screen.getAllByText('Eliminar');
    await user.click(deleteButtons[0]);

    // ConfirmDialog opens but we don't click confirm
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(mockUseInvoices.deleteInvoice).not.toHaveBeenCalled();
  });

  it('displays error message when present', () => {
    (vi.mocked(useInvoices)).mockReturnValue({
      ...mockUseInvoices,
      error: 'Error al cargar facturas'
    });

    render(<InvoicesPage />);
    expect(screen.getByText('Error al cargar facturas')).toBeInTheDocument();
  });

  it('clears error message when clicking close button', async () => {
    const user = userEvent.setup();
    (vi.mocked(useInvoices)).mockReturnValue({
      ...mockUseInvoices,
      error: 'Error al cargar facturas'
    });

    render(<InvoicesPage />);

    await user.click(screen.getByText('✕'));
    expect(mockUseInvoices.clearError).toHaveBeenCalled();
  });

  it('calls ensureLoaded on mount', async () => {
    render(<InvoicesPage />);

    await waitFor(() => {
      expect(mockDb.ensureLoaded).toHaveBeenCalledWith('facturas');
      expect(mockDb.ensureLoaded).toHaveBeenCalledWith('proveedores');
      expect(mockDb.ensureLoaded).toHaveBeenCalledWith('productos');
    });
  });

  it('switches to edit form when edit is clicked', async () => {
    const user = userEvent.setup();
    render(<InvoicesPage />);

    const editButtons = screen.getAllByText('Editar');
    await user.click(editButtons[0]);

    expect(screen.getByTestId('invoice-form')).toBeInTheDocument();
  });
});
