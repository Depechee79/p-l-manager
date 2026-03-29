import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Table } from './Table';

interface TestData {
  id: number;
  name: string;
  age: number;
  email: string;
}

describe('Table', () => {
  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'age', header: 'Age' },
    { key: 'email', header: 'Email' },
  ];

  const data: TestData[] = [
    { id: 1, name: 'John Doe', age: 30, email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', age: 25, email: 'jane@example.com' },
    { id: 3, name: 'Bob Johnson', age: 35, email: 'bob@example.com' },
  ];

  it('should render table headers', () => {
    render(<Table columns={columns} data={data} />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Age')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('should render table data', () => {
    render(<Table columns={columns} data={data} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('should render empty state when no data', () => {
    render(<Table columns={columns} data={[]} emptyText="No data found" />);
    expect(screen.getByText(/no data found/i)).toBeInTheDocument();
  });

  it('should call onRowClick when row is clicked', async () => {
    const handleRowClick = vi.fn();
    const user = userEvent.setup();

    render(<Table columns={columns} data={data} onRowClick={handleRowClick} />);

    const firstRow = screen.getByText('John Doe').closest('tr');
    await user.click(firstRow!);
    expect(handleRowClick).toHaveBeenCalledWith(data[0]);
  });

  it('should render custom cell with render function', () => {
    const customColumns = [
      {
        key: 'name',
        header: 'Name',
        render: (value: string) => <strong>{value}</strong>,
      },
    ];

    render(<Table columns={customColumns} data={data} />);
    const nameCell = screen.getByText('John Doe');
    expect(nameCell.tagName).toBe('STRONG');
  });

  it('should apply hoverable class when hoverable is true', () => {
    render(<Table columns={columns} data={data} hoverable />);
    const table = screen.getByRole('table');
    expect(table.className).toContain('[&_tbody_tr]:hover:bg-surface-muted');
  });

  it('should apply striped class when striped is true', () => {
    render(<Table columns={columns} data={data} striped />);
    const table = screen.getByRole('table');
    expect(table.className).toContain('[&_tbody_tr:nth-child(even)]');
  });

  it('should render loading state', () => {
    render(<Table columns={columns} data={data} loading />);
    expect(screen.getByText(/cargando/i)).toBeInTheDocument();
  });

  it('should support sortable columns', async () => {
    const handleSort = vi.fn();
    const user = userEvent.setup();

    const sortableColumns = [
      { key: 'name', header: 'Name', sortable: true },
      { key: 'age', header: 'Age', sortable: true },
    ];

    render(
      <Table columns={sortableColumns} data={data} onSort={handleSort} />
    );

    const nameHeader = screen.getByText('Name');
    await user.click(nameHeader);
    expect(handleSort).toHaveBeenCalledWith('name', 'asc');
  });

  it('should render actions column', () => {
    const handleEdit = vi.fn();
    const handleDelete = vi.fn();

    const actionsColumn = [
      ...columns,
      {
        key: 'actions',
        header: 'Actions',
        render: (_: unknown, row: TestData) => (
          <div>
            <button onClick={() => handleEdit(row)}>Edit</button>
            <button onClick={() => handleDelete(row)}>Delete</button>
          </div>
        ),
      },
    ];

    render(<Table columns={actionsColumn} data={data} />);
    expect(screen.getAllByText('Edit')).toHaveLength(3);
    expect(screen.getAllByText('Delete')).toHaveLength(3);
  });
});
