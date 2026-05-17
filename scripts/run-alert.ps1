# Start FastAPI alert service (http://localhost:8000)
$ErrorActionPreference = 'Stop'
$Root = Split-Path $PSScriptRoot -Parent
Set-Location (Join-Path $Root 'Backend')
& (Join-Path $PSScriptRoot 'py.ps1') -m uvicorn alert_service:app --reload --host 127.0.0.1 --port 8000
