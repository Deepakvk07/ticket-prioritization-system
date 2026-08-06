# OmniSupport AI — Quick Start Script (Windows PowerShell)

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "        OmniSupport AI -- Startup Script          " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Update PATH for this session
$env:PATH = "C:\Program Files\nodejs;C:\Users\deepa\AppData\Local\Programs\Python\Launcher;C:\Users\deepa\AppData\Local\Programs\Python\Python314\Scripts;" + $env:PATH

$pyExe = "C:\Users\deepa\AppData\Local\Programs\Python\Launcher\py.exe"
$npmCmd = "C:\Program Files\nodejs\npm.cmd"

Write-Host "[+] Python: & '$pyExe' -3 --version" -ForegroundColor Green
Write-Host "[+] Node: v24.18.1" -ForegroundColor Green
Write-Host ""

# -- Backend Setup ---------------------------------------------
Write-Host "[*] Setting up Python backend..." -ForegroundColor Yellow
Set-Location backend

if (-not (Test-Path "venv")) {
    Write-Host "    Creating virtual environment..."
    & $pyExe -3 -m venv venv
}

$venvPython = "$PWD\venv\Scripts\python.exe"

Write-Host "    Installing Python dependencies..."
& $venvPython -m pip install -r requirements.txt -q

# Train model if not already trained
if (-not (Test-Path "ml\model.pkl")) {
    Write-Host ""
    Write-Host "[*] Training ML model..." -ForegroundColor Cyan
    & $venvPython ml\train.py
} else {
    Write-Host "    [+] ML model already trained -- skipping." -ForegroundColor Green
}

Write-Host ""
Write-Host "[*] Starting FastAPI backend on http://localhost:8000 ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:PATH='C:\Program Files\nodejs;C:\Users\deepa\AppData\Local\Programs\Python\Launcher;' + `$env:PATH; cd '$PWD'; .\venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000"

Set-Location ..

# -- Frontend Setup --------------------------------------------
Write-Host "[*] Setting up React frontend..." -ForegroundColor Yellow
Set-Location frontend

if (-not (Test-Path "node_modules")) {
    Write-Host "    Installing npm dependencies..."
    & $npmCmd install
}

Write-Host "[*] Starting React dev server on http://localhost:5173 ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:PATH='C:\Program Files\nodejs;' + `$env:PATH; cd '$PWD'; & 'C:\Program Files\nodejs\npm.cmd' run dev"

Set-Location ..

Write-Host ""
Write-Host "==================================================" -ForegroundColor Green
Write-Host "  [+] Servers launched successfully!              " -ForegroundColor Green
Write-Host "                                                  " -ForegroundColor Green
Write-Host "  Frontend  ->  http://localhost:5173             " -ForegroundColor Green
Write-Host "  Backend   ->  http://localhost:8000             " -ForegroundColor Green
Write-Host "  API Docs  ->  http://localhost:8000/docs        " -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""
