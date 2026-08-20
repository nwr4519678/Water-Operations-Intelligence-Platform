import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DataTable } from './DataTable';

describe('DataTable', () => {
  it('renders an accessible caption, headers, and rows', () => {
    render(<DataTable label="Stations" columns={[{ key: 'name', header: 'Station', render: (row) => row.name }]} rows={[{ id: 'st-1', name: 'River Pump' }]} />);
    expect(screen.getByRole('table', { name: 'Stations' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Station' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'River Pump' })).toBeInTheDocument();
  });
});
