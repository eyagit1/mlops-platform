export default function JsonOutput({ data, label = 'JSON Response' }) {
  const text =
    data === null || data === undefined
      ? '// En attente d\'une réponse...'
      : JSON.stringify(data, null, 2);

  return (
    <div className="json-output-wrap">
      {label && <span className="json-output-label">{label}</span>}
      <pre className="json-output">{text}</pre>
    </div>
  );
}
