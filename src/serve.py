import os
import time
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
import joblib
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest

from src.classifier import DocumentProcessor
from src.metrics import LATENCY_HISTOGRAM, PREDICTION_COUNTER, REQUEST_COUNTER
from src.rag import RAGEngine

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL = None
MODEL_PATH = os.getenv("MODEL_LOCAL_PATH", str(BASE_DIR / "data" / "iris_model.pkl"))
doc_processor = DocumentProcessor()
rag_engine: Optional[RAGEngine] = None


def get_model():
    global MODEL
    if MODEL is None and os.path.exists(MODEL_PATH):
        try:
            MODEL = joblib.load(MODEL_PATH)
            print(f"Loaded model successfully from {MODEL_PATH}")
        except Exception as exc:
            print(f"Failed to load model: {exc}")
    return MODEL


def get_rag_engine() -> RAGEngine:
    global rag_engine
    if rag_engine is None:
        rag_engine = RAGEngine()
    return rag_engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    get_model()
    yield


app = FastAPI(
    title="MLOps AI Engine & Serving API",
    description=(
        "Production API for model inference, document classification, "
        "metadata extraction, and RAG retrieval"
    ),
    version="2.1.0",
    lifespan=lifespan,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def monitor_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time

    endpoint = request.url.path
    status_code = str(response.status_code)

    REQUEST_COUNTER.labels(endpoint=endpoint, status=status_code).inc()
    LATENCY_HISTOGRAM.labels(endpoint=endpoint).observe(duration)

    return response


class IrisPredictRequest(BaseModel):
    features: List[List[float]] = Field(
        ...,
        description="Batch of Iris feature vectors (4 floats each)",
        min_length=1,
    )


class IrisPredictResponse(BaseModel):
    predictions: List[int]


class DocumentRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Raw document text")


class ClassificationResult(BaseModel):
    category: str
    confidence: float
    scores: Optional[Dict[str, int]] = None


class ExtractionResult(BaseModel):
    extracted_emails: List[str]
    extracted_dates: List[str]
    potential_amounts: List[str]


class ClassifyResponse(BaseModel):
    classification: ClassificationResult
    extraction: ExtractionResult


class IngestRequest(BaseModel):
    doc_id: str = Field(..., min_length=1)
    text: str = Field(..., min_length=1)
    metadata: Optional[Dict[str, Any]] = None


class IngestResponse(BaseModel):
    status: str
    doc_id: str


class RAGQueryRequest(BaseModel):
    query: str = Field(..., min_length=1)
    top_k: int = Field(default=2, ge=1, le=20)


class RAGQueryResponse(BaseModel):
    query: str
    retrieved_context: List[str]
    metadata: List[Dict[str, Any]]
    distances: List[float]
    collection_size: int


class RAGAskRequest(BaseModel):
    question: str = Field(..., min_length=1)
    top_k: int = Field(default=3, ge=1, le=20)


class RAGAskResponse(BaseModel):
    question: str
    answer: str
    sources: List[str]
    metadata: List[Dict[str, Any]]


@app.get("/")
def root() -> Dict[str, str]:
    return {
        "service": "MLOps AI Platform API",
        "status": "online",
        "version": "2.1.0",
    }


@app.get("/health")
def health_check() -> Dict[str, Any]:
    model = get_model()
    # Determine RAG readiness: require Groq API key or initialized rag_engine
    groq_key = os.getenv("GROQ_API_KEY")
    rag_ready = bool(groq_key) or ('rag_engine' in globals() and rag_engine is not None)

    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "rag_engine": "ready" if rag_ready else "disabled",
    }


@app.get("/metrics")
def metrics() -> Response:
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)


@app.post("/predict", response_model=IrisPredictResponse)
def predict_iris(payload: IrisPredictRequest) -> IrisPredictResponse:
    model = get_model()
    if model is None:
        PREDICTION_COUNTER.labels(model_type="iris", status="error").inc()
        raise HTTPException(status_code=503, detail="Model not loaded or unavailable")

    try:
        predictions = model.predict(payload.features).tolist()
        PREDICTION_COUNTER.labels(model_type="iris", status="success").inc()
        return IrisPredictResponse(predictions=predictions)
    except Exception as exc:
        PREDICTION_COUNTER.labels(model_type="iris", status="error").inc()
        raise HTTPException(status_code=400, detail=f"Inference error: {exc}") from exc


@app.post("/classify", response_model=ClassifyResponse)
def classify_document(payload: DocumentRequest) -> ClassifyResponse:
    text = payload.text.strip()
    if not text:
        PREDICTION_COUNTER.labels(model_type="document_classification", status="error").inc()
        raise HTTPException(status_code=400, detail="Document text cannot be empty.")

    try:
        result = doc_processor.process(text)
        PREDICTION_COUNTER.labels(model_type="document_classification", status="success").inc()
        return ClassifyResponse(**result)
    except Exception as exc:
        PREDICTION_COUNTER.labels(model_type="document_classification", status="error").inc()
        raise HTTPException(status_code=500, detail=f"Classification error: {exc}") from exc


@app.post("/rag/ingest", response_model=IngestResponse)
def ingest_rag_document(payload: IngestRequest) -> IngestResponse:
    text = payload.text.strip()
    if not text:
        PREDICTION_COUNTER.labels(model_type="rag_ingest", status="error").inc()
        raise HTTPException(status_code=400, detail="Document content cannot be empty.")

    try:
        result = get_rag_engine().ingest_document(
            doc_id=payload.doc_id,
            text=text,
            metadata=payload.metadata,
        )
        PREDICTION_COUNTER.labels(model_type="rag_ingest", status="success").inc()
        return IngestResponse(**result)
    except Exception as exc:
        PREDICTION_COUNTER.labels(model_type="rag_ingest", status="error").inc()
        raise HTTPException(status_code=500, detail=f"Ingestion error: {exc}") from exc


@app.post("/rag/query", response_model=RAGQueryResponse)
def query_rag_knowledgebase(payload: RAGQueryRequest) -> RAGQueryResponse:
    query = payload.query.strip()
    if not query:
        PREDICTION_COUNTER.labels(model_type="rag_query", status="error").inc()
        raise HTTPException(status_code=400, detail="Query text cannot be empty.")

    try:
        results = get_rag_engine().query(query_text=query, top_k=payload.top_k)
        PREDICTION_COUNTER.labels(model_type="rag_query", status="success").inc()
        return RAGQueryResponse(**results)
    except Exception as exc:
        PREDICTION_COUNTER.labels(model_type="rag_query", status="error").inc()
        raise HTTPException(status_code=500, detail=f"RAG query error: {exc}") from exc


@app.post("/rag/ask", response_model=RAGAskResponse)
def ask_rag(payload: RAGAskRequest) -> RAGAskResponse:
    question = payload.question.strip()
    if not question:
        PREDICTION_COUNTER.labels(model_type="rag_generate", status="error").inc()
        raise HTTPException(status_code=400, detail="Question text cannot be empty.")

    try:
        result = get_rag_engine().generate_answer(question=question, top_k=payload.top_k)
        PREDICTION_COUNTER.labels(model_type="rag_generate", status="success").inc()
        return RAGAskResponse(**result)
    except RuntimeError as exc:
        # GROQ_API_KEY not configured — distinct from a real server error
        PREDICTION_COUNTER.labels(model_type="rag_generate", status="error").inc()
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        PREDICTION_COUNTER.labels(model_type="rag_generate", status="error").inc()
        raise HTTPException(status_code=500, detail=f"RAG generation error: {exc}") from exc
