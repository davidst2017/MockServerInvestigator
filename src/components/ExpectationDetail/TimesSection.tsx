import { Expectation } from '../../types';

interface TimesSectionProps {
  times: NonNullable<Expectation['times']>;
}

export function TimesSection({ times }: TimesSectionProps) {
  const label = times.unlimited ? 'Unlimited' : `${times.remainingTimes ?? 0} remaining`;

  return (
    <section className="detail-section">
      <h3 className="detail-heading">Times</h3>
      <span className="detail-path">{label}</span>
    </section>
  );
}
