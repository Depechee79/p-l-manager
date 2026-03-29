import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OCRPage } from '../pages/OCRPage';

// Mock the hooks used by OCRPage
vi.mock('../hooks', () => ({
  useDatabase: vi.fn().mockReturnValue({
    db: {
      facturas: [],
      albaranes: [],
      cierres: [],
      nominas: [],
      proveedores: [
        { id: 1, nombre: 'Existing Provider', cif: 'B12345678' },
      ],
      syncFromCloud: vi.fn().mockResolvedValue(undefined),
      add: vi.fn().mockResolvedValue({ id: 999 }),
      delete: vi.fn(),
    },
  }),
}));

// Mock toast
vi.mock('../utils/toast', () => ({
  useToast: vi.fn().mockReturnValue({
    showToast: vi.fn(),
  }),
}));

// Mock formatters
vi.mock('../utils/formatters', () => ({
  formatDate: vi.fn((d: unknown) => String(d || '')),
  formatCurrency: vi.fn((n: unknown) => String(n || '0')),
}));

// Mock LoggerService
vi.mock('@core/services/LoggerService', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// Mock the OCR feature components to simplify testing
vi.mock('../features/ocr', () => ({
  OCRDocumentList: ({ onNewDocument, documents }: {
    onNewDocument: () => void;
    documents: unknown[];
  }) => (
    <div data-testid="ocr-document-list">
      <span>Documentos ({documents.length})</span>
      <button onClick={onNewDocument}>Escanear Documento</button>
    </div>
  ),
  OCRDocumentDetail: () => <div data-testid="ocr-document-detail">Detail</div>,
  OCRWizard: ({ onComplete, onCancel }: {
    onComplete: () => void;
    onCancel: () => void;
  }) => (
    <div data-testid="ocr-wizard">
      <span>Asistente de Escaneo</span>
      <button onClick={onCancel}>Cancelar</button>
      <button onClick={onComplete}>Completar</button>
    </div>
  ),
}));

// Mock shared components
vi.mock('@shared/components', () => ({
  PageContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ConfirmDialog: () => null,
}));

describe('OCRPage Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the document list view by default', async () => {
    render(<OCRPage />);

    await waitFor(() => {
      expect(screen.getByTestId('ocr-document-list')).toBeInTheDocument();
    });

    expect(screen.getByText(/Documentos/)).toBeInTheDocument();
  });

  it('opens the scanning wizard when clicking the scan button', async () => {
    render(<OCRPage />);

    await waitFor(() => {
      expect(screen.getByText('Escanear Documento')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Escanear Documento'));

    await waitFor(() => {
      expect(screen.getByTestId('ocr-wizard')).toBeInTheDocument();
      expect(screen.getByText('Asistente de Escaneo')).toBeInTheDocument();
    });
  });
});
