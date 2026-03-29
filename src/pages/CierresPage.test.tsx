import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
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
    (useDatabase as Mock).mockReturnValue({ db: { ensureLoaded: vi.fn() } });
    (useFinance as Mock).mockReturnValue(mockUseFinance);
  });

  it('displays add closing button', () => {
    render(<CierresPage />);
    expect(screen.getByText(/Nuevo Cierre/i)).toBeInTheDocument();
  });

  it('displays empty state when no closings', () => {
    (useFinance as Mock).mockReturnValue({
      ...mockUseFinance,
      closings: [],
      filteredClosings: []
    });

    render(<CierresPage />);
    expect(screen.getByText('No hay cierres registrados')).toBeInTheDocument();
  });

  it('displays list of closings', () => {
    render(<CierresPage />);

    expect(screen.getAllByText(/2024/i).length).toBeGreaterThan(0);
  });

  it('displays statistics', () => {
    render(<CierresPage />);

    expect(screen.getAllByText(/Cierres/)[0]).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows cuadra badge when descuadre is zero', () => {
    render(<CierresPage />);

    expect(screen.getAllByText(/CUADRA/i)[0]).toBeInTheDocument();
  });

  it('shows descuadre badge when there is difference', () => {
    render(<CierresPage />);

    expect(screen.getByText(/100,00 €/)).toBeInTheDocument();
  });

  it('opens modal when clicking add closing', async () => {
    const user = userEvent.setup();
    render(<CierresPage />);

    await user.click(screen.getByText(/Nuevo Cierre/i));

    expect(screen.getByText('Nuevo Cierre')).toBeInTheDocument();
    expect(screen.getByLabelText(/fecha/i)).toBeInTheDocument();
  });

  it('filters closings by period', async () => {
    const user = userEvent.setup();
    render(<CierresPage />);

    const input = document.querySelector('input[type="month"]') as HTMLInputElement;
    if (input) {
      fireEvent.change(input, { target: { value: '2024-01' } });
    }

    expect(mockUseFinance.filterByPeriod).toHaveBeenCalledWith('2024-01-01', '2024-01-31');
  });

  it('expands closing details when clicked', async () => {
    const user = userEvent.setup();
    render(<CierresPage />);

    const rows = screen.getAllByRole('row');
    await user.click(rows[1]);

    // Assert totalDatafonos value instead of 'Tarjetas' text to avoid SVG text split issue
    expect(screen.getByText('800,00 €')).toBeInTheDocument();
  });

  it('submits create closing form with basic data', async () => {
    const user = userEvent.setup();
    render(<CierresPage />);

    await user.click(screen.getByText(/Nuevo Cierre/i));

    const fechaInput = screen.getByLabelText(/fecha/i);
    fireEvent.change(fechaInput, { target: { value: '2024-01-20' } });

    const turnoSelect = screen.getByLabelText(/turno/i);
    await user.selectOptions(turnoSelect, 'dia_completo');

    await user.click(screen.getByText('Siguiente'));

    // Step 2: Enter cash breakdown
    const b50Input = screen.getAllByRole('spinbutton')[3];
    await user.clear(b50Input);
    await user.type(b50Input, '10');

    await user.click(screen.getByText('Siguiente')); // Go to Step 3

    await user.click(screen.getByText('Siguiente')); // Go to Step 4

    const posEfectivoInput = screen.getByLabelText('Efectivo');
    await user.clear(posEfectivoInput);
    await user.type(posEfectivoInput, '500');

    await user.click(screen.getByText('Confirmar y Guardar'));

    await waitFor(() => {
      expect(mockUseFinance.createClosing).toHaveBeenCalled();
    });
  });

  it('opens edit modal with closing data', async () => {
    const user = userEvent.setup();
    render(<CierresPage />);

    const rows = screen.getAllByRole('row');
    await user.click(rows[1]); // expand
    const editButtons = screen.getAllByRole('button', { name: /Editar/i });
    await user.click(editButtons[0]);

    expect(screen.getByText('Editar Cierre')).toBeInTheDocument();
  });

  it('deletes closing after confirmation', async () => {
    const user = userEvent.setup();

    render(<CierresPage />);

    const rows = screen.getAllByRole('row');
    await user.click(rows[1]); // expand
    const deleteButtons = screen.getAllByRole('button', { name: /Eliminar/i });
    await user.click(deleteButtons[0]);

    // ConfirmDialog opens — click the confirm button inside it
    const confirmDialog = screen.getByRole('alertdialog');
    const confirmButton = within(confirmDialog).getByText('Eliminar');
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockUseFinance.deleteClosing).toHaveBeenCalledWith(1);
    });
  });

  it('does not delete closing when confirmation is cancelled', async () => {
    const user = userEvent.setup();

    render(<CierresPage />);

    const rows = screen.getAllByRole('row');
    await user.click(rows[1]); // expand
    const deleteButtons = screen.getAllByRole('button', { name: /Eliminar/i });
    await user.click(deleteButtons[0]);

    // ConfirmDialog opens but we don't click confirm
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(mockUseFinance.deleteClosing).not.toHaveBeenCalled();
  });

  it('closes modal when clicking cancel', async () => {
    const user = userEvent.setup();
    render(<CierresPage />);

    await user.click(screen.getByText(/Nuevo Cierre/i));
    expect(screen.getByText('1. Información del Cierre')).toBeInTheDocument();

    await user.click(screen.getByText('Cancelar'));
    expect(screen.queryByText('1. Información del Cierre')).not.toBeInTheDocument();
  });

  it('displays error message when present', () => {
    (useFinance as Mock).mockReturnValue({
      ...mockUseFinance,
      error: 'Error al cargar cierres'
    });

    render(<CierresPage />);
    expect(screen.getByText('Error al cargar cierres')).toBeInTheDocument();
  });

  it('clears error message when clicking close', async () => {
    const user = userEvent.setup();
    (useFinance as Mock).mockReturnValue({
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

    await user.click(screen.getByText(/Nuevo Cierre/i));
    await user.click(screen.getByText('Siguiente'));
    await user.click(screen.getByText('Siguiente')); // To Methods Step

    const addButtons = screen.getAllByText('Añadir');
    await user.click(addButtons[0]);

    expect(screen.getByPlaceholderText('Terminal')).toBeInTheDocument();
  });

  it('adds otro medio row', async () => {
    const user = userEvent.setup();
    render(<CierresPage />);

    await user.click(screen.getByText(/Nuevo Cierre/i));
    await user.click(screen.getByText('Siguiente'));
    await user.click(screen.getByText('Siguiente')); // To Methods Step

    const addButtons = screen.getAllByText('Añadir');
    await user.click(addButtons[1]);

    expect(screen.getByText('Medio...')).toBeInTheDocument();
  });
});
