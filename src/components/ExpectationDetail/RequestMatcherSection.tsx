import { ExpectationRequest } from '../../types';
import { prettyBody } from '../../utils';
import { CodeBlock } from '../ui/CodeBlock';
import { KeyValueTable } from '../ui/KeyValueTable';
import { MethodBadge } from '../ui/Badge';

interface RequestMatcherSectionProps {
  request: ExpectationRequest;
}

export function RequestMatcherSection({ request }: RequestMatcherSectionProps) {
  const body = prettyBody(request.body);

  return (
    <section className="detail-section">
      <h3 className="detail-heading">Request Matcher</h3>

      <div className="detail-label">Method / Path</div>
      <div className="detail-method-path">
        {request.method ? (
          <MethodBadge method={request.method} />
        ) : (
          <span className="badge badge-any">ANY</span>
        )}
        <span className="detail-path">{request.path ?? '(any path)'}</span>
      </div>

      {request.queryStringParameters && Object.keys(request.queryStringParameters).length > 0 && (
        <>
          <div className="detail-label">Query Params</div>
          <KeyValueTable data={request.queryStringParameters} />
        </>
      )}

      {request.headers && Object.keys(request.headers).length > 0 && (
        <>
          <div className="detail-label">Headers</div>
          <KeyValueTable data={request.headers} />
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
