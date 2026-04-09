param(
    [int]$Port = 8000,
    [switch]$NoReload
)

$pythonPath = Join-Path $PSScriptRoot ".venv\Scripts\python.exe"

if (-not (Test-Path $pythonPath)) {
    Write-Error "backend\.venv was not found. Create it first, then install backend requirements."
    exit 1
}

$arguments = @(
    "-m",
    "uvicorn",
    "main:app",
    "--host",
    "127.0.0.1",
    "--port",
    $Port.ToString()
)

if (-not $NoReload) {
    $arguments += "--reload"
}

Write-Host "Starting backend with:" $pythonPath
& $pythonPath @arguments
