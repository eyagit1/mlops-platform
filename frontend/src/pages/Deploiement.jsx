const CHECKLIST = [
  {
    title: 'Docker',
    description: 'Multi-stage image with non-root user and frontend included.',
  },
  {
    title: 'Kubernetes',
    description: 'Deployment, Service, ConfigMap, Secret and HPA.',
  },
  {
    title: 'CI/CD',
    description: 'Tests, Docker build, short SHA tags and publishing to GHCR.',
  },
  {
    title: 'Monitoring',
    description: 'Prometheus annotations and provisioned Grafana dashboard.',
  },
];

const COMMANDS = `python src/train.py --local-model-path data/iris_model.pkl
uvicorn src.serve:app --host 127.0.0.1 --port 8000 --reload
npm --prefix frontend run dev
docker compose up --build
kubectl apply -f k8s/
pytest -q`;

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path
        d="M8 12l2.5 2.5L16 9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Deploiement() {
  return (
    <div className="page-grid two-col">
      <div className="card">
        <span className="eyebrow">DOCKER, KUBERNETES, GHCR</span>
        <h2 className="card-title">Deploiement</h2>

        <ul className="checklist">
          {CHECKLIST.map((item) => (
            <li key={item.title} className="checklist-item">
              <span className="check-icon">
                <CheckIcon />
              </span>
              <div>
                <strong>{item.title}</strong>
                <p>{item.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <span className="eyebrow">COMMANDS</span>
        <h2 className="card-title">Useful commands</h2>
        <pre className="json-output commands-block">{COMMANDS}</pre>
      </div>
    </div>
  );
}
