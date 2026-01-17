import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CierresPage } from './CierresPage';
import type { Cierre, CashBreakdown } from '../types';

// Mock hooks
vi.mock('@core', () => ({
  useDatabase: vi.fn()
}));

vi.mock('../hooks/useFinance', () => ({
  useFinance: vi.fn()
}));

import { useDatabase } from '@core';
import { useFinance } from '../hooks/useFinance';

describe('CierresPage', () => {
  const mockCierres: Cierre[] = [
    {
      id: 1,
      fecha: '2024-01-15',
      turno: 'dia_completo',
      desgloseEfectivo: {
        b500: 2, b200: 5, b100: 10, b50: 5, b20: 10, b10: 5, b5: 2,
        m2: 10, m1: 20, m050: 10, m020: 5, m010: 5, m005: 2, m002: 5, m001: 10
      } as CashBreakdown,
      efectivoContado: 2000,
      datafonos: [
        { terminal: 'Visa', importe: 500 },
        { terminal: 'Mastercard', importe: 300 }
      ],
      totalDatafonos: 800,
      otrosMedios: [
        { medio: 'Bizum', importe: 100 }
      ],
      totalOtrosMedios: 100,
      realDelivery: 0,
      totalReal: 2900,
      posEfectivo: 1950,
      posTarjetas: 850,
      posDelivery: 0,
      totalPos: 2800,
      descuadreTotal: 100,
      posTickets: 50,
      posExtras: 0
    },
    {
      id: 2,
      fecha: '2024-01-16',
      turno: 'mediodia',
      desgloseEfectivo: {},
      efectivoContado: 500,
      datafonos: [],
      totalDatafonos: 0,
      otrosMedios: [],
      totalOtrosMedios: 0,
      realDelivery: 0,
      totalReal: 500,
      posEfectivo: 500,
      posTarjetas: 0,
      posDelivery: 0,
      totalPos: 500,
      descuadreTotal: 0,
      posTickets: 10,
      posExtras: 0
    }
  ];

  const mockUseFinance = {
    closings: mockCierres,
    filteredClosings: mockCierres,
    loading: false,
    error: null,
    totalCash: 2500,
    createClosing: vi.fn(),
    updateClosing: vi.fn(),
    deleteClosing: vi.fn(),
    filterByPeriod: vi.fn(),
    refreshClosings: vi.fn(),
    setError: vi.fn(),
    clearError: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useDatabase as any).mockReturnValue({ db: {} });
    (useFinance as any).mockReturnValue(mockUseFinance);
  });

  it('renders page title', () => {
    render(<CierresPage />);
    expect(screen.getByText('Gestión de Cierres de Caja')).toBeInTheDocument();
  });

  it('displays add closing button', () => {
    render(<CierresPage />);
    expect(screen.getByText('➕ Nuevo Cierre')).toBeInTheDocument();
  });

  it('displays empty state when no closings', () => {
    (useFinance as any).mockReturnValue({
      ...mockUseFinance,
      closings: [],
      filteredClosings: []
    });

    render(<CierresPage />);
    expect(screen.getByText('No hay cierres registrados')).toBeInTheDocument();
  });

  it('displays list of closings', () => {
    render(<CierresPage />);

    expect(screen.getByText(/15\/1\/2024/)).toBeInTheDocument();
    expect(screen.getByText(/16\/1\/2024/)).toBeInTheDocument();
  });

  it('displays statistics', () => {
    render(<CierresPage />);

    expect(screen.getByText(/total cierres:/i)).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows cuadra badge when descuadre is zero', () => {
    render(<CierresPage />);

    expect(screen.getByText(/✅ CUADRA/)).toBeInTheDocument();
  });

  it('shows descuadre badge when there is difference', () => {
    render(<CierresPage />);

    expect(screen.getByText(/⚠ DESCUADRE/)).toBeInTheDocument();
  });

  it('opens modal when clicking add closing', async () => {
    const user = userEvent.setup();
    render(<CierresPage />);

    await user.click(screen.getByText('➕ Nuevo Cierre'));

    expect(screen.getByText('Nuevo Cierre')).toBeInTheDocument();
    expect(screen.getByLabelText(/fecha/i)).toBeInTheDocument();
  });

  it('filters closings by period', async () => {
    const user = userEvent.setup();
    render(<CierresPage />);

    const input = screen.getByLabelText(/periodo/i);
    await user.type(input, '2024-01');

    expect(mockUseFinance.filterByPeriod).toHaveBeenCalledWith('2024-01');
  });

  it('expands closing details when clicked', async () => {
    const user = userEvent.setup();
    render(<CierresPage />);

    const expandButtons = screen.getAllByText('▼');
    await user.click(expandButtons[0]);

    // Use getAllByText to handle duplicate "Efectivo" text (stats + details)
    const efectivoTexts = screen.getAllByText(/💶 Efectivo/);
    expect(efectivoTexts[0]).toBeInTheDocument();
    expect(screen.getByText(/💳 Tarjetas/)).toBeInTheDocument();
  });

  it('submits create closing form with basic data', async () => {
    const user = userEvent.setup();
    render(<CierresPage />);

    await user.click(screen.getByText('➕ Nuevo Cierre'));

    const fechaInput = screen.getByLabelText(/fecha/i);
    fireEvent.change(fechaInput, { target: { value: '2024-01-20' } });

    const turnoSelect = screen.getByLabelText(/turno/i);
    await user.selectOptions(turnoSelect, 'dia_completo');

    await user.click(screen.getByText('Siguiente'));

    // Step 2: Enter cash breakdown - use getAllByLabelText for duplicate labels
    const b50Input = screen.getAllByLabelText(/billetes de 50/i)[0];
    await user.clear(b50Input);
    await user.type(b50Input, '10');

    const posEfectivoInput = screen.getByLabelText(/efectivo \(pos\)/i);
    await user.type(posEfectivoInput, '500');

    await user.click(screen.getByText('Guardar Cierre'));

    await waitFor(() => {
      expect(mockUseFinance.createClosing).toHaveBeenCalled();
    });
  });

  it('opens edit modal with closing data', async () => {
    const user = userEvent.setup();
    render(<CierresPage />);

    const editButtons = screen.getAllByText('✏️');
    await user.click(editButtons[0]);

    expect(screen.getByText('Editar Cierre')).toBeInTheDocument();
  });

  it('deletes closing after confirmation', async () => {
    const user = userEvent.setup();
    window.confirm = vi.fn(() => true);

    render(<CierresPage />);

    const deleteButtons = screen.getAllByText('🗑️');
    await user.click(deleteButtons[0]);

    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringContaining('¿Eliminar el cierre del 15/1/2024?')
    );
    expect(mockUseFinance.deleteClosing).toHaveBeenCalledWith(1);
  });

  it('does not delete closing when confirmation is cancelled', async () => {
    const user = userEvent.setup();
    window.confirm = vi.fn(() => false);

    render(<CierresPage />);

    const deleteButtons = screen.getAllByText('🗑️');
    await user.click(deleteButtons[0]);

    expect(mockUseFinance.deleteClosing).not.toHaveBeenCalled();
  });

  it('closes modal when clicking cancel', async () => {
    const user = userEvent.setup();
    render(<CierresPage />);

    await user.click(screen.getByText('➕ Nuevo Cierre'));
    expect(screen.getByText('Nuevo Cierre')).toBeInTheDocument();

    await user.click(screen.getByText('Cancelar'));
    expect(screen.queryByText('Nuevo Cierre')).not.toBeInTheDocument();
  });

  it('displays error message when present', () => {
    (useFinance as any).mockReturnValue({
      ...mockUseFinance,
      error: 'Error al cargar cierres'
    });

    render(<CierresPage />);
    expect(screen.getByText('Error al cargar cierres')).toBeInTheDocument();
  });

  it('clears error message when clicking close', async () => {
    const user = userEvent.setup();
    (useFinance as any).mockReturnValue({
      ...mockUseFinance,
      error: 'Error al cargar cierres'
    });

    render(<CierresPage />);

    await user.click(screen.getByText('✕'));
    expect(mockUseFinance.clearError).toHaveBeenCalled();
  });

  it('adds datafono row', async () => {
    const user = userEvent.setup();
    render(<CierresPage />);

    await user.click(screen.getByText('➕ Nuevo Cierre'));
    await user.click(screen.getByText('Siguiente'));

    await user.click(screen.getByText('➕ Añadir Datáfono'));

    expect(screen.getByPlaceholderText(/nombre del datáfono/i)).toBeInTheDocument();
  });

  it('adds otro medio row', async () => {
    const user = userEvent.setup();
    render(<CierresPage />);

    await user.click(screen.getByText('➕ Nuevo Cierre'));
    await user.click(screen.getByText('Siguiente'));

    await user.click(screen.getByText('➕ Añadir Otro Medio'));

    expect(screen.getByPlaceholderText(/tipo de pago/i)).toBeInTheDocument();
  });
});
