import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from './Card';

describe('Card', () => {
  it('should render children', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText(/card content/i)).toBeInTheDocument();
  });

  it('should render with title', () => {
    render(<Card title="Card Title">Content</Card>);
    expect(screen.getByText(/card title/i)).toBeInTheDocument();
  });

  it('should render with footer', () => {
    render(<Card footer={<div>Footer content</div>}>Content</Card>);
    expect(screen.getByText(/footer content/i)).toBeInTheDocument();
  });

  it('should accept custom className', () => {
    render(<Card className="custom-card">Content</Card>);
    const card = screen.getByText(/content/i).closest('.card');
    expect(card).toHaveClass('custom-card');
  });

  it('should render elevated variant', () => {
    render(<Card variant="elevated">Content</Card>);
    const card = screen.getByText(/content/i).closest('.card');
    expect(card).toHaveClass('card-elevated');
  });

  it('should render outlined variant', () => {
    render(<Card variant="outlined">Content</Card>);
    const card = screen.getByText(/content/i).closest('.card');
    expect(card).toHaveClass('card-outlined');
  });

  it('should render as clickable', () => {
    render(<Card clickable>Content</Card>);
    const card = screen.getByText(/content/i).closest('.card');
    expect(card).toHaveClass('card-clickable');
  });

  it('should render with padding', () => {
    render(<Card padding="large">Content</Card>);
    const card = screen.getByText(/content/i).closest('.card');
    expect(card).toHaveClass('card-padding-large');
  });

  it('should render without padding', () => {
    render(<Card padding="none">Content</Card>);
    const card = screen.getByText(/content/i).closest('.card');
    expect(card).toHaveClass('card-padding-none');
  });
});
