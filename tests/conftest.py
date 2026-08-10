"""Shared pytest fixtures for API tests."""

from pathlib import Path

import joblib
import pytest
from fastapi.testclient import TestClient
from sklearn.datasets import load_iris
from sklearn.ensemble import RandomForestClassifier

from src.rag import RAGEngine


@pytest.fixture(scope="session")
def trained_model_path(tmp_path_factory) -> str:
    """Train and persist a small Iris model for inference tests."""
    iris = load_iris()
    model = RandomForestClassifier(n_estimators=10, max_depth=2, random_state=42)
    model.fit(iris.data, iris.target)

    model_dir = tmp_path_factory.mktemp("models")
    model_path = model_dir / "iris_model.pkl"
    joblib.dump(model, model_path)
    return str(model_path)


@pytest.fixture(scope="session")
def rag_engine(tmp_path_factory) -> RAGEngine:
    """Session-scoped RAG engine to avoid reloading embeddings per test."""
    chroma_dir = tmp_path_factory.mktemp("chroma")
    return RAGEngine(db_path=str(chroma_dir))


@pytest.fixture
def client_with_model(trained_model_path: str, rag_engine: RAGEngine) -> TestClient:
    """FastAPI test client with Iris model and RAG engine wired in."""
    import src.serve as serve_module

    serve_module.MODEL = joblib.load(trained_model_path)
    serve_module.rag_engine = rag_engine

    with TestClient(serve_module.app) as client:
        yield client
