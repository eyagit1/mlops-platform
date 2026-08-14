import { useActivity } from '../context/ActivityContext';

function formatTime(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function formatLatency(ms) {
  if (ms === null || ms === undefined) return '0 ms';
  if (ms < 1000) {
    return `${ms} ms`;
  }
  return `${(ms / 1000).toFixed(1)} s`;
}

function getLatencyClass(ms) {
  if (ms === null || ms === undefined || ms < 500) return 'latency-fast';
  if (ms <= 3000) return 'latency-moderate';
  return 'latency-slow';
}

export default function ActivityFeed() {
  const { activities } = useActivity();

  return (
    <div className="card activity-card">
      <span className="eyebrow">PILOTAGE</span>
      <h2 className="card-title">Recent activity</h2>
      <div className="activity-list">
        {activities.length === 0 ? (
          <p className="activity-empty">
            No activity yet. Run a prediction, an extraction or a RAG query to populate this log.
          </p>
        ) : (
          activities.map((item) => (
            <div key={item.id} className="activity-row">
              <div className="activity-row-main">
                <span className="activity-endpoint">{item.endpoint}</span>
                <span className="activity-meta">
                  {formatTime(item.timestamp)} ·{' '}
                  <span className={`latency-pill ${getLatencyClass(item.durationMs)}`}>
                    {formatLatency(item.durationMs)}
                  </span>
                </span>
              </div>
              <span className="badge-ok">{item.status}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
