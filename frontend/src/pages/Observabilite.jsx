import { EXTERNAL_LINKS } from '../api/client';
import ActivityFeed from '../components/ActivityFeed';

export default function Observabilite() {
  return (
    <div className="page-grid two-col">
      <div className="card">
        <span className="eyebrow">PROMETHEUS + GRAFANA</span>
        <h2 className="card-title">Observability</h2>

        <div className="info-grid">
          <a
            className="info-box info-box-link"
            href={EXTERNAL_LINKS.metrics}
            target="_blank"
            rel="noreferrer"
          >
            <span className="info-box-label">Metrics endpoint</span>
            <span className="info-box-value">/metrics</span>
          </a>
          <div className="info-box">
            <span className="info-box-label">Grafana</span>
            <span className="info-box-value">:3000</span>
          </div>
          <div className="info-box">
            <span className="info-box-label">Prometheus</span>
            <span className="info-box-value">:9090</span>
          </div>
          <div className="info-box">
            <span className="info-box-label">Scrape interval</span>
            <span className="info-box-value">15 s</span>
          </div>
        </div>
      </div>

      <ActivityFeed />
    </div>
  );
}
