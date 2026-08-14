import { useState } from 'react';
import { IRIS_LABELS, predict } from '../api/client';
import { useActivity } from '../context/ActivityContext';
import JsonOutput from '../components/JsonOutput';

const DEFAULTS = {
  sepalLength: '5.1',
  sepalWidth: '3.5',
  petalLength: '1.4',
  petalWidth: '0.2',
};

export default function InferenceML() {
  const { logActivity } = useActivity();
  const [inputs, setInputs] = useState(DEFAULTS);
  const [response, setResponse] = useState(null);
  const [displayInfo, setDisplayInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (field) => (event) => {
    setInputs((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handlePredict = async () => {
    setLoading(true);
    setError(null);
    try {
      const features = [[
        parseFloat(inputs.sepalLength),
        parseFloat(inputs.sepalWidth),
        parseFloat(inputs.petalLength),
        parseFloat(inputs.petalWidth),
      ]];

      const { data, durationMs } = await predict(features);
      setResponse(data);

      const classIndex = data.predictions[0];
      setDisplayInfo({
        classIndex,
        species: IRIS_LABELS[classIndex] ?? 'inconnu',
      });

      logActivity('POST /predict', durationMs);
    } catch (err) {
      setError(err.message);
      setResponse(null);
      setDisplayInfo(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-grid two-col">
      <div className="card">
        <span className="eyebrow">RANDOM FOREST MODEL</span>
        <h2 className="card-title">Iris Prediction</h2>

        <div className="input-grid">
          <label className="field">
            <span>Sepal Length</span>
            <input
              type="number"
              step="any"
              value={inputs.sepalLength}
              onChange={handleChange('sepalLength')}
            />
          </label>
          <label className="field">
            <span>Sepal Width</span>
            <input
              type="number"
              step="any"
              value={inputs.sepalWidth}
              onChange={handleChange('sepalWidth')}
            />
          </label>
          <label className="field">
            <span>Petal Length</span>
            <input
              type="number"
              step="any"
              value={inputs.petalLength}
              onChange={handleChange('petalLength')}
            />
          </label>
          <label className="field">
            <span>Petal Width</span>
            <input
              type="number"
              step="any"
              value={inputs.petalWidth}
              onChange={handleChange('petalWidth')}
            />
          </label>
        </div>

        {displayInfo && (
          <p className="result-hint">
            Predicted species: <strong>{displayInfo.species}</strong> (class{' '}
            {displayInfo.classIndex})
          </p>
        )}

        <button
          type="button"
          className="btn-primary"
          onClick={handlePredict}
          disabled={loading}
        >
          {loading ? 'Predicting...' : 'Predict'}
        </button>

        {error && <p className="inline-error">{error}</p>}

        <JsonOutput data={response} />
      </div>

      <div className="card">
        <span className="eyebrow">TRACKING</span>
        <h2 className="card-title">Pipeline MLflow</h2>

        <div className="info-box">
          <span className="info-box-label">Experience</span>
          <span className="info-box-value">Iris_Classification</span>
        </div>

        {displayInfo ? (
          <div className="info-box">
            <span className="info-box-label">Last prediction</span>
                <span className="info-box-value">
                  Class {displayInfo.classIndex} — {displayInfo.species}
                </span>
          </div>
        ) : (
          <div className="info-box placeholder-box">
            <span className="info-box-value">
              Run a prediction to see the run details.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
