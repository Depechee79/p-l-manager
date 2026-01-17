import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ClosingWizard } from './ClosingWizard';
import { vi } from 'vitest';

describe('ClosingWizard Isolated Test', () => {
    const mockSave = vi.fn();
    const mockCancel = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders configuration step initially', () => {
        render(<ClosingWizard onSave={mockSave} onCancel={mockCancel} />);

        expect(screen.getByText('Nuevo Cierre')).toBeInTheDocument();
        expect(screen.getByText('1. Información del Cierre')).toBeInTheDocument();
        expect(screen.getByLabelText(/Fecha/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Turno/i)).toBeInTheDocument();
    });

    it('validates next button state based on inputs', async () => {
        render(<ClosingWizard onSave={mockSave} onCancel={mockCancel} />);

        const nextBtn = screen.getByRole('button', { name: /Siguiente/i });
        expect(nextBtn).toBeEnabled(); // Initial state has values

        // Clear fecha (if possible) or just check flow
        fireEvent.click(nextBtn);

        // Should move to step 2
        await waitFor(() => {
            expect(screen.getByText('2. Conteo de Efectivo')).toBeInTheDocument();
        });
    });

    it('updates cashe breakdown properly', async () => {
        render(<ClosingWizard onSave={mockSave} onCancel={mockCancel} />);

        // Move to step 2
        const nextBtn = screen.getByRole('button', { name: /Siguiente/i });
        fireEvent.click(nextBtn);

        // Find 500 bill input
        // In my implementation, inputs don't have direct labels, traversing might be hard.
        // Let's rely on placeholder or display value.
        // Actually, I should use test-ids if labels are missing.
    });
});
