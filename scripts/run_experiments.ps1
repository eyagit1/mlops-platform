# Run 4 Iris training experiments with different hyperparameters.
# Requires MLflow tracking server: mlflow ui --port 5000

$ErrorActionPreference = "Stop"
$env:MLFLOW_TRACKING_URI = "http://localhost:5000"
$env:MLFLOW_REGISTER_TO_REGISTRY = "0"

Write-Host "Experiment 1: shallow trees"
python src/train.py --run-name "exp-1-shallow" --n-estimators 50 --max-depth 2

Write-Host "Experiment 2: medium trees"
python src/train.py --run-name "exp-2-medium" --n-estimators 100 --max-depth 5

Write-Host "Experiment 3: deep forest"
python src/train.py --run-name "exp-3-deep" --n-estimators 200 --max-depth 10

Write-Host "Experiment 4: unlimited depth"
python src/train.py --run-name "exp-4-unlimited" --n-estimators 300

Write-Host ""
Write-Host "Open MLflow UI to compare runs: http://localhost:5000"
Write-Host "Register best run with:"
Write-Host '  $env:MLFLOW_REGISTER_TO_REGISTRY="1"'
Write-Host '  python src/train.py --run-name best-run --n-estimators 200 --max-depth 5 --register-to-mlflow-registry --transition-stage Production'
