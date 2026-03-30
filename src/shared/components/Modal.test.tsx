import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from './Modal';

describe('Modal', () => {
  it('should not render when open is false', () => {
    render(
      <Modal open={false} onClose={() => { }}>
        Modal content
      </Modal>
    );
    expect(screen.queryByText(/modal content/i)).not.toBeInTheDocument();
  });

  it('should render when open is true', () => {
    render(
      <Modal open={true} onClose={() => { }}>
        Modal content
      </Modal>
    );
    expect(screen.getByText(/modal content/i)).toBeInTheDocument();
  });

  it('should render with title', () => {
    render(
      <Modal open={true} title="Modal Title" onClose={() => { }}>
        Content
      </Modal>
    );
    expect(screen.getByText(/modal title/i)).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();

    render(
      <Modal open={true} onClose={handleClose}>
        Content
      </Modal>
    );

    const closeButton = screen.getByRole('button', { name: /cerrar/i });
    await user.click(closeButton);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when overlay is clicked', async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();

    render(
      <Modal open={true} onClose={handleClose}>
        Content
      </Modal>
    );

    const overlay = screen.getByTestId('modal-overlay');
    await user.click(overlay);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('should not call onClose when content is clicked', async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();

    render(
      <Modal open={true} onClose={handleClose}>
        Content
      </Modal>
    );

    const content = screen.getByText(/content/i);
    await user.click(content);
    expect(handleClose).not.toHaveBeenCalled();
  });

  it('should render footer', () => {
    render(
      <Modal
        open={true}
        onClose={() => { }}
        footer={<button>Save</button>}
      >
        Content
      </Modal>
    );
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });

  it('should render different sizes', () => {
    const { rerender } = render(
      <Modal open={true} size="sm" onClose={() => { }}>
        Content
      </Modal>
    );
    let modal = screen.getByText(/content/i).closest('.modal-content');
    expect(modal).toHaveClass('modal-small');

    rerender(
      <Modal open={true} size="lg" onClose={() => { }}>
        Content
      </Modal>
    );
    modal = screen.getByText(/content/i).closest('.modal-content');
    expect(modal).toHaveClass('modal-large');
  });

  it('should not close on overlay click when closeOnOverlayClick is false', async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();

    render(
      <Modal open={true} onClose={handleClose} closeOnOverlayClick={false}>
        Content
      </Modal>
    );

    const overlay = screen.getByTestId('modal-overlay');
    await user.click(overlay);
    expect(handleClose).not.toHaveBeenCalled();
  });

  it('should not render close button when showCloseButton is false', () => {
    render(
      <Modal open={true} onClose={() => { }} showCloseButton={false}>
        Content
      </Modal>
    );
    expect(screen.queryByRole('button', { name: /cerrar/i })).not.toBeInTheDocument();
  });
});
