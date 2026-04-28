import { Expectation, RequestResponseEntry } from '../../types';
import { CodeBlock } from '../ui/CodeBlock';
import { KeyValueTable } from '../ui/KeyValueTable';
import { MethodBadge, StatusBadge } from '../ui/Badge';
import { BestMatchSection } from './BestMatchSection';
import { MatchedConditionsSection } from './MatchedConditionsSection';
import { prettyBody } from './utils';

interface RequestTabProps {
  entry: RequestResponseEntry;
  bestMatch: Expectation | null;
}

export function RequestTab({ entry, bestMatch }: RequestTabProps) {
  const req = entry.httpRequest;
  const res = entry.httpResponse;
  const isUnmatched = !res || res.statusCode === 404;
  const reqBody = prettyBody(req.body);
  const resBody = res ? prettyBody(res.body) : '';

  return (
    <div className="tab-content">
      <section className="detail-section">
        <h3 className="detail-heading">
          <MethodBadge method={req.method} />
          <span className="detail-path">{req.path}</span>
        </h3>

        {req.queryStringParameters && Object.keys(req.queryStringParameters).length > 0 && (
          <>
            <div className="detail-label">Query Params</div>
            <KeyValueTable data={req.queryStringParameters} />
          </>
        )}

        {req.headers && Object.keys(req.headers).length > 0 && (
          <>
            <div className="detail-label">Headers</div>
            <KeyValueTable data={req.headers} />
          </>
        )}

        {reqBody && (
          <>
            <div className="detail-label">Body</div>
            <CodeBlock>{reqBody}</CodeBlock>
          </>
        )}
      </section>

      {res && (
        <section className="detail-section">
          <h3 className="detail-heading">
            Response <StatusBadge statusCode={res.statusCode} />
          </h3>

          {res.headers && Object.keys(res.headers).length > 0 && (
            <>
              <div className="detail-label">Headers</div>
              <KeyValueTable data={res.headers} />
            </>
          )}

          {resBody && (
            <>
              <div className="detail-label">Body</div>
              <CodeBlock>{resBody}</CodeBlock>
            </>
          )}
        </section>
      )}

      {isUnmatched && bestMatch && <BestMatchSection request={req} expectation={bestMatch} />}
      {!isUnmatched && bestMatch && (
        <MatchedConditionsSection request={req} expectation={bestMatch} />
      )}
    </div>
  );
}
