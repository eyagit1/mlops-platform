import { useState } from 'react';
import { classify, ragAsk, ragIngest } from '../api/client';
import { useActivity } from '../context/ActivityContext';
import JsonOutput from '../components/JsonOutput';

  const SAMPLE_DOC =
  'INVOICE #1042\nBill To: client@example.com\nDate: 10/08/2026\nTotal amount due: $1250.50\nTax and billing details included.';

export default function IADocuments() {
  const { logActivity } = useActivity();

  const [docId, setDocId] = useState('doc-1');
  const [ingestText, setIngestText] = useState(
    'The MLOps platform uses MLflow for experiment tracking and ChromaDB for RAG retrieval.',
  );
  const [question, setQuestion] = useState('How is experiment tracking handled?');
  const [extractText, setExtractText] = useState(SAMPLE_DOC);

  const [ingestResponse, setIngestResponse] = useState(null);
  const [ragResponse, setRagResponse] = useState(null);
  const [classifyResponse, setClassifyResponse] = useState(null);

  const [ingestLoading, setIngestLoading] = useState(false);
  const [ragLoading, setRagLoading] = useState(false);
  const [extractLoading, setExtractLoading] = useState(false);

  const [ingestError, setIngestError] = useState(null);
  const [ragError, setRagError] = useState(null);
  const [ragNotice, setRagNotice] = useState(null);
  const [extractError, setExtractError] = useState(null);

  const handleIngest = async () => {
    setIngestLoading(true);
    setIngestError(null);
    try {
      const { data, durationMs } = await ragIngest(docId.trim(), ingestText.trim());
      setIngestResponse(data);
      logActivity('POST /rag/ingest', durationMs);
    } catch (err) {
      setIngestError(err.message);
      setIngestResponse(null);
    } finally {
      setIngestLoading(false);
    }
  };

  const handleAsk = async () => {
    setRagLoading(true);
    setRagError(null);
    setRagNotice(null);
    try {
      const { data, durationMs } = await ragAsk(question.trim(), 3);
      setRagResponse(data);
      logActivity('POST /rag/ask', durationMs);
    } catch (err) {
      setRagResponse(null);
      if (err.status === 503) {
        setRagNotice('RAG generation not configured (GROQ_API_KEY missing)');
      } else {
        setRagError(err.message);
      }
    } finally {
      setRagLoading(false);
    }
  };

  const handleExtract = async () => {
    setExtractLoading(true);
    setExtractError(null);
    try {
      const { data, durationMs } = await classify(extractText.trim());
      setClassifyResponse(data);
      logActivity('POST /classify', durationMs);
    } catch (err) {
      setExtractError(err.message);
      setClassifyResponse(null);
    } finally {
      setExtractLoading(false);
    }
  };

  return (
    <div className="page-grid two-col">
      <div className="card stack-card">
        <div className="ingest-section">
          <span className="section-label">Knowledge base ingestion</span>
          <label className="field">
            <span>doc_id</span>
            <input
              type="text"
              value={docId}
              onChange={(event) => setDocId(event.target.value)}
            />
          </label>
          <label className="field">
            <span>Document text</span>
            <textarea
              rows={3}
              value={ingestText}
              onChange={(event) => setIngestText(event.target.value)}
            />
          </label>
          <button
            type="button"
            className="btn-secondary btn-sm"
            onClick={handleIngest}
            disabled={ingestLoading}
          >
            {ingestLoading ? 'Ingesting...' : 'Ingest'}
          </button>
          {ingestError && <p className="inline-error">{ingestError}</p>}
          {ingestResponse && <JsonOutput data={ingestResponse} label="Ingest response" />}
        </div>

        <hr className="section-divider" />

        <span className="eyebrow">DOCUMENT SEARCH</span>
        <h2 className="card-title">RAG Question</h2>
        <label className="field">
          <span>Your question</span>
          <textarea
            rows={4}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
          />
        </label>
        <button
          type="button"
          className="btn-primary"
          onClick={handleAsk}
          disabled={ragLoading}
        >
          {ragLoading ? 'Querying...' : 'Query'}
        </button>
        {ragNotice && <p className="inline-notice">{ragNotice}</p>}
        {ragError && <p className="inline-error">{ragError}</p>}
        <JsonOutput data={ragResponse} />
      </div>

      <div className="card">
        <span className="eyebrow">STRUCTURED EXTRACTION</span>
        <h2 className="card-title">Extraction</h2>
        <label className="field">
          <span>Document text</span>
          <textarea
            rows={8}
            value={extractText}
            onChange={(event) => setExtractText(event.target.value)}
          />
        </label>
        <button
          type="button"
          className="btn-primary"
          onClick={handleExtract}
          disabled={extractLoading}
        >
          {extractLoading ? 'Extracting...' : 'Extract'}
        </button>
        {extractError && <p className="inline-error">{extractError}</p>}
        <JsonOutput data={classifyResponse} />
      </div>
    </div>
  );
}
