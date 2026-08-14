import { useCallback, useEffect, useState } from 'react';
import { getHealth } from '../api/client';

function ServerPulseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
      <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
      <circle cx="6" cy="6" r="1" fill="currentColor" />
      <circle cx="6" cy="18" r="1" fill="currentColor" />
      <path d="M13 6h5" />
      <path d="M13 18h5" />
    </svg>
  );
}

function BrainCpuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" />
    </svg>
  );
}

function DatabaseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  );
}

function TargetTrophyIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}

function StatusCard({ label, value, healthy, icon }) {
  return (
    <div className="status-card">
      <div className="status-card-icon">
        {icon}
      </div>
      <div className="status-card-body">
        <span className="status-card-label">{label}</span>
        <span className={`status-card-value ${healthy ? 'healthy' : 'unhealthy'}`}>
          {value}
        </span>
      </div>
    </div>
  );
}

export default function StatusCards({ refreshKey = 0 }) {
  const [health, setHealth] = useState(null);
  const [apiOk, setApiOk] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await getHealth();
      setHealth(data);
      setApiOk(true);
    } catch (err) {
      setHealth(null);
      setApiOk(false);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth, refreshKey]);

  const modelValue = health?.model_loaded ? 'Operational' : 'Unavailable';
  const ragValue = health?.rag_engine === 'ready' ? 'Operational' : 'Unavailable';

  return (
    <section className="status-cards-section">
      {error && !loading && (
        <p className="inline-error status-cards-error">Health check: {error}</p>
      )}
      <div className="status-cards-grid">
        <StatusCard
          label="API"
          value={apiOk ? 'ok' : 'error'}
          healthy={apiOk}
          icon={<ServerPulseIcon />}
        />
        <StatusCard
          label="ML Model"
          value={modelValue}
          healthy={Boolean(health?.model_loaded)}
          icon={<BrainCpuIcon />}
        />
        <StatusCard
          label="RAG Engine"
          value={ragValue}
          healthy={health?.rag_engine === 'ready'}
          icon={<DatabaseIcon />}
        />
        <StatusCard
          label="Accuracy"
          value="0.933"
          healthy
          icon={<TargetTrophyIcon />}
        />
      </div>
    </section>
  );
}
