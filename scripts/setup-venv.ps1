# One-time setup: create .venv and install Backend dependencies.
$ErrorActionPreference = 'Stop'
$Root = Split-Path $PSScriptRoot -Parent
Set-Location $Root

$VenvDir = if (Test-Path 'venv\Scripts\python.exe') { 'venv' } elseif (Test-Path '.venv\Scripts\python.exe') { '.venv' } else { 'venv' }

if (-not (Test-Path "$VenvDir\Scripts\python.exe")) {
    Write-Host "Creating virtual environment in $VenvDir ..."
    python -m venv $VenvDir
}

Write-Host 'Installing Backend requirements ...'
$Python = Join-Path (Join-Path (Join-Path $Root $VenvDir) 'Scripts') 'python.exe'
& $Python -m pip install --upgrade pip
& $Python -m pip install -r (Join-Path $Root 'Backend\requirements.txt')

Write-Host 'Downloading MediaPipe face landmarker model (one-time) ...'
Set-Location (Join-Path $Root 'Backend')
& $Python -c "from gaze_engine import ensure_face_landmarker_model; ensure_face_landmarker_model()"
Set-Location $Root

Write-Host ''
Write-Host 'Done. Activate with:  .\.venv\Scripts\Activate.ps1'
Write-Host 'Then run:            npm run test:backend'
