import { EXTERNAL_LINKS } from '../api/client';

const LINKS = [
  { label: 'Swagger', href: EXTERNAL_LINKS.swagger },
  { label: 'Metrics', href: EXTERNAL_LINKS.metrics },
  { label: 'MLflow', href: EXTERNAL_LINKS.mlflow },
  { label: 'Prometheus', href: EXTERNAL_LINKS.prometheus },
  { label: 'Grafana', href: EXTERNAL_LINKS.grafana },
];

function RefreshIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M21 12a9 9 0 1 1-2.64-6.36"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M21 3v6h-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '5px', opacity: 0.65 }} aria-hidden="true">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

export default function PageHeader({ onRefresh }) {
  return (
    <header className="page-header">
      <div className="page-header-text">
        <span className="eyebrow page-eyebrow">OPERATIONS PLATFORM</span>
        <h1 className="page-title">MLOps supervision, inference and business AI</h1>
      </div>
      <div className="page-header-actions">
        <div className="external-links">
          {LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="pill-link"
              title={`Open ${link.label} in a new tab`}
            >
              <span>{link.label}</span>
              <ExternalIcon />
            </a>
          ))}
        </div>
        <button
          type="button"
          className="icon-btn"
          onClick={onRefresh}
          title="Refresh platform status"
          aria-label="Refresh platform status"
        >
          <RefreshIcon />
        </button>
      </div>
    </header>
  );
}
