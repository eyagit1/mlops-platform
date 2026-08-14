export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export const EXTERNAL_LINKS = {
  swagger: `${API_BASE_URL}/docs`,
  metrics: `${API_BASE_URL}/metrics`,
  mlflow: 'http://localhost:5000',
  prometheus: 'http://localhost:9090',
  grafana: 'http://localhost:3000',
};

export const IRIS_LABELS = ['setosa', 'versicolor', 'virginica'];

// Fallback candidate URLs to avoid IPv6 vs IPv4 localhost resolution issues in browsers
const BASE_URL_CANDIDATES = [
  API_BASE_URL,
  API_BASE_URL.replace('localhost', '127.0.0.1'),
  API_BASE_URL.replace('127.0.0.1', 'localhost'),
  'http://127.0.0.1:8000',
  'http://localhost:8000',
  '',
].filter((url, idx, arr) => arr.indexOf(url) === idx);

let activeBaseUrl = API_BASE_URL;

async function fetchWithFallback(path, options = {}) {
  const urlsToTry = [
    activeBaseUrl,
    ...BASE_URL_CANDIDATES.filter((u) => u !== activeBaseUrl),
  ];

  let lastError;
  for (const base of urlsToTry) {
    try {
      const response = await fetch(`${base}${path}`, options);
      activeBaseUrl = base;
      return response;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error('Failed to fetch from backend');
}

async function parseError(response) {
  let detail = `HTTP ${response.status}`;
  try {
    const body = await response.json();
    if (body.detail) {
      detail = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail);
    }
  } catch {
    // ignore JSON parse errors
  }
  const error = new Error(detail);
  error.status = response.status;
  return error;
}

async function timedRequest(path, options = {}) {
  const start = performance.now();
  const response = await fetchWithFallback(path, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const durationMs = Math.round(performance.now() - start);

  if (!response.ok) {
    throw await parseError(response);
  }

  const data = await response.json();
  return { data, durationMs };
}

export async function getHealth() {
  const start = performance.now();
  const response = await fetchWithFallback('/health');
  const durationMs = Math.round(performance.now() - start);
  if (!response.ok) {
    throw await parseError(response);
  }
  const data = await response.json();
  return { data, durationMs };
}

export function predict(features) {
  return timedRequest('/predict', {
    method: 'POST',
    body: JSON.stringify({ features }),
  });
}

export function classify(text) {
  return timedRequest('/classify', {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

export function ragIngest(docId, text, metadata = {}) {
  return timedRequest('/rag/ingest', {
    method: 'POST',
    body: JSON.stringify({ doc_id: docId, text, metadata }),
  });
}

export function ragQuery(query, topK = 2) {
  return timedRequest('/rag/query', {
    method: 'POST',
    body: JSON.stringify({ query, top_k: topK }),
  });
}

export function ragAsk(question, topK = 3) {
  return timedRequest('/rag/ask', {
    method: 'POST',
    body: JSON.stringify({ question, top_k: topK }),
  });
}
