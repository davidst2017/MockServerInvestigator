import { ExpectationResponse } from '../../types';
import { prettyBody } from '../../utils';
import { CodeBlock } from '../ui/CodeBlock';
import { KeyValueTable } from '../ui/KeyValueTable';
import { StatusBadge } from '../ui/Badge';

interface ResponseSectionProps {
  response: ExpectationResponse;
}

export function ResponseSection({ response }: ResponseSectionProps) {
  const body = prettyBody(response.body);

  return (
    <section className="detail-section">
      <h3 className="detail-heading">
        Response
        {response.statusCode != null && <> <StatusBadge statusCode={response.statusCode} /></>}
      </h3>

      {response.delay && (
        <>
          <div className="detail-label">Delay</div>
          <span className="detail-path">{response.delay.value} {response.delay.timeUnit}</span>
        </>
      )}

      {response.headers && Object.keys(response.headers).length > 0 && (
        <>
          <div className="detail-label">Headers</div>
          <KeyValueTable data={response.headers} />
        </>
      )}

      {body && (
        <>
          <div className="detail-label">Body</div>
          <CodeBlock>{body}</CodeBlock>
        </>
      )}
    </section>
  );
}
