import { Expectation } from '../types';
import { ForwardSection } from './ExpectationDetail/ForwardSection';
import { RequestMatcherSection } from './ExpectationDetail/RequestMatcherSection';
import { ResponseSection } from './ExpectationDetail/ResponseSection';
import { TimesSection } from './ExpectationDetail/TimesSection';

interface ExpectationDetailProps {
  expectation: Expectation | null;
}

export default function ExpectationDetail({ expectation }: ExpectationDetailProps) {
  if (!expectation) {
    return (
      <div className="request-detail">
        <div className="empty-state">Select an expectation to inspect it.</div>
      </div>
    );
  }

  return (
    <div className="request-detail">
      <div className="tab-content">
        <RequestMatcherSection request={expectation.httpRequest} />
        {expectation.httpResponse && <ResponseSection response={expectation.httpResponse} />}
        {expectation.httpForward && <ForwardSection forward={expectation.httpForward} />}
        {expectation.times && <TimesSection times={expectation.times} />}
      </div>
    </div>
  );
}

