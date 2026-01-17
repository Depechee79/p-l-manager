import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OCRPage } from '../pages/OCRPage';
import { OCRService } from '../services/ocr-service';
import * as Hooks from '../hooks';

// Mock OCRService
vi.mock('../services/ocr-service', () => ({
  OCRService: {
    extractPDFText: vi.fn(),
    processImage: vi.fn(),
    parseOCRText: vi.fn()
  }
}));

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-url');

describe('OCRPage Flow', () => {
  const mockDbAdd = vi.fn();
  const mockDb = {
    facturas: [],
    albaranes: [],
    cierres: [],
    proveedores: [
      { id: 1, nombre: 'Existing Provider', cif: 'B12345678' }
    ],
    add: mockDbAdd
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock useDatabase
    vi.spyOn(Hooks, 'useDatabase').mockReturnValue({
      db: mockDb as any,
      loading: false,
      error: null,
      refresh: vi.fn()
    });
  });

  it('completes the full scanning flow for a PDF invoice', async () => {
    render(<OCRPage />);

    // 1. Start Wizard
    const scanButton = screen.getByText(/Escanear Documento/i);
    fireEvent.click(scanButton);

    expect(screen.getByText(/Selecciona el tipo de documento/i)).toBeInTheDocument();

    // 2. Select Type (Factura)
    const facturaButton = screen.getByText('Factura').closest('button');
    fireEvent.click(facturaButton!);

    expect(screen.getByText(/Sube tu Factura/i)).toBeInTheDocument();

    // 3. Upload File
    const file = new File(['dummy content'], 'test-invoice.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText(/Haz clic para subir/i);
    
    // Mock OCR Service responses
    (OCRService.extractPDFText as any).mockResolvedValue({
      text: 'FACTURA 12345',
      zones: {}
    });
    (OCRService.parseOCRText as any).mockReturnValue({
      numero: '12345',
      fecha: '2023-11-23',
      proveedor: 'Test Provider',
      total: 100.50,
      baseImponible: 80,
      iva: 20.50
    });

    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });

    // Verify UI update (Upload box hidden, Analyze button shown)
    expect(screen.queryByText(/Haz clic para subir/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Documento Listo/i)).toBeInTheDocument();
    
    const analyzeButton = screen.getByText(/Analizar Documento/i);
    expect(analyzeButton).toBeInTheDocument();

    // 4. Analyze
    await act(async () => {
      fireEvent.click(analyzeButton);
    });

    // Should go to Step 3 (Analyzing) then Step 4 (Review)
    // We wait for Step 4
    await waitFor(() => {
      expect(screen.getByText(/Revisión de Datos/i)).toBeInTheDocument();
    });

    // Verify Data in Inputs
    expect(screen.getByDisplayValue('12345')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Provider')).toBeInTheDocument();
    expect(screen.getByDisplayValue('100.5')).toBeInTheDocument();

    // 5. Validate
    const validateButton = screen.getByText(/Aceptar y Validar/i);
    fireEvent.click(validateButton);

    // Should go to Step 5 (Validation)
    // Since 'Test Provider' is not in mockDb.proveedores, it should show "Nuevo Proveedor"
    await waitFor(() => {
      expect(screen.getByText(/Nuevo Proveedor Detectado/i)).toBeInTheDocument();
    });

    // 6. Save
    const saveButton = screen.getByText(/Confirmar y Guardar/i);
    
    // Mock db.add to return an object with id
    mockDbAdd.mockReturnValue({ id: 999 });

    await act(async () => {
      fireEvent.click(saveButton);
    });

    // Verify Save
    expect(mockDbAdd).toHaveBeenCalledTimes(2); // 1 for Provider, 1 for Invoice
    expect(mockDbAdd).toHaveBeenCalledWith('proveedores', expect.objectContaining({
      nombre: 'Test Provider'
    }));
    expect(mockDbAdd).toHaveBeenCalledWith('facturas', expect.objectContaining({
      numeroFactura: '12345',
      total: 100.50,
      tipo: 'factura'
    }));

    // Should return to list
    await waitFor(() => {
      expect(screen.getByText(/Documentos/i)).toBeInTheDocument();
      expect(screen.queryByText(/Asistente de Escaneo/i)).not.toBeInTheDocument();
    });
  });
});
