# MLOps Platform for AI Deployment

Internship — **ITGate Group**, Summer 2026  
Subject 2: *Plateforme MLOps pour déploiement IA*

Full progress report: [REPORT.md](REPORT.md)

## Lifecycle

**Train → Track → Register → Serve → Containerize → Orchestrate → CI/CD → Monitor**

## Quick start

```powershell
# Train
python src/train.py --local-model-path data/iris_model.pkl

# Serve
$env:MODEL_LOCAL_PATH="data/iris_model.pkl"
uvicorn src.serve:app --port 8000

# Full stack (API + Prometheus + Grafana)
docker compose up --build
```

| Service | URL |
|---------|-----|
| API docs | http://localhost:8000/docs |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3000 (admin/admin) |

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/predict` | Iris batch inference |
| POST | `/classify` | Document classification + metadata extraction |
| POST | `/rag/ingest` | Ingest documents into ChromaDB |
| POST | `/rag/query` | Semantic vector search |
| GET | `/health` | Readiness probe |
| GET | `/metrics` | Prometheus scrape |

## Project structure

```
mlops-platform/
├── src/
│   ├── train.py              # Training + MLflow
│   ├── serve.py              # FastAPI gateway (4 core routes)
│   ├── classifier.py         # Document AI
│   ├── rag.py                # ChromaDB + sentence-transformers
│   └── metrics.py            # Prometheus metrics
├── docker/
│   ├── Dockerfile.train
│   └── Dockerfile.serve      # Multi-stage: train + serve + embed model
├── k8s/                      # Namespace, Deployment, Service, Ingress, HPA
├── monitoring/               # Prometheus + Grafana
├── scripts/                  # Hyperparameter experiment sweeps
├── tests/
├── docker-compose.yml
└── .github/workflows/mlops.yml
```

## Week-by-week status

| Week | Focus | Status |
|------|-------|--------|
| 1 | Training + MLflow + Docker train | Done |
| 2 | Docker serve + Kubernetes | Done |
| 3 | GitHub Actions CI/CD | Done |
| 4 | Prometheus + Grafana | Done |
| 5 | Document AI + RAG pipeline | Done |

## MLflow

```powershell
mlflow ui --port 5000
.\scripts\run_experiments.ps1
```

Register best model:

```powershell
$env:MLFLOW_REGISTER_TO_REGISTRY="1"
python src/train.py --register-to-mlflow-registry --transition-stage Production
```

## Kubernetes

```powershell
kubectl apply -f k8s/
kubectl get pods -n mlops
```

Deploy from CI requires GitHub secret `KUBE_CONFIG_B64`.

## Tests

```powershell
pytest -q
flake8 src tests --max-line-length=100
```

## Author

Intern @ ITGate Group — Summer 2026
