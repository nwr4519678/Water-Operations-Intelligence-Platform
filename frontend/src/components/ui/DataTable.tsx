import type { ReactNode } from 'react';

export type DataColumn<T> = { key: string; header: string; render: (row: T) => ReactNode };

export function DataTable<T extends { id: string }>({ columns, rows, label }: { columns: DataColumn<T>[]; rows: T[]; label: string }) {
  return <div className="table-wrap"><table><caption className="sr-only">{label}</caption><thead><tr>{columns.map((column) => <th key={column.key} scope="col">{column.header}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.id}>{columns.map((column) => <td key={column.key}>{column.render(row)}</td>)}</tr>)}</tbody></table></div>;
}
