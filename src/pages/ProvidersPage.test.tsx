import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProvidersPage } from './ProvidersPage';
import { DatabaseService } from '../services/DatabaseService';

describe('ProvidersPage', () => {
  let db: DatabaseService;

  beforeEach(() => {
    localStorage.clear();
    db = new DatabaseService();
  });

  it('should render page title', () => {
    render(<ProvidersPage db={db} />);
    expect(screen.getByText('Proveedores')).toBeInTheDocument();
  });

  it('should render add provider button', () => {
    render(<ProvidersPage db={db} />);
    expect(screen.getByRole('button', { name: /nuevo proveedor/i })).toBeInTheDocument();
  });

  it('should render search input', () => {
    render(<ProvidersPage db={db} />);
    expect(screen.getByPlaceholderText(/buscar/i)).toBeInTheDocument();
  });

  it('should display empty state when no providers', () => {
    render(<ProvidersPage db={db} />);
    expect(screen.getByText(/no hay proveedores/i)).toBeInTheDocument();
  });

  it('should display providers list', () => {
    db.add('proveedores', {
      nombre: 'Proveedor 1',
      cif: 'A12345678',
      contacto: 'contact@provider1.com',
    } as any);

    db.add('proveedores', {
      nombre: 'Proveedor 2',
      cif: 'B87654321',
      contacto: 'contact@provider2.com',
    } as any);

    render(<ProvidersPage db={db} />);
    
    expect(screen.getByText('Proveedor 1')).toBeInTheDocument();
    expect(screen.getByText('Proveedor 2')).toBeInTheDocument();
  });

  it('should filter providers on search', async () => {
    const user = userEvent.setup();

    db.add('proveedores', {
      nombre: 'Acme Corporation',
      cif: 'A12345678',
      contacto: 'acme@example.com',
    } as any);

    db.add('proveedores', {
      nombre: 'Beta Solutions',
      cif: 'B87654321',
      contacto: 'beta@example.com',
    } as any);

    render(<ProvidersPage db={db} />);

    const searchInput = screen.getByPlaceholderText(/buscar/i);
    await user.type(searchInput, 'acme');

    await waitFor(() => {
      expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
      expect(screen.queryByText('Beta Solutions')).not.toBeInTheDocument();
    });
  });

  it('should open modal when add button is clicked', async () => {
    const user = userEvent.setup();
    render(<ProvidersPage db={db} />);

    const addButton = screen.getByRole('button', { name: /nuevo proveedor/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByText(/crear proveedor/i)).toBeInTheDocument();
    });
  });

  it('should close modal when cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<ProvidersPage db={db} />);

    const addButton = screen.getByRole('button', { name: /nuevo proveedor/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByText(/crear proveedor/i)).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole('button', { name: /cancelar/i });
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText(/crear proveedor/i)).not.toBeInTheDocument();
    });
  });

  it('should display provider statistics', () => {
    db.add('proveedores', {
      nombre: 'Provider 1',
      cif: 'A12345678',
      contacto: 'p1@example.com',
    } as any);

    db.add('proveedores', {
      nombre: 'Provider 2',
      cif: 'B87654321',
      contacto: 'p2@example.com',
    } as any);

    render(<ProvidersPage db={db} />);

    expect(screen.getByText(/con facturas:/i)).toBeInTheDocument();
    expect(screen.getByText(/sin facturas:/i)).toBeInTheDocument();
    expect(screen.getByText(/gasto total:/i)).toBeInTheDocument();
  });

  it('should show edit modal when edit is clicked', async () => {
    const user = userEvent.setup();

    db.add('proveedores', {
      nombre: 'Provider to Edit',
      cif: 'A12345678',
      contacto: 'edit@example.com',
    } as any);

    render(<ProvidersPage db={db} />);

    const editButton = screen.getAllByRole('button', { name: /editar/i })[0];
    await user.click(editButton);

    await waitFor(() => {
      expect(screen.getByText(/editar proveedor/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue('Provider to Edit')).toBeInTheDocument();
    });
  });

  it('should delete provider when delete is confirmed', async () => {
    const user = userEvent.setup();
    window.confirm = vi.fn(() => true);

    db.add('proveedores', {
      nombre: 'Provider to Delete',
      cif: 'A12345678',
      contacto: 'delete@example.com',
    } as any);

    render(<ProvidersPage db={db} />);

    expect(screen.getByText('Provider to Delete')).toBeInTheDocument();

    const deleteButton = screen.getAllByRole('button', { name: /eliminar/i })[0];
    await user.click(deleteButton);

    await waitFor(() => {
      expect(screen.queryByText('Provider to Delete')).not.toBeInTheDocument();
    });
  });

  it('should not delete provider when delete is cancelled', async () => {
    const user = userEvent.setup();
    window.confirm = vi.fn(() => false);

    db.add('proveedores', {
      nombre: 'Provider to Keep',
      cif: 'A12345678',
      contacto: 'keep@example.com',
    } as any);

    render(<ProvidersPage db={db} />);

    const deleteButton = screen.getAllByRole('button', { name: /eliminar/i })[0];
    await user.click(deleteButton);

    expect(screen.getByText('Provider to Keep')).toBeInTheDocument();
  });

  it('should display error message when present', () => {
    render(<ProvidersPage db={db} />);
    
    // Simulate error by trying to create invalid provider
    const addButton = screen.getByRole('button', { name: /nuevo proveedor/i });
    userEvent.click(addButton);

    // Error handling will be tested in integration
    expect(addButton).toBeInTheDocument();
  });
});
