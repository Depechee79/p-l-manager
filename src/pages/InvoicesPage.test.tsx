import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InvoicesPage } from './InvoicesPage';
import type { Invoice, Provider } from '../types';

// Mock hooks
vi.mock('../hooks/useDatabase', () => ({
  useDatabase: vi.fn()
}));

vi.mock('../hooks/useInvoices', () => ({
  useInvoices: vi.fn()
}));

vi.mock('../hooks/useProviders', () => ({
  useProviders: vi.fn()
}));

import { useDatabase } from '../hooks/useDatabase';
import { useInvoices } from '../hooks/useInvoices';
import { useProviders } from '../hooks/useProviders';

describe('InvoicesPage', () => {
  const mockInvoices: Invoice[] = [
    {
      id: 1,
      tipo: 'factura',
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
      contacto: 'Juan Pérez',
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
    loading: false,
    error: null,
    addProvider: vi.fn(),
    updateProvider: vi.fn(),
    deleteProvider: vi.fn(),
    searchProviders: vi.fn(),
    getStatistics: vi.fn(),
    clearError: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useDatabase as any).mockReturnValue({ db: {} });
    (useInvoices as any).mockReturnValue(mockUseInvoices);
    (useProviders as any).mockReturnValue(mockUseProviders);
  });

  it('renders page title', () => {
    render(<InvoicesPage />);
    expect(screen.getByText('Gestión de Facturas')).toBeInTheDocument();
  });

  it('displays add invoice button', () => {
    render(<InvoicesPage />);
    expect(screen.getByText('➕ Nueva Factura')).toBeInTheDocument();
  });

  it('displays empty state when no invoices', () => {
    (useInvoices as any).mockReturnValue({
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

  it('displays statistics', () => {
    render(<InvoicesPage />);
    
    expect(screen.getByText(/total facturas:/i)).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText(/importe total:/i)).toBeInTheDocument();
    expect(screen.getByText('1815,00 €')).toBeInTheDocument();
  });

  it('opens modal when clicking add invoice', async () => {
    const user = userEvent.setup();
    render(<InvoicesPage />);
    
    await user.click(screen.getByText('➕ Nueva Factura'));
    
    expect(screen.getByText('Nueva Factura')).toBeInTheDocument();
    expect(screen.getByLabelText(/número factura/i)).toBeInTheDocument();
  });

  it('filters invoices by provider', async () => {
    const user = userEvent.setup();
    render(<InvoicesPage />);
    
    const select = screen.getByLabelText(/filtrar por proveedor/i);
    await user.selectOptions(select, '1');
    
    expect(mockUseInvoices.filterByProvider).toHaveBeenCalledWith(1);
  });

  it('filters invoices by period', async () => {
    const user = userEvent.setup();
    render(<InvoicesPage />);
    
    const input = screen.getByLabelText(/periodo/i);
    await user.type(input, '2024-01');
    
    expect(mockUseInvoices.filterByPeriod).toHaveBeenCalledWith('2024-01-01', '2024-01-31');
  });

  it('submits create invoice form', async () => {
    const user = userEvent.setup();
    render(<InvoicesPage />);
    
    await user.click(screen.getByText('➕ Nueva Factura'));
    
    await user.type(screen.getByLabelText(/número factura/i), 'F003');
    const proveedorSelects = screen.getAllByLabelText(/proveedor/i);
    await user.selectOptions(proveedorSelects[1], '1'); // Use the modal select (second one)
    
    const fechaInput = screen.getByLabelText(/fecha/i);
    fireEvent.change(fechaInput, { target: { value: '2024-01-25' } });
    
    await user.clear(screen.getByLabelText(/total/i));
    await user.type(screen.getByLabelText(/total/i), '800');
    
    await user.click(screen.getByText('Guardar'));
    
    await waitFor(() => {
      expect(mockUseInvoices.createInvoice).toHaveBeenCalledWith(
        expect.objectContaining({
          numeroFactura: 'F003',
          proveedorId: 1,
          fecha: '2024-01-25',
          total: 800
        })
      );
    });
  });

  it('opens edit modal with invoice data', async () => {
    const user = userEvent.setup();
    render(<InvoicesPage />);
    
    const editButtons = screen.getAllByText('✏️');
    await user.click(editButtons[0]);
    
    expect(screen.getByText('Editar Factura')).toBeInTheDocument();
    expect(screen.getByLabelText(/número factura/i)).toHaveValue('F001');
    expect(screen.getByLabelText(/total/i)).toHaveValue(1210);
  });

  it('submits edit invoice form', async () => {
    const user = userEvent.setup();
    render(<InvoicesPage />);
    
    const editButtons = screen.getAllByText('✏️');
    await user.click(editButtons[0]);
    
    const totalInput = screen.getByLabelText(/total/i);
    await user.clear(totalInput);
    await user.type(totalInput, '1500');
    
    await user.click(screen.getByText('Guardar'));
    
    await waitFor(() => {
      expect(mockUseInvoices.updateInvoice).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          total: 1500
        })
      );
    });
  });

  it('deletes invoice after confirmation', async () => {
    const user = userEvent.setup();
    window.confirm = vi.fn(() => true);
    
    render(<InvoicesPage />);
    
    const deleteButtons = screen.getAllByText('🗑️');
    await user.click(deleteButtons[0]);
    
    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringContaining('¿Eliminar la factura F001?')
    );
    expect(mockUseInvoices.deleteInvoice).toHaveBeenCalledWith(1);
  });

  it('does not delete invoice when confirmation is cancelled', async () => {
    const user = userEvent.setup();
    window.confirm = vi.fn(() => false);
    
    render(<InvoicesPage />);
    
    const deleteButtons = screen.getAllByText('🗑️');
    await user.click(deleteButtons[0]);
    
    expect(mockUseInvoices.deleteInvoice).not.toHaveBeenCalled();
  });

  it('closes modal when clicking cancel', async () => {
    const user = userEvent.setup();
    render(<InvoicesPage />);
    
    await user.click(screen.getByText('➕ Nueva Factura'));
    expect(screen.getByText('Nueva Factura')).toBeInTheDocument();
    
    await user.click(screen.getByText('Cancelar'));
    expect(screen.queryByText('Nueva Factura')).not.toBeInTheDocument();
  });

  it('displays error message when present', () => {
    (useInvoices as any).mockReturnValue({
      ...mockUseInvoices,
      error: 'Error al cargar facturas'
    });

    render(<InvoicesPage />);
    expect(screen.getByText('Error al cargar facturas')).toBeInTheDocument();
  });

  it('clears error message when clicking close', async () => {
    const user = userEvent.setup();
    (useInvoices as any).mockReturnValue({
      ...mockUseInvoices,
      error: 'Error al cargar facturas'
    });

    render(<InvoicesPage />);
    
    await user.click(screen.getByText('✕'));
    expect(mockUseInvoices.clearError).toHaveBeenCalled();
  });

  it('displays invoice type selector', async () => {
    const user = userEvent.setup();
    render(<InvoicesPage />);
    
    await user.click(screen.getByText('➕ Nueva Factura'));
    
    const tipoSelect = screen.getByLabelText(/tipo/i);
    expect(tipoSelect).toBeInTheDocument();
    expect(tipoSelect).toHaveValue('factura');
  });
});
