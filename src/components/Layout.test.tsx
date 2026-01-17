import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Layout } from './Layout';

// Helper component to display current route
const RouteDisplay = () => {
  const location = useLocation();
  return <div>Current Route: {location.pathname}</div>;
};

describe('Layout', () => {
  const renderLayout = () => {
    return render(
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout><div>Home Content</div></Layout>} />
          <Route path="/proveedores" element={<Layout><div>Proveedores Content</div></Layout>} />
          <Route path="/inventario" element={<Layout><div>Inventario Content</div></Layout>} />
          <Route path="/facturas" element={<Layout><div>Facturas Content</div></Layout>} />
          <Route path="/cierres" element={<Layout><div>Cierres Content</div></Layout>} />
        </Routes>
      </BrowserRouter>
    );
  };

  it('renders layout with header', () => {
    renderLayout();
    expect(screen.getByText(/P&L Manager/i)).toBeInTheDocument();
  });

  it('renders navigation menu with all links', () => {
    renderLayout();
    
    expect(screen.getByText('Proveedores')).toBeInTheDocument();
    expect(screen.getByText('Inventario')).toBeInTheDocument();
    expect(screen.getByText('Facturas')).toBeInTheDocument();
    expect(screen.getByText('Cierres')).toBeInTheDocument();
  });

  it('renders children content', () => {
    renderLayout();
    expect(screen.getByText('Home Content')).toBeInTheDocument();
  });

  it('navigates to Proveedores page when clicking link', async () => {
    const user = userEvent.setup();
    
    render(
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout><RouteDisplay /></Layout>} />
          <Route path="/proveedores" element={<Layout><RouteDisplay /></Layout>} />
        </Routes>
      </BrowserRouter>
    );

    const proveedoresLink = screen.getByText('Proveedores');
    await user.click(proveedoresLink);

    expect(screen.getByText('Current Route: /proveedores')).toBeInTheDocument();
  });

  it('navigates to Inventario page when clicking link', async () => {
    const user = userEvent.setup();
    const { MemoryRouter } = require('react-router-dom');
    
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<Layout><RouteDisplay /></Layout>} />
          <Route path="/inventario" element={<Layout><RouteDisplay /></Layout>} />
        </Routes>
      </MemoryRouter>
    );

    const inventarioLink = screen.getByText('Inventario');
    await user.click(inventarioLink);

    expect(screen.getByText('Current Route: /inventario')).toBeInTheDocument();
  });

  it('navigates to Facturas page when clicking link', async () => {
    const user = userEvent.setup();
    const { MemoryRouter } = require('react-router-dom');
    
    render(
      <MemoryRouter initialEntries={['/']}>        <Routes>
          <Route path="/" element={<Layout><RouteDisplay /></Layout>} />
          <Route path="/facturas" element={<Layout><RouteDisplay /></Layout>} />
        </Routes>
      </MemoryRouter>
    );

    const facturasLink = screen.getByText('Facturas');
    await user.click(facturasLink);

    expect(screen.getByText('Current Route: /facturas')).toBeInTheDocument();
  });

  it('navigates to Cierres page when clicking link', async () => {
    const user = userEvent.setup();
    const { MemoryRouter } = require('react-router-dom');
    
    render(
      <MemoryRouter initialEntries={['/']}>        <Routes>
          <Route path="/" element={<Layout><RouteDisplay /></Layout>} />
          <Route path="/cierres" element={<Layout><RouteDisplay /></Layout>} />
        </Routes>
      </MemoryRouter>
    );

    const cierresLink = screen.getByText('Cierres');
    await user.click(cierresLink);

    expect(screen.getByText('Current Route: /cierres')).toBeInTheDocument();
  });

  it('highlights active navigation link', () => {
    const { MemoryRouter } = require('react-router-dom');
    
    render(
      <MemoryRouter initialEntries={['/proveedores']}>
        <Routes>
          <Route path="/proveedores" element={<Layout><div>Proveedores Content</div></Layout>} />
        </Routes>
      </MemoryRouter>
    );

    const proveedoresLink = screen.getByText('Proveedores').closest('a');
    expect(proveedoresLink).toHaveStyle({ fontWeight: '600' });
  });

  it('displays user info in header when logged in', () => {
    const { MemoryRouter } = require('react-router-dom');
    
    render(
      <MemoryRouter initialEntries={['/']}>        <Routes>
          <Route path="/" element={<Layout user={{ name: 'John Doe' }}><div>Content</div></Layout>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('displays logout button when user is logged in', () => {
    const { MemoryRouter } = require('react-router-dom');
    const handleLogout = () => {};
    
    render(
      <MemoryRouter initialEntries={['/']}>        <Routes>
          <Route path="/" element={<Layout user={{ name: 'John Doe' }} onLogout={handleLogout}><div>Content</div></Layout>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Cerrar Sesión')).toBeInTheDocument();
  });

  it('calls onLogout when clicking logout button', async () => {
    const user = userEvent.setup();
    const { MemoryRouter } = require('react-router-dom');
    let logoutCalled = false;
    const handleLogout = () => { logoutCalled = true; };

    render(
      <MemoryRouter initialEntries={['/']}>        <Routes>
          <Route path="/" element={
            <Layout user={{ name: 'John Doe' }} onLogout={handleLogout}>
              <div>Content</div>
            </Layout>
          } />
        </Routes>
      </MemoryRouter>
    );

    await user.click(screen.getByText('Cerrar Sesión'));
    expect(logoutCalled).toBe(true);
  });
});
