# Run Python from project .venv when present, otherwise system Python.
param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Args
)

$Root = Split-Path $PSScriptRoot -Parent
$Candidates = @(
    (Join-Path (Join-Path (Join-Path $Root 'venv') 'Scripts') 'python.exe'),
    (Join-Path (Join-Path (Join-Path $Root '.venv') 'Scripts') 'python.exe')
)

$VenvPython = $Candidates | Where-Object { Test-Path $_ } | Select-Object -First 1

if ($VenvPython) {
    & $VenvPython @Args
} else {
    & python @Args
}

exit $LASTEXITCODE
