import os
from pathlib import Path
from typing import Any, Dict, List, Optional

import chromadb
from chromadb.utils import embedding_functions
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

import chromadb
from chromadb.utils import embedding_functions
from groq import Groq


class RAGEngine:
    """ChromaDB-backed retrieval engine with sentence-transformers embeddings."""

    DEFAULT_MODEL = "all-MiniLM-L6-v2"
    DEFAULT_COLLECTION = "document_knowledgebase"

    def __init__(
        self,
        db_path: Optional[str] = None,
        collection_name: Optional[str] = None,
        embedding_model: Optional[str] = None,
    ) -> None:
        self.db_path = db_path or os.getenv("CHROMA_DB_PATH", "./data/chroma_db")
        Path(self.db_path).mkdir(parents=True, exist_ok=True)

        self.collection_name = collection_name or os.getenv(
            "CHROMA_COLLECTION_NAME", self.DEFAULT_COLLECTION
        )
        model_name = embedding_model or os.getenv("EMBEDDING_MODEL", self.DEFAULT_MODEL)

        self.client = chromadb.PersistentClient(path=self.db_path)
        self.embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name=model_name
        )
        self.collection = self.client.get_or_create_collection(
            name=self.collection_name,
            embedding_function=self.embedding_fn,
        )

        # --- Groq client for answer generation ---
        groq_key = os.getenv("GROQ_API_KEY")
        self.groq_client = Groq(api_key=groq_key) if groq_key else None
        self.groq_model = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")

    def ingest_document(
        self,
        doc_id: str,
        text: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, str]:
        payload_metadata = metadata if metadata else {"doc_id": doc_id}
        self.collection.upsert(
            documents=[text],
            ids=[doc_id],
            metadatas=[payload_metadata],
        )
        return {"status": "success", "doc_id": doc_id}

    def query(self, query_text: str, top_k: int = 2) -> Dict[str, Any]:
        if top_k < 1:
            raise ValueError("top_k must be at least 1")

        results = self.collection.query(
            query_texts=[query_text],
            n_results=min(top_k, max(self.collection.count(), 1)),
        )

        retrieved_chunks: List[str] = results["documents"][0] if results["documents"] else []
        metadatas: List[Dict[str, Any]] = (
            results["metadatas"][0] if results["metadatas"] else []
        )
        distances: List[float] = results["distances"][0] if results.get("distances") else []

        return {
            "query": query_text,
            "retrieved_context": retrieved_chunks,
            "metadata": metadatas,
            "distances": distances,
            "collection_size": self.collection.count(),
        }
    def generate_answer(self, question: str, top_k: int = 3) -> Dict[str, Any]:
        """Retrieve relevant chunks, then generate a grounded answer with Groq."""
        if self.groq_client is None:
            raise RuntimeError(
                "GROQ_API_KEY is not configured. Set it in your .env file to use /rag/ask."
            )

        retrieved = self.query(question, top_k=top_k)

        if not retrieved["retrieved_context"]:
            return {
                "question": question,
                "answer": "No relevant documents found in the knowledge base yet.",
                "sources": [],
                "metadata": [],
            }

        context_text = "\n\n---\n\n".join(retrieved["retrieved_context"])

        prompt = f"""Answer the question using ONLY the context below.
If the context doesn't contain the answer, say you don't know.

Context:
{context_text}

Question: {question}

Answer:"""

        completion = self.groq_client.chat.completions.create(
            model=self.groq_model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=500,
        )

        return {
            "question": question,
            "answer": completion.choices[0].message.content,
            "sources": retrieved["retrieved_context"],
            "metadata": retrieved["metadata"],
        }
