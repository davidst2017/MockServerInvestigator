function renderValues(values: unknown): string {
  if (Array.isArray(values))
    return values.map((v) => (typeof v === 'string' ? v : JSON.stringify(v))).join(', ');
  return typeof values === 'string' ? values : JSON.stringify(values);
}

interface KeyValueTableProps {
  data: Record<string, unknown>;
}

export function KeyValueTable({ data }: KeyValueTableProps) {
  if (Object.keys(data).length === 0) return null;
  return (
    <table className="detail-table">
      <tbody>
        {Object.entries(data).map(([key, values]) => (
          <tr key={key}>
            <td className="detail-table-key">{key}</td>
            <td className="detail-table-val">{renderValues(values)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
