import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormField } from './FormField';

describe('FormField', () => {
    it('should render children', () => {
        render(
            <FormField>
                <input data-testid="test-input" />
            </FormField>
        );
        expect(screen.getByTestId('test-input')).toBeInTheDocument();
    });

    it('should render label', () => {
        render(
            <FormField label="Username">
                <input />
            </FormField>
        );
        expect(screen.getByText('Username')).toBeInTheDocument();
    });

    it('should render required indicator', () => {
        render(
            <FormField label="Email" required>
                <input />
            </FormField>
        );
        expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should render error message', () => {
        render(
            <FormField error="This field is required">
                <input />
            </FormField>
        );
        expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('should render helper text when no error', () => {
        render(
            <FormField helperText="Enter your full name">
                <input />
            </FormField>
        );
        expect(screen.getByText('Enter your full name')).toBeInTheDocument();
    });

    it('should not render helper text when error is present', () => {
        render(
            <FormField error="Error message" helperText="Helper text">
                <input />
            </FormField>
        );
        expect(screen.getByText('Error message')).toBeInTheDocument();
        expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
    });

    it('should apply fullWidth style', () => {
        render(
            <FormField fullWidth data-testid="form-field">
                <input />
            </FormField>
        );
        const field = screen.getByTestId('form-field');
        expect(field).toHaveStyle({ width: '100%' });
    });

    it('should accept custom className', () => {
        render(
            <FormField className="custom-class" data-testid="form-field">
                <input />
            </FormField>
        );
        expect(screen.getByTestId('form-field')).toHaveClass('custom-class');
    });
});
