"""
Train an Iris classifier and log experiments to MLflow.

Week 1 deliverables:
  - Day 3: local training, metrics, .pkl export
  - Day 4: MLflow params/metrics/artifacts + optional Model Registry
  - Day 5: runnable inside docker/Dockerfile.train
"""

from __future__ import annotations

import argparse
import logging
import os
import sys
from pathlib import Path
from typing import Any

import joblib
import mlflow
import mlflow.sklearn
import pandas as pd
from mlflow.tracking import MlflowClient
from sklearn.datasets import load_iris
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
)
from sklearn.model_selection import train_test_split

FEATURE_COLUMNS = [f"f{i}" for i in range(1, 5)]
IRIS_TARGET_NAMES = ["setosa", "versicolor", "virginica"]

logger = logging.getLogger(__name__)


def configure_logging(level: str = "INFO") -> None:
    """Configure structured logging for the training script."""
    logging.basicConfig(
        level=getattr(logging, level.upper(), logging.INFO),
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
        stream=sys.stdout,
        force=True,
    )


def build_model(
    n_estimators: int,
    max_depth: int | None,
    random_state: int,
) -> RandomForestClassifier:
    """Create a RandomForest classifier."""
    return RandomForestClassifier(
        n_estimators=n_estimators,
        max_depth=max_depth,
        random_state=random_state,
    )


def compute_metrics(
    y_true: pd.Series,
    y_pred: list[int] | Any,
) -> dict[str, float]:
    """Compute classification metrics."""
    return {
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "f1_weighted": float(f1_score(y_true, y_pred, average="weighted")),
    }


def build_confusion_matrix_payload(
    y_true: pd.Series,
    y_pred: list[int] | Any,
) -> dict[str, Any]:
    """Build a JSON-serializable confusion matrix payload."""
    matrix = confusion_matrix(y_true, y_pred)
    return {
        "labels": IRIS_TARGET_NAMES,
        "matrix": matrix.tolist(),
    }


def print_training_report(
    metrics: dict[str, float],
    confusion_payload: dict[str, Any],
    classification_text: str,
) -> None:
    """Print human-readable training results to stdout."""
    print("\n=== Training Results ===")
    print(f"Accuracy : {metrics['accuracy']:.4f}")
    print(f"F1 (weighted): {metrics['f1_weighted']:.4f}")
    print("\nConfusion matrix (rows=true, cols=pred):")
    print(f"Labels: {confusion_payload['labels']}")
    for row in confusion_payload["matrix"]:
        print(row)
    print("\nClassification report:")
    print(classification_text)


def parse_args() -> argparse.Namespace:
    """Parse CLI arguments and environment variable defaults."""
    parser = argparse.ArgumentParser(
        description="Train Iris classifier and log the run to MLflow.",
    )
    parser.add_argument(
        "--tracking-uri",
        default=os.getenv("MLFLOW_TRACKING_URI", "").strip(),
        help="MLflow tracking URI (e.g. http://localhost:5000).",
    )
    parser.add_argument(
        "--experiment-name",
        default=os.getenv("MLFLOW_EXPERIMENT_NAME", "IrisExperiment"),
    )
    parser.add_argument(
        "--registered-model-name",
        default=os.getenv("MLFLOW_REGISTERED_MODEL_NAME", "iris-classifier"),
    )
    parser.add_argument(
        "--register-to-mlflow-registry",
        action="store_true",
        default=os.getenv("MLFLOW_REGISTER_TO_REGISTRY", "0").strip() == "1",
        help="Register the model in MLflow Model Registry when enabled.",
    )
    parser.add_argument(
        "--transition-stage",
        default=os.getenv("MLFLOW_TRANSITION_STAGE", "").strip(),
        choices=["", "Staging", "Production"],
        help="Optional registry stage transition after registration.",
    )
    parser.add_argument(
        "--run-name",
        default=os.getenv("MLFLOW_RUN_NAME", "iris-rfc"),
    )
    parser.add_argument(
        "--local-model-path",
        default=os.getenv("LOCAL_MODEL_PATH", "data/iris_model.pkl"),
        help="Local .pkl output path (Day 3 deliverable).",
    )
    parser.add_argument("--n-estimators", type=int, default=int(os.getenv("N_ESTIMATORS", "200")))
    parser.add_argument(
        "--max-depth",
        default=os.getenv("MAX_DEPTH", "").strip(),
        help="Tree depth limit. Use empty string for unlimited depth.",
    )
    parser.add_argument(
        "--random-state",
        type=int,
        default=int(os.getenv("RANDOM_STATE", "42")),
    )
    parser.add_argument(
        "--test-size",
        type=float,
        default=float(os.getenv("TEST_SIZE", "0.2")),
    )
    parser.add_argument(
        "--log-level",
        default=os.getenv("LOG_LEVEL", "INFO"),
    )
    return parser.parse_args()


