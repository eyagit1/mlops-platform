"""
Backward-compatible entrypoint.

The FastAPI application lives in `src.serve`.
"""

from src.serve import app  # noqa: F401
