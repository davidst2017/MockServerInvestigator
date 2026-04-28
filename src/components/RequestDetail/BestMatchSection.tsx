import { Expectation, MockServerRequest } from '../../types';
import { ForwardSection } from '../ExpectationDetail/ForwardSection';
import { RequestMatcherSection } from '../ExpectationDetail/RequestMatcherSection';
import { ResponseSection } from '../ExpectationDetail/ResponseSection';
import { TimesSection } from '../ExpectationDetail/TimesSection';
import { getMismatchedConditions, MatchedCondition } from '../../utils';

interface BestMatchSectionProps {
  request: MockServerRequest;
  expectation: Expectation;
}

function MismatchRow({ condition }: { condition: MatchedCondition }) {
  return (
    <div className="matched-condition-row">
      <span className="matched-condition-label">{condition.label}</span>
      {condition.isCode ? (
        <pre className="mismatch-condition-snippet">{condition.value}</pre>
      ) : (
        <span className="mismatch-condition-value">{condition.value}</span>
      )}
    </div>
  );
}

export function BestMatchSection({ request, expectation }: BestMatchSectionProps) {
  const mismatches = getMismatchedConditions(request, expectation);

  return (
    <div className="best-match-wrapper">
      <div className="best-match-header">
        <span className="best-match-label">Closest Expectation</span>
        {expectation.id && <span className="best-match-id">{expectation.id}</span>}
      </div>

      {mismatches.length > 0 && (
        <section className="detail-section mismatch-section">
          <div className="detail-label">Why it didn't match</div>
          <div className="matched-conditions-list">
            {mismatches.map((c) => (
              <MismatchRow key={c.label} condition={c} />
            ))}
          </div>
        </section>
      )}

      <RequestMatcherSection request={expectation.httpRequest} />
      {expectation.httpResponse && <ResponseSection response={expectation.httpResponse} />}
      {expectation.httpForward && <ForwardSection forward={expectation.httpForward} />}
      {expectation.times && <TimesSection times={expectation.times} />}
    </div>
  );
}
