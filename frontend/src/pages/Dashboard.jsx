import { useNavigate } from 'react-router-dom';
import ActivityFeed from '../components/ActivityFeed';

function ArrowRightIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '6px' }} aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="page-grid two-col">
      <div className="card hero-card">
        <span className="eyebrow">OPERATIONAL VIEW</span>
        <h2 className="hero-heading">
          A single console to test, observe and present the platform.
        </h2>
        <p className="hero-subtext">
          Run real-time inference on scikit-learn models, extract intelligence from unstructured documents, and query the ChromaDB vector store.
        </p>
        <div className="hero-actions">
          <button
            type="button"
            className="btn-primary"
            onClick={() => navigate('/inference')}
          >
            <span>Test the model</span>
            <ArrowRightIcon />
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate('/documents')}
          >
            <span>Test the RAG</span>
            <ArrowRightIcon />
          </button>
        </div>
      </div>
      <ActivityFeed />
    </div>
  );
}
