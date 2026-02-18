# --- Phase II "Zero-Conflict" Automation Script ---

# 1. Cleanup: Purane phanse huay ports ko kill karein
$ports = @(3000, 3001, 8000, 8001)
Write-Host "Searching for old processes on ports: $($ports -join ', ')..." -ForegroundColor Cyan

foreach ($port in $ports) {
    $pidToKill = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -First 1
    if ($pidToKill) {
        Write-Host "Found process $pidToKill on Port $port. Killing it now..." -ForegroundColor Red
        Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "Cleanup complete! System is fresh." -ForegroundColor Green
Write-Host "------------------------------------"

# 2. Start Backend (Port 8000)
Write-Host "Starting FastAPI Backend on Port 8000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; python -m uvicorn main:app --reload --port 8000"

# 3. Wait for Backend to initialize
Start-Sleep -Seconds 3

# 4. Start Frontend (Port 3000)
Write-Host "Starting Next.js Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "Both services are now running in separate windows!" -ForegroundColor Green