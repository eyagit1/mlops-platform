#!/usr/bin/env bash
set -euo pipefail

export MLFLOW_TRACKING_URI="${MLFLOW_TRACKING_URI:-http://localhost:5000}"
export MLFLOW_REGISTER_TO_REGISTRY="${MLFLOW_REGISTER_TO_REGISTRY:-0}"

echo "Experiment 1: shallow trees"
python src/train.py --run-name "exp-1-shallow" --n-estimators 50 --max-depth 2

echo "Experiment 2: medium trees"
python src/train.py --run-name "exp-2-medium" --n-estimators 100 --max-depth 5

echo "Experiment 3: deep forest"
python src/train.py --run-name "exp-3-deep" --n-estimators 200 --max-depth 10

echo "Experiment 4: unlimited depth"
python src/train.py --run-name "exp-4-unlimited" --n-estimators 300 --max-depth ""

echo
echo "Open MLflow UI to compare runs: ${MLFLOW_TRACKING_URI}"
echo "Register best run with:"
echo '  MLFLOW_REGISTER_TO_REGISTRY=1 python src/train.py --run-name best-run --n-estimators 200 --max-depth 5 --register-to-mlflow-registry --transition-stage Production'
