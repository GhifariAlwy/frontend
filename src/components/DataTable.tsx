import type { ReactNode } from 'react';

export interface DataColumn<T> {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
}
export function DataTable<T extends { id?: number | string }>({
  columns,
  rows,
  empty = 'Tidak ada data.',
  actions,
}: {
  columns: DataColumn<T>[];
  rows: T[];
  empty?: string;
  actions?: (row: T) => ReactNode;
}): JSX.Element {
  return (
    <div className="table-responsive">
      <table className="table align-middle mb-0">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
            {actions && <th>Aksi</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={String(row.id ?? index)}>
              {columns.map((column) => (
                <td key={column.key}>
                  {column.render
                    ? column.render(row)
                    : String((row as Record<string, unknown>)[column.key] ?? '-')}
                </td>
              ))}
              {actions && <td>{actions(row)}</td>}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={columns.length + (actions ? 1 : 0)}
                className="text-center text-muted py-4"
              >
                {empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
