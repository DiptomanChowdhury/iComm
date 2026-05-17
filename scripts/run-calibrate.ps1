# Run 9-point gaze calibration (requires webcam)
$ErrorActionPreference = 'Stop'
$Root = Split-Path $PSScriptRoot -Parent
Set-Location (Join-Path $Root 'Backend')
& (Join-Path $PSScriptRoot 'py.ps1') calibration.py