def save_local_model(model: RandomForestClassifier, path: str) -> None:
    """Persist the trained model to disk."""
    output = Path(path)
    output.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, output)
    logger.info("Saved local model to %s", output)


def transition_registered_model(
    model_name: str,
    stage: str,
    tracking_uri: str,
) -> None:
    """Promote the latest registered model version to a target stage."""
    if tracking_uri:
        mlflow.set_tracking_uri(tracking_uri)

    client = MlflowClient()
    latest_versions = client.get_latest_versions(model_name)
    if not latest_versions:
        logger.warning("No registered versions found for model %s", model_name)
        return

    version = latest_versions[0].version
    client.transition_model_version_stage(
        name=model_name,
        version=version,
        stage=stage,
        archive_existing_versions=True,
    )
    logger.info("Transitioned %s version %s to %s", model_name, version, stage)


def train(args: argparse.Namespace) -> dict[str, float]:
    """
    Execute the full Iris training pipeline.

    Returns:
        Dictionary of evaluation metrics.
    """
    configure_logging(args.log_level)

    if args.tracking_uri:
        mlflow.set_tracking_uri(args.tracking_uri)
        logger.info("Using MLflow tracking URI: %s", args.tracking_uri)
    else:
        logger.info("Using default local MLflow backend store (./mlruns)")

    mlflow.set_experiment(args.experiment_name)

    max_depth: int | None
    if str(args.max_depth).strip() == "":
        max_depth = None
    else:
        max_depth = int(args.max_depth)

    iris = load_iris()
    features = pd.DataFrame(iris.data, columns=FEATURE_COLUMNS)
    labels = pd.Series(iris.target)

    X_train, X_test, y_train, y_test = train_test_split(
        features,
        labels,
        test_size=args.test_size,
        random_state=args.random_state,
        stratify=labels,
    )

    model = build_model(
        n_estimators=args.n_estimators,
        max_depth=max_depth,
        random_state=args.random_state,
    )
    model.fit(X_train, y_train)

    predictions = model.predict(X_test)
    metrics = compute_metrics(y_test, predictions)
    confusion_payload = build_confusion_matrix_payload(y_test, predictions)
    classification_text = classification_report(
        y_test,
        predictions,
        target_names=IRIS_TARGET_NAMES,
    )

    print_training_report(metrics, confusion_payload, classification_text)

    if args.local_model_path:
        save_local_model(model, args.local_model_path)

    with mlflow.start_run(run_name=args.run_name) as run:
        mlflow.log_params(
            {
                "n_estimators": args.n_estimators,
                "max_depth": max_depth,
                "random_state": args.random_state,
                "test_size": args.test_size,
                "dataset": "iris",
            }
        )
        mlflow.log_metrics(metrics)
        mlflow.log_dict(confusion_payload, "confusion_matrix.json")
        mlflow.log_text(classification_text, "classification_report.txt")

        if args.register_to_mlflow_registry:
            mlflow.sklearn.log_model(
                sk_model=model,
                artifact_path="model",
                registered_model_name=args.registered_model_name,
            )
            logger.info(
                "Registered model '%s' in MLflow Model Registry",
                args.registered_model_name,
            )
            if args.transition_stage:
                transition_registered_model(
                    model_name=args.registered_model_name,
                    stage=args.transition_stage,
                    tracking_uri=args.tracking_uri,
                )
        else:
            mlflow.sklearn.log_model(
                sk_model=model,
                artifact_path="model",
            )
            logger.info("Logged model artifact without registry registration")

        print(f"\nMLflow run completed: run_id={run.info.run_id}")
        print(f"Metrics: {metrics}")

    return metrics


def main() -> None:
    """CLI entrypoint."""
    args = parse_args()
    train(args)


if __name__ == "__main__":
    main()
