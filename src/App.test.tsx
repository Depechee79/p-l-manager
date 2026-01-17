import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    // Set initial route to root
    window.history.pushState({}, '', '/');
  });

  it('renders layout with navigation', () => {
    render(<App />);
    
    expect(screen.getAllByText(/P&L Manager/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText('Proveedores')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Inventario')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Facturas')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Cierres')[0]).toBeInTheDocument();
  });

  it('navigates to Proveedores page', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Click on nav link (first occurrence), not welcome page card
    await user.click(screen.getAllByText('Proveedores')[0]);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Proveedores', level: 1 })).toBeInTheDocument();
    });
  });

  it('navigates to Inventario page', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getAllByText('Inventario')[0]);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Inventario', level: 1 })).toBeInTheDocument();
    });
  });

  it('navigates to Facturas page', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getAllByText('Facturas')[0]);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Gestión de Facturas', level: 1 })).toBeInTheDocument();
    });
  });

  it('navigates to Cierres page', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getAllByText('Cierres')[0]);

    await waitFor(() => {
      expect(screen.getByText('Gestión de Cierres de Caja')).toBeInTheDocument();
    });
  });

  it('displays welcome page on root route', () => {
    render(<App />);
    
    expect(screen.getByText(/Bienvenido a P&L Manager/i)).toBeInTheDocument();
  });

  it('persists and displays user session', () => {
    localStorage.setItem('app_user', JSON.stringify({ name: 'Test User' }));
    
    render(<App />);
    
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('allows user logout', async () => {
    localStorage.setItem('app_user', JSON.stringify({ name: 'Test User' }));
    const user = userEvent.setup();
    
    render(<App />);
    
    expect(screen.getByText('Test User')).toBeInTheDocument();
    
    await user.click(screen.getByText('Cerrar Sesión'));
    
    await waitFor(() => {
      expect(screen.queryByText('Test User')).not.toBeInTheDocument();
      expect(localStorage.getItem('app_user')).toBeNull();
    });
  });
});
