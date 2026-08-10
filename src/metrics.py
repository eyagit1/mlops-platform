"""Prometheus metrics shared by the serving API."""

from prometheus_client import Counter, Histogram

PREDICTION_COUNTER = Counter(
    "mlops_predictions_total",
    "Total prediction count",
    ["model_type", "status"],
)

REQUEST_COUNTER = Counter(
    "mlops_http_requests_total",
    "Total HTTP requests count",
    ["endpoint", "status"],
)

LATENCY_HISTOGRAM = Histogram(
    "mlops_prediction_latency_seconds",
    "Request latency in seconds",
    ["endpoint"],
)
