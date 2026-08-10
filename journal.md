# Daily Progress Journal — MLOps Platform Internship

### Day 1 — 3/07/2026

**Objective for the day:**
Set up the development environment, initialize the project repository, choose the ML use case, and sketch the target architecture.

**What I did:**

- Verified Python, Git, and Docker installations
- Created the `mlops-platform` GitHub repository
- Scaffolded the project folder structure (`data/`, `src/`, `docker/`, `k8s/`, `.github/workflows/`)
- Chose the Iris classification dataset as the ML use case (simple/fast, since the project focus is the MLOps platform, not model complexity)
- Wrote the initial `README.md` including the architecture diagram
- Added `.gitignore` and `requirements.txt`

**Result / deliverable obtained:**
Initialized Git repository with project structure, README (including architecture diagram), `.gitignore`, and `requirements.txt` pushed to GitHub.

**Next step (tomorrow):**
Day 2 — set up the Python virtual environment, install dependencies, and make the first clean commit.

---

### Day 2 — 5/07/2026

**Objective for the day:**
Project structure + Python environment baseline (dependencies, train/serve skeleton, Docker/K8s scaffolding).

**What I did:**

- Updated `requirements.txt` with missing core dependencies for the Iris pipeline (`scikit-learn`, `pandas`) plus `pytest`/`flake8` and monitoring deps placeholders.
- Added `src/` as a proper Python package (`src/__init__.py`).
- Implemented `src/train.py` (Iris training + MLflow logging, with optional Model Registry registration).
- Implemented `src/serve.py` (FastAPI `/predict` + `/health`, loads model from MLflow Model Registry, keeps existing placeholder routes).
- Adjusted local dev behavior: `MLFLOW_REGISTER_TO_REGISTRY` is now **OFF by default (0)**.
- Added `--local-model-path` in `train.py` + `MODEL_LOCAL_PATH` in `serve.py` so `/predict` works locally without Model Registry.
- Turned `src/main.py` into a backward-compatible re-export of the FastAPI app.
- Added Dockerfiles: `docker/Dockerfile.train` and `docker/Dockerfile.serve`.
- Added Kubernetes scaffolding: `k8s/deployment.yaml` (replicas=2, liveness/readiness on `/health`) and `k8s/service.yaml`.
- Added a first GitHub Actions workflow `/.github/workflows/mlops.yml` with `test` (flake8 + pytest), `build` (push image to GHCR) and `deploy` (apply manifests + set image).
- Added minimal tests under `tests/` to keep CI meaningful.

**Challenges encountered:**

- Some repo tooling/commands were unreliable during exploration, so I focused on making the repo structure + code changes deterministically from files.

**Solutions / approaches tried:**

- Kept the implementation aligned with `README.md` (Iris classification) while preserving your existing placeholder API routes for future RAG work.
- Made training Model Registry optional (`--register-to-mlflow-registry`) so unit tests can run with only MLflow tracking.

**Result / deliverable obtained:**

- Repo now contains the Day 2→Week 2 skeleton: training/serving code, Docker + Kubernetes manifests, and a basic CI pipeline.

**Next step (tomorrow):**

- Day 3: validate `train.py` locally + local `.pkl` saving, then run `serve.py` locally using `MODEL_LOCAL_PATH`. After that, enable `MLFLOW_REGISTER_TO_REGISTRY=1` to test the full MLflow Model Registry workflow.

---

### Day 3 — 6/07/2026

**Objective for the day:**
Implement and validate the Iris training script with reproducible metrics and local model export.

**What I did:**

- Implemented `src/train.py` with Iris loading, 80/20 stratified split, and `RandomForestClassifier`.
- Added metrics: accuracy, weighted F1, confusion matrix, and classification report.
- Saved trained model locally to `data/iris_model.pkl` via `--local-model-path`.
- Added structured logging and CLI/env configuration.

**Result / deliverable obtained:**
`python src/train.py --local-model-path data/iris_model.pkl` runs end to end and prints metrics.

**Next step (tomorrow):**
Day 4 — integrate MLflow UI comparison runs and Model Registry registration.

---

### Day 4 — 7/07/2026

**Objective for the day:**
Track experiments in MLflow and register the best model.

**What I did:**

- Wrapped training in `mlflow.start_run()` with params, metrics, and model artifacts.
- Logged confusion matrix and classification report as MLflow artifacts.
- Added registry support controlled by `MLFLOW_REGISTER_TO_REGISTRY`.
- Added optional stage transition via `--transition-stage Production`.
- Created `scripts/run_experiments.ps1` and `.sh` to launch 4 hyperparameter runs.

**Result / deliverable obtained:**
Multiple tracked runs in MLflow UI + registered model workflow (`iris-classifier`).

**Next step (tomorrow):**
Day 5 — containerize training with Docker.

---

### Day 5 — 11/05/2026

**Objective for the day:**
Make training reproducible inside Docker and reachable by a local MLflow server.

**What I did:**

- Updated `docker/Dockerfile.train` (Python 3.11-slim, copies `src/`, runs `src/train.py`).
- Documented Docker build/run commands for Windows and Linux.
- Verified container training can log to MLflow via `MLFLOW_TRACKING_URI`.

**Result / deliverable obtained:**
`docker build -f docker/Dockerfile.train -t mlops-training:v1 .` and containerized training run.

**Next step (next week):**
Week 2 — Dockerize serving, Kubernetes manifests, and deployment validation.

---

### Week 2 — Containerization & Kubernetes

**Objective:**
Dockerize the serving API and deploy on Kubernetes with production manifests.

**What I did:**

- Built multi-stage `docker/Dockerfile.serve` (trains model during build, serves via FastAPI).
- Added `docker-compose.yml` for local API + Prometheus + Grafana stack.
- Created Kubernetes resources: Namespace, ConfigMap, Secret, Deployment, Service, Ingress, HPA.
- Added health/readiness probes and Prometheus scrape annotations on pods.

**Result / deliverable obtained:**
`docker compose up --build` runs the full local stack; `kubectl apply -f k8s/` deploys to cluster.

---

### Week 3 — CI/CD

**Objective:**
Automate test → train → build → deploy on every git push.

**What I did:**

- Extended `.github/workflows/mlops.yml` with `train`, `build`, and `deploy` jobs.
- CI trains Iris model, uploads artifact, builds serving + training Docker images to GHCR.
- Deploy job applies K8s manifests and rolling-updates the deployment (when `KUBE_CONFIG_B64` is set).

**Result / deliverable obtained:**
Full pipeline: lint → pytest → train → docker push → optional K8s deploy.

---

### Week 4 — Monitoring

**Objective:**
Expose Prometheus metrics and visualize them in Grafana.

**What I did:**

- Added custom metrics to `src/serve.py`: prediction count, latency histogram, HTTP request counter.
- Exposed `GET /metrics` endpoint for Prometheus scraping.
- Created `monitoring/prometheus.yml` and Grafana dashboard provisioning.
- Built Grafana dashboard: prediction rate, latency p95, HTTP status codes, errors.

**Result / deliverable obtained:**
Prometheus scrapes `/metrics`; Grafana dashboard available at port 3000 via docker-compose.

**Next step:**
Optional extensions: document classification, RAG, PostgreSQL, in-cluster MLflow server.
