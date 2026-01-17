import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingState } from './LoadingState';

describe('LoadingState', () => {
    describe('Spinner variant', () => {
        it('should render spinner by default', () => {
            render(<LoadingState />);
            expect(screen.getByTestId('loading-state')).toBeInTheDocument();
            expect(screen.getByTestId('loading-state')).toHaveClass('loading-spinner');
        });

        it('should render spinner with custom size', () => {
            render(<LoadingState size="lg" data-testid="spinner" />);
            const spinner = screen.getByTestId('spinner');
            const svg = spinner.querySelector('svg');
            expect(svg).toHaveAttribute('width', '36');
        });
    });

    describe('Skeleton variant', () => {
        it('should render skeleton placeholder', () => {
            render(<LoadingState variant="skeleton" />);
            expect(screen.getByTestId('loading-state')).toHaveClass('loading-skeleton');
        });

        it('should render multiple skeleton lines', () => {
            render(<LoadingState variant="skeleton" lines={3} />);
            const container = screen.getByTestId('loading-state');
            expect(container.children.length).toBe(3);
        });

        it('should apply custom dimensions', () => {
            render(<LoadingState variant="skeleton" width="200px" height="40px" />);
            const skeleton = screen.getByTestId('loading-state').firstChild as HTMLElement;
            expect(skeleton).toHaveStyle({ width: '200px', height: '40px' });
        });
    });

    describe('Overlay variant', () => {
        it('should render overlay with text', () => {
            render(<LoadingState variant="overlay" text="Loading data..." />);
            expect(screen.getByText('Loading data...')).toBeInTheDocument();
        });

        it('should render overlay with fixed position', () => {
            render(<LoadingState variant="overlay" />);
            expect(screen.getByTestId('loading-state')).toHaveStyle({ position: 'fixed' });
        });
    });

    it('should accept custom className', () => {
        render(<LoadingState className="custom-loader" />);
        expect(screen.getByTestId('loading-state')).toHaveClass('custom-loader');
    });

    it('should accept custom id', () => {
        render(<LoadingState id="my-loader" />);
        expect(document.getElementById('my-loader')).toBeInTheDocument();
    });
});
