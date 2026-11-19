interface TableProps {
  headers: string[];
  rows: React.ReactNode[][];
  emptyMessage?: string;
}

export function Table({ headers, rows, emptyMessage = "Aucune donnée." }: TableProps) {
  if (rows.length === 0) {
    return <p className="py-8 text-center text-body text-foreground-muted">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-card border border-border bg-surface shadow-card">
      <table className="w-full text-left text-small">
        <thead className="border-b border-border bg-surface-alt">
          <tr>
            {headers.map((h, i) => (
              <th key={i} scope="col" className="px-4 py-3 font-semibold text-foreground">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((cells, ri) => (
            <tr key={ri} className="transition-colors duration-fast hover:bg-surface-alt">
              {cells.map((cell, ci) => (
                <td key={ci} className="px-4 py-3 text-foreground">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
