import { Expectation, MockServerRequest } from '../../types';
import { ForwardSection } from '../ExpectationDetail/ForwardSection';
import { RequestMatcherSection } from '../ExpectationDetail/RequestMatcherSection';
import { ResponseSection } from '../ExpectationDetail/ResponseSection';
import { TimesSection } from '../ExpectationDetail/TimesSection';
import { getMatchedConditions, MatchedCondition } from '../../utils';

interface MatchedConditionsSectionProps {
  request: MockServerRequest;
  expectation: Expectation;
}

function ConditionRow({ condition }: { condition: MatchedCondition }) {
  return (
    <div className="matched-condition-row">
      <span className="matched-condition-label">{condition.label}</span>
      {condition.isCode
        ? <pre className="matched-condition-snippet">{condition.value}</pre>
        : <span className="matched-condition-value">{condition.value}</span>}
    </div>
  );
}

export function MatchedConditionsSection({ request, expectation }: MatchedConditionsSectionProps) {
  const conditions = getMatchedConditions(request, expectation);

  return (
    <div className="matched-expectation-wrapper">
      <div className="matched-expectation-header">
        <span className="matched-conditions-label">Matched Expectation</span>
        {expectation.id && <span className="best-match-id">{expectation.id}</span>}
      </div>

      {conditions.length > 0 && (
        <section className="detail-section matched-conditions-section">
          <div className="detail-label">Matched Conditions</div>
          <div className="matched-conditions-list">
            {conditions.map((c) => (
              <ConditionRow key={c.label} condition={c} />
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

