import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './Input';

describe('Input', () => {
  it('should render input field', () => {
    render(<Input />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should render with label', () => {
    render(<Input label="Name" />);
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
  });

  it('should render with placeholder', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText(/enter text/i)).toBeInTheDocument();
  });

  it('should handle value changes', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(<Input onChange={handleChange} />);
    const input = screen.getByRole('textbox');

    await user.type(input, 'Hello');
    expect(handleChange).toHaveBeenCalled();
  });

  it('should render with initial value', () => {
    render(<Input value="Initial value" onChange={() => { }} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('Initial value');
  });

  it('should render as disabled', () => {
    render(<Input disabled />);
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('should render with error message', () => {
    render(<Input error="This field is required" />);
    expect(screen.getByText(/this field is required/i)).toBeInTheDocument();
  });

  it('should apply error styles when error exists', () => {
    render(<Input error="Error message" />);
    const input = screen.getByRole('textbox');
    // Component uses CSS class for error styling
    expect(input).toHaveClass('input-field-error');
  });

  it('should render different input types', () => {
    const { rerender } = render(<Input type="email" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');

    rerender(<Input type="password" />);
    const passwordInput = document.querySelector('input[type="password"]');
    expect(passwordInput).toBeInTheDocument();

    rerender(<Input type="number" />);
    expect(screen.getByRole('spinbutton')).toBeInTheDocument();
  });

  it('should render with helper text', () => {
    render(<Input helperText="Enter your full name" />);
    expect(screen.getByText(/enter your full name/i)).toBeInTheDocument();
  });

  it('should render required indicator', () => {
    render(<Input label="Name" required />);
    const input = screen.getByRole('textbox');
    expect(input).toBeRequired();
  });

  it('should accept custom className on container', () => {
    render(<Input className="custom-input" />);
    // className is applied to container, not directly to input
    const container = screen.getByRole('textbox').closest('.input-container');
    expect(container).toHaveClass('custom-input');
  });

  it('should render fullWidth input', () => {
    render(<Input fullWidth />);
    const container = screen.getByRole('textbox').closest('.input-container');
    expect(container).toHaveClass('input-full-width');
  });
});
