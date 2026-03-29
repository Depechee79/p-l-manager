import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProvidersPage } from './ProvidersPage';
import type { Provider } from '@types';

// Mock hooks
vi.mock('@core', () => ({
  useDatabase: vi.fn(() => ({
    db: {
      ensureLoaded: vi.fn().mockResolvedValue(undefined),
      proveedores: [],
    }
  }))
}));

vi.mock('@hooks', () => ({
  useProviders: vi.fn()
}));

vi.mock('../utils/toast', () => ({
  useToast: vi.fn(() => ({
    showToast: vi.fn(),
  }))
}));

vi.mock('@core/services/LoggerService', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }
}));

// Mock feature components to isolate page-level behavior
vi.mock('@/features/providers', () => ({
  ProvidersList: vi.fn(({ providers, loading, onEdit, onDelete, onNew }: {
    providers: Provider[];
    loading: boolean;
    onEdit: (provider: Provider) => void;
    onDelete: (provider: Provider) => void;
    onNew: () => void;
  }) => (
    <div data-testid="providers-list">
      <button type="button" onClick={onNew}>Nuevo Proveedor</button>
      {loading && <span>Cargando...</span>}
      {!loading && providers.length === 0 && <span>No hay proveedores</span>}
      {providers.map((p) => (
        <div key={p.id} data-testid={`provider-${p.id}`}>
          <span>{p.nombre}</span>
          <button type="button" onClick={() => onEdit(p)}>Editar</button>
          <button type="button" onClick={() => onDelete(p)}>Eliminar</button>
        </div>
      ))}
    </div>
  )),
  ProviderForm: vi.fn(({ onCancel }: { onCancel: () => void }) => (
    <div data-testid="provider-form">
      <span>Formulario Proveedor</span>
      <button type="button" onClick={onCancel}>Cancelar</button>
    </div>
  )),
}));

import { useProviders } from '@hooks';

describe('ProvidersPage', () => {
  const mockProviders: Provider[] = [
    {
      id: 1,
      nombre: 'Proveedor 1',
      cif: 'A12345678',
      contacto: 'contact@provider1.com',
    } as Provider,
    {
      id: 2,
      nombre: 'Proveedor 2',
      cif: 'B87654321',
      contacto: 'contact@provider2.com',
    } as Provider,
  ];

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
    stats: { total: 2, withInvoices: 0, withoutInvoices: 2, totalSpent: 0 },
    setError: vi.fn(),
    clearError: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (vi.mocked(useProviders)).mockReturnValue(mockUseProviders);
  });

  it('should render providers list', () => {
    render(<ProvidersPage />);
    expect(screen.getByTestId('providers-list')).toBeInTheDocument();
  });

  it('should render add provider button', () => {
    render(<ProvidersPage />);
    expect(screen.getByText('Nuevo Proveedor')).toBeInTheDocument();
  });

  it('should display empty state when no providers', () => {
    (vi.mocked(useProviders)).mockReturnValue({
      ...mockUseProviders,
      filteredProviders: [],
    });

    render(<ProvidersPage />);
    expect(screen.getByText('No hay proveedores')).toBeInTheDocument();
  });

  it('should display providers list', () => {
    render(<ProvidersPage />);
    expect(screen.getByText('Proveedor 1')).toBeInTheDocument();
    expect(screen.getByText('Proveedor 2')).toBeInTheDocument();
  });

  it('should switch to form view when add button is clicked', async () => {
    const user = userEvent.setup();
    render(<ProvidersPage />);

    await user.click(screen.getByText('Nuevo Proveedor'));

    expect(screen.getByTestId('provider-form')).toBeInTheDocument();
  });

  it('should return to list view when cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<ProvidersPage />);

    await user.click(screen.getByText('Nuevo Proveedor'));
    expect(screen.getByTestId('provider-form')).toBeInTheDocument();

    await user.click(screen.getByText('Cancelar'));
    expect(screen.getByTestId('providers-list')).toBeInTheDocument();
  });

  it('should switch to edit form when edit is clicked', async () => {
    const user = userEvent.setup();
    render(<ProvidersPage />);

    const editButtons = screen.getAllByText('Editar');
    await user.click(editButtons[0]);

    expect(screen.getByTestId('provider-form')).toBeInTheDocument();
  });

  it('should delete provider when confirmed', async () => {
    const user = userEvent.setup();

    render(<ProvidersPage />);

    const deleteButtons = screen.getAllByText('Eliminar');
    await user.click(deleteButtons[0]);

    // ConfirmDialog opens — click the confirm button inside it
    const confirmDialog = screen.getByRole('alertdialog');
    const confirmButton = within(confirmDialog).getByText('Eliminar');
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockUseProviders.deleteProvider).toHaveBeenCalledWith(1);
    });
  });

  it('should not delete provider when cancelled', async () => {
    const user = userEvent.setup();

    render(<ProvidersPage />);

    const deleteButtons = screen.getAllByText('Eliminar');
    await user.click(deleteButtons[0]);

    // ConfirmDialog opens but we don't click confirm
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(mockUseProviders.deleteProvider).not.toHaveBeenCalled();
  });

  it('should display error message when present', () => {
    (vi.mocked(useProviders)).mockReturnValue({
      ...mockUseProviders,
      error: 'Error al cargar proveedores',
    });

    render(<ProvidersPage />);
    expect(screen.getByText('Error al cargar proveedores')).toBeInTheDocument();
  });
});
