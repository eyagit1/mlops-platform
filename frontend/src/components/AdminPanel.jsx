import { useState } from 'react';

function formatTimestamp(date = new Date()) {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function K8sIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  );
}

function MLflowIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19V5M4 19h16M8 15l3-4 3 2 4-6" />
    </svg>
  );
}

function ChromaIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  );
}

function ShieldCheckIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

export default function AdminPanel() {
  // --- Kubernetes State ---
  const [replicas, setReplicas] = useState(2);
  const [isRestarting, setIsRestarting] = useState(false);

  // --- MLflow State ---
  const [prodModel, setProdModel] = useState({
    version: 'v2.1',
    accuracy: '0.933',
    f1: '0.931',
    stage: 'Production',
    updatedAt: '2026-08-12',
  });
  const [stagingModel, setStagingModel] = useState({
    version: 'v2.2',
    accuracy: '0.967',
    f1: '0.965',
    stage: 'Staging',
    updatedAt: '2026-08-14 (CI/CD build)',
  });
  const [isPromoted, setIsPromoted] = useState(false);

  // --- ChromaDB State ---
  const [docCount, setDocCount] = useState(4);
  const [chunkCount, setChunkCount] = useState(28);
  const [isPurging, setIsPurging] = useState(false);

  // --- Audit Log State ---
  const [auditLogs, setAuditLogs] = useState([
    {
      id: 1,
      time: '09:15:22',
      category: 'SYSTEM',
      actor: 'system-boot',
      message: 'Platform initialized in local environment. Services connected.',
      status: 'INFO',
    },
    {
      id: 2,
      time: '09:20:41',
      category: 'K8S',
      actor: 'admin@itgate.local',
      message: 'Kubernetes namespace "mlops" synchronized with 2 replicas.',
      status: 'SUCCESS',
    },
    {
      id: 3,
      time: '09:24:05',
      category: 'MLFLOW',
      actor: 'ci-runner',
      message: 'Model artifact "iris-rf-classifier:v2.2" registered from GitHub Actions CI.',
      status: 'SUCCESS',
    },
  ]);

  const addAuditLog = (category, message, status = 'SUCCESS') => {
    const newEntry = {
      id: Date.now(),
      time: formatTimestamp(),
      category,
      actor: 'admin@itgate.local',
      message,
      status,
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
  };

  // Kubernetes Handlers
  const handleScaleUp = () => {
    if (replicas < 10) {
      const next = replicas + 1;
      setReplicas(next);
      addAuditLog('K8S', `Scaled deployment 'mlops-iris-api' up from ${replicas} to ${next} replicas.`);
    }
  };

  const handleScaleDown = () => {
    if (replicas > 1) {
      const next = replicas - 1;
      setReplicas(next);
      addAuditLog('K8S', `Scaled deployment 'mlops-iris-api' down from ${replicas} to ${next} replicas.`);
    }
  };

  const handleRollingRestart = () => {
    setIsRestarting(true);
    addAuditLog('K8S', "Initiated rolling rollout for 'deployment/mlops-iris-api' in namespace 'mlops'.", 'INFO');
    setTimeout(() => {
      setIsRestarting(false);
      addAuditLog('K8S', "Rolling update completed. All pods verified 1/1 Running.", 'SUCCESS');
    }, 1800);
  };

  // MLflow Promotion Handler
  const handlePromoteModel = () => {
    if (isPromoted) return;
    const oldVersion = prodModel.version;
    const newVersion = stagingModel.version;

    setProdModel({
      version: newVersion,
      accuracy: stagingModel.accuracy,
      f1: stagingModel.f1,
      stage: 'Production',
      updatedAt: 'Just now (Promoted)',
    });
    setStagingModel({
      version: `${oldVersion} (Archived)`,
      accuracy: prodModel.accuracy,
      f1: prodModel.f1,
      stage: 'Archived',
      updatedAt: prodModel.updatedAt,
    });
    setIsPromoted(true);
    addAuditLog(
      'MLFLOW',
      `Promoted model version ${newVersion} (Accuracy: ${stagingModel.accuracy}) to Production. Archived ${oldVersion}.`,
      'SUCCESS'
    );
  };

  // ChromaDB Purge Handler
  const handlePurgeDocs = () => {
    setIsPurging(true);
    setTimeout(() => {
      setDocCount(1);
      setChunkCount(6);
      setIsPurging(false);
      addAuditLog(
        'CHROMADB',
        "Purged temporary test documents from collection 'document_knowledgebase'. Index optimized.",
        'SUCCESS'
      );
    }, 600);
  };

  return (
    <div className="admin-container">
      {/* Top Banner */}
      <div className="admin-banner">
        <div className="admin-banner-left">
          <span className="eyebrow">INFRASTRUCTURE & ORCHESTRATION</span>
          <h2 className="admin-title">Administrative Infrastructure Control Panel</h2>
          <p className="admin-subtitle">
            Manage Kubernetes clusters, MLflow model registries, vector embeddings, and review system audit trails.
          </p>
        </div>
        <div className="admin-banner-badge">
          <span className="live-dot" />
          <span>Cluster Status: Healthy (k8s/mlops)</span>
        </div>
      </div>

      {/* 3 Main Control Sections */}
      <div className="admin-grid three-col">
        {/* Section 1: Kubernetes Cluster Management */}
        <div className="card admin-card">
          <div className="admin-card-header">
            <div className="admin-card-icon k8s-icon">
              <K8sIcon />
            </div>
            <div>
              <span className="eyebrow">CLUSTER CONTROL</span>
              <h3 className="admin-card-title">Kubernetes Cluster</h3>
            </div>
          </div>

          <div className="admin-details-list">
            <div className="admin-detail-row">
              <span className="detail-label">Namespace</span>
              <span className="badge-pill code-badge">mlops</span>
            </div>
            <div className="admin-detail-row">
              <span className="detail-label">Deployment</span>
              <span className="detail-value">mlops-iris-api</span>
            </div>
            <div className="admin-detail-row">
              <span className="detail-label">HPA Policy</span>
              <span className="detail-value">Min: 1 | Max: 10 | CPU: 75%</span>
            </div>
            <div className="admin-detail-row">
              <span className="detail-label">Active Replicas</span>
              <div className="scale-controls">
                <button
                  type="button"
                  className="scale-btn"
                  onClick={handleScaleDown}
                  disabled={replicas <= 1 || isRestarting}
                  title="Scale down pod replicas"
                >
                  -
                </button>
                <span className="replica-number">{replicas} pods</span>
                <button
                  type="button"
                  className="scale-btn"
                  onClick={handleScaleUp}
                  disabled={replicas >= 10 || isRestarting}
                  title="Scale up pod replicas"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Pods list */}
          <div className="pod-status-box">
            <span className="sub-label">Active Pod Instances ({replicas}):</span>
            <div className="pod-list">
              {Array.from({ length: replicas }).map((_, idx) => (
                <div key={idx} className="pod-item">
                  <div className="pod-meta">
                    <span className="pod-dot" />
                    <span className="pod-name">mlops-iris-api-74b89-p{idx + 1}</span>
                  </div>
                  <span className="pod-state">
                    {isRestarting ? 'Rolling...' : '1/1 Running'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="btn-secondary btn-full"
            onClick={handleRollingRestart}
            disabled={isRestarting}
          >
            {isRestarting ? 'Restarting pods...' : 'Trigger Rolling Restart'}
          </button>
        </div>

        {/* Section 2: MLflow Registry Control */}
        <div className="card admin-card">
          <div className="admin-card-header">
            <div className="admin-card-icon mlflow-icon">
              <MLflowIcon />
            </div>
            <div>
              <span className="eyebrow">MODEL REGISTRY</span>
              <h3 className="admin-card-title">MLflow Registry</h3>
            </div>
          </div>

          <div className="admin-details-list">
            <div className="admin-detail-row">
              <span className="detail-label">Model Name</span>
              <span className="detail-value">iris-rf-classifier</span>
            </div>
            <div className="admin-detail-row">
              <span className="detail-label">Production Version</span>
              <span className="badge-ok">{prodModel.version}</span>
            </div>
            <div className="admin-detail-row">
              <span className="detail-label">Prod Accuracy</span>
              <span className="detail-highlight">{prodModel.accuracy}</span>
            </div>
            <div className="admin-detail-row">
              <span className="detail-label">Candidate (Staging)</span>
              <span className="badge-pill staging-badge">{stagingModel.version}</span>
            </div>
            <div className="admin-detail-row">
              <span className="detail-label">Candidate Accuracy</span>
              <span className="detail-highlight accent-green">{stagingModel.accuracy}</span>
            </div>
          </div>

          <div className="model-diff-box">
            <div className="diff-header">
              <span>Candidate Improvement</span>
              <strong className="diff-gain">+3.4% Accuracy</strong>
            </div>
            <p className="diff-desc">
              CI automated training run verified on Iris test set. Ready for one-click production promotion.
            </p>
          </div>

          <button
            type="button"
            className="btn-primary btn-full"
            onClick={handlePromoteModel}
            disabled={isPromoted}
          >
            {isPromoted ? 'Model v2.2 is in Production' : 'Promote Candidate (v2.2) to Prod'}
          </button>
        </div>

        {/* Section 3: ChromaDB Vector Store Maintenance */}
        <div className="card admin-card">
          <div className="admin-card-header">
            <div className="admin-card-icon chroma-icon">
              <ChromaIcon />
            </div>
            <div>
              <span className="eyebrow">VECTOR STORE</span>
              <h3 className="admin-card-title">ChromaDB Store</h3>
            </div>
          </div>

          <div className="admin-details-list">
            <div className="admin-detail-row">
              <span className="detail-label">Embedding Model</span>
              <span className="badge-pill code-badge">all-MiniLM-L6-v2</span>
            </div>
            <div className="admin-detail-row">
              <span className="detail-label">Vector Dimensions</span>
              <span className="detail-value">384-d Dense Float32</span>
            </div>
            <div className="admin-detail-row">
              <span className="detail-label">Collection</span>
              <span className="detail-value">document_knowledgebase</span>
            </div>
            <div className="admin-detail-row">
              <span className="detail-label">Indexed Documents</span>
              <span className="detail-value">{docCount} docs ({chunkCount} chunks)</span>
            </div>
            <div className="admin-detail-row">
              <span className="detail-label">Persistence</span>
              <span className="detail-value">./data/chroma_db</span>
            </div>
          </div>

          <div className="chroma-health-box">
            <div className="chroma-health-item">
              <span className="sub-label">Index Health</span>
              <span className="badge-ok">Optimal</span>
            </div>
            <div className="chroma-health-item">
              <span className="sub-label">Distance Metric</span>
              <span className="detail-value">Cosine</span>
            </div>
          </div>

          <button
            type="button"
            className="btn-secondary btn-full btn-danger-hover"
            onClick={handlePurgeDocs}
            disabled={isPurging}
          >
            {isPurging ? 'Purging Test Chunks...' : 'Purge Test Documents & Vacuum'}
          </button>
        </div>
      </div>

      {/* Section 4: Live System Audit Log */}
      <div className="card audit-log-card">
        <div className="audit-header">
          <div className="audit-header-title">
            <ShieldCheckIcon />
            <div>
              <span className="eyebrow">SECURITY & AUDIT</span>
              <h3 className="card-title" style={{ margin: 0 }}>System Audit & Action Log</h3>
            </div>
          </div>
          <button
            type="button"
            className="btn-secondary btn-sm"
            onClick={() => setAuditLogs([])}
            disabled={auditLogs.length === 0}
          >
            Clear Log
          </button>
        </div>

        <div className="audit-table-wrap">
          {auditLogs.length === 0 ? (
            <p className="activity-empty" style={{ padding: '1rem' }}>
              No audit logs in buffer. Trigger any action above to record events.
            </p>
          ) : (
            <table className="audit-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Category</th>
                  <th>Actor</th>
                  <th>Action & Details</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="log-time">{log.time}</td>
                    <td>
                      <span className={`log-category cat-${log.category.toLowerCase()}`}>
                        {log.category}
                      </span>
                    </td>
                    <td className="log-actor">{log.actor}</td>
                    <td className="log-msg">{log.message}</td>
                    <td>
                      <span className={`log-status status-${log.status.toLowerCase()}`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
