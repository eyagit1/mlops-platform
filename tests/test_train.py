"""Minimal tests for Week 1 training pipeline."""

import os
import subprocess
import sys
import uuid
from pathlib import Path

import joblib
from sklearn.datasets import load_iris
from sklearn.ensemble import RandomForestClassifier


def test_train_runs_without_mlflow_registry(tmp_path: Path) -> None:
    """Training must work when Model Registry is disabled."""
    env = os.environ.copy()
    env["MLFLOW_REGISTER_TO_REGISTRY"] = "0"
    env["MLFLOW_EXPERIMENT_NAME"] = f"test-experiment-{uuid.uuid4().hex}"
    env["MLFLOW_RUN_NAME"] = "test-run"
    env["PYTHONPATH"] = str(Path.cwd())

    backend_store_path = (tmp_path / "mlruns").resolve()
    backend_store_uri = f"file:{str(backend_store_path).replace(chr(92), '/')}"
    env["MLFLOW_TRACKING_URI"] = backend_store_uri

    local_model_path = tmp_path / "iris_model.pkl"
    cmd = [
        sys.executable,
        "src/train.py",
        "--local-model-path",
        str(local_model_path),
        "--n-estimators",
        "10",
        "--max-depth",
        "2",
        "--random-state",
        "42",
    ]

    subprocess.run(cmd, cwd=str(Path.cwd()), env=env, check=True)
    assert local_model_path.exists()

    model = joblib.load(local_model_path)
    iris = load_iris()
    baseline = RandomForestClassifier(n_estimators=10, max_depth=2, random_state=42)
    baseline.fit(iris.data, iris.target)
    assert model.predict(iris.data[:1])[0] == baseline.predict(iris.data[:1])[0]


def test_serve_import() -> None:
    from src.serve import app  # noqa: F401
