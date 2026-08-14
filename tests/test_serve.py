"""Tests for inference, document AI, RAG, and monitoring endpoints."""

from unittest.mock import MagicMock


def test_rag_ask_success(client_with_model, rag_engine, monkeypatch):
    mock_completion = MagicMock()
    mock_completion.choices[0].message.content = "Mocked answer."
    mock_groq_client = MagicMock()
    mock_groq_client.chat.completions.create.return_value = mock_completion

    monkeypatch.setattr(rag_engine, "groq_client", mock_groq_client)

    client_with_model.post("/rag/ingest", json={"doc_id": "t1", "text": "test content"})
    response = client_with_model.post("/rag/ask", json={"question": "test question"})

    assert response.status_code == 200
    assert response.json()["answer"] == "Mocked answer."


def test_rag_ask_no_groq_key(client_with_model, rag_engine, monkeypatch):
    monkeypatch.setattr(rag_engine, "groq_client", None)

    response = client_with_model.post("/rag/ask", json={"question": "test question"})
    assert response.status_code == 503


def test_predict_returns_class_index(client_with_model) -> None:
    response = client_with_model.post(
        "/predict",
        json={"features": [[5.1, 3.5, 1.4, 0.2]]},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["predictions"] == [0]


def test_predict_rejects_invalid_input(client_with_model) -> None:
    response = client_with_model.post(
        "/predict",
        json={"features": [[5.1, 3.5, 1.4]]},
    )
    assert response.status_code == 400


def test_health_reports_model_loaded(client_with_model) -> None:
    response = client_with_model.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "healthy"
    assert body["model_loaded"] is True
    assert body["rag_engine"] == "ready"


def test_classify_invoice_document(client_with_model) -> None:
    text = (
        "INVOICE #1042\n"
        "Bill To: client@example.com\n"
        "Date: 08/10/2026\n"
        "Total amount due: $1,250.00\n"
        "Tax and billing details included."
    )
    response = client_with_model.post("/classify", json={"text": text})
    assert response.status_code == 200
    body = response.json()
    assert body["classification"]["category"] == "Invoice"
    assert body["classification"]["confidence"] > 0
    assert "client@example.com" in body["extraction"]["extracted_emails"]
    assert body["extraction"]["extracted_dates"]
    assert body["extraction"]["potential_amounts"]


def test_classify_rejects_empty_text(client_with_model) -> None:
    response = client_with_model.post("/classify", json={"text": "   "})
    assert response.status_code == 400


def test_rag_ingest_and_query(client_with_model) -> None:
    doc_id = "mlops-spec-doc"
    ingest_response = client_with_model.post(
        "/rag/ingest",
        json={
            "doc_id": doc_id,
            "text": "The MLOps platform uses MLflow for experiment tracking and ChromaDB for RAG.",
            "metadata": {"source": "unit-test"},
        },
    )
    assert ingest_response.status_code == 200
    assert ingest_response.json()["status"] == "success"
    assert ingest_response.json()["doc_id"] == doc_id

    query_response = client_with_model.post(
        "/rag/query",
        json={"query": "How is experiment tracking handled?", "top_k": 1},
    )
    assert query_response.status_code == 200
    body = query_response.json()
    assert body["query"] == "How is experiment tracking handled?"
    assert len(body["retrieved_context"]) >= 1
    assert "MLflow" in body["retrieved_context"][0]
    assert body["collection_size"] >= 1


def test_rag_query_rejects_empty_query(client_with_model) -> None:
    response = client_with_model.post("/rag/query", json={"query": "  "})
    assert response.status_code == 400


def test_metrics_endpoint_exposes_prometheus(client_with_model) -> None:
    client_with_model.post("/predict", json={"features": [[5.1, 3.5, 1.4, 0.2]]})
    client_with_model.post(
        "/classify",
        json={"text": "Invoice total due $100 for billing and tax."},
    )
    client_with_model.post(
        "/rag/ingest",
        json={"doc_id": "metrics-doc", "text": "Prometheus tracks API latency."},
    )
    client_with_model.post("/rag/query", json={"query": "latency monitoring"})

    response = client_with_model.get("/metrics")
    assert response.status_code == 200
    metrics_text = response.text
    assert "mlops_predictions_total" in metrics_text
    assert "mlops_http_requests_total" in metrics_text
    assert "mlops_prediction_latency_seconds" in metrics_text
    assert 'endpoint="/classify"' in metrics_text
    assert 'endpoint="/rag/ingest"' in metrics_text
    assert 'endpoint="/rag/query"' in metrics_text
