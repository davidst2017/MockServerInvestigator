import { ExpectationForward } from '../../types';

interface ForwardSectionProps {
  forward: ExpectationForward;
}

export function ForwardSection({ forward }: ForwardSectionProps) {
  const url = `${forward.scheme ?? 'http'}://${forward.host}${forward.port ? `:${forward.port}` : ''}`;

  return (
    <section className="detail-section">
      <h3 className="detail-heading">Forward</h3>
      <span className="detail-path">{url}</span>
    </section>
  );
}
