interface MethodBadgeProps {
  method: string;
}

export function MethodBadge({ method }: MethodBadgeProps) {
  return <span className={`badge badge-method badge-${method.toLowerCase()}`}>{method}</span>;
}

interface StatusBadgeProps {
  statusCode: number;
}

export function StatusBadge({ statusCode }: StatusBadgeProps) {
  return (
    <span className={`status-code status-${Math.floor(statusCode / 100)}xx`}>{statusCode}</span>
  );
}

interface MatchBadgeProps {
  matched: boolean;
}

export function MatchBadge({ matched }: MatchBadgeProps) {
  return (
    <span className={`badge ${matched ? 'badge-matched' : 'badge-unmatched'}`}>
      {matched ? 'MATCHED' : 'UNMATCHED'}
    </span>
  );
}
