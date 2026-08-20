import type { ReactNode } from 'react'

export interface DataColumn<T> {
  id: string
  header: string
  render: (row: T) => ReactNode
}

export function DataTable<T extends { id: string }>({ label, columns, rows, emptyMessage = 'No data available' }: { label: string; columns: DataColumn<T>[]; rows: T[]; emptyMessage?: string }) {
  return (
    <div className="table-container">
      <table className="data-table">
        <caption className="sr-only">{label}</caption>
        <thead><tr>{columns.map((column) => <th key={column.id} scope="col">{column.header}</th>)}</tr></thead>
        <tbody>
          {rows.length ? rows.map((row) => <tr key={row.id}>{columns.map((column) => <td key={column.id}>{column.render(row)}</td>)}</tr>) : <tr><td colSpan={columns.length}>{emptyMessage}</td></tr>}
        </tbody>
      </table>
    </div>
  )
}
