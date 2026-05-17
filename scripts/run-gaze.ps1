# Start gaze WebSocket server (ws://localhost:8765)
$ErrorActionPreference = 'Stop'
$Root = Split-Path $PSScriptRoot -Parent
Set-Location (Join-Path $Root 'Backend')
& (Join-Path $PSScriptRoot 'py.ps1') gaze_engine.py
