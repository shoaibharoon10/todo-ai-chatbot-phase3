# --- Phase III "Todo AI Chatbot" Automation Script (Cohere + MCP) ---

# 1. Cleanup: Purane processes ko kill karein
$ports = @(3000, 8000)  # Add more if you use extra ports later (e.g., 8001 for MCP dev)
Write-Host "Cleaning up old processes on ports: $($ports -join ', ')..." -ForegroundColor Cyan

foreach ($port in $ports) {
    $pidToKill = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | 
                 Select-Object -ExpandProperty OwningProcess -First 1
    if ($pidToKill) {
        Write-Host "Killing process $pidToKill on port $port..." -ForegroundColor Red
        Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "Cleanup complete! Fresh start ready." -ForegroundColor Green
Write-Host "------------------------------------"

# 2. Optional: Check required env vars (uncomment if you want strict check)
# $requiredEnv = @("DATABASE_URL", "BETTER_AUTH_SECRET", "COHERE_API_KEY")
# foreach ($var in $requiredEnv) {
#     if (-not (Test-Path Env:$var)) {
#         Write-Host "ERROR: $var not set in .env! Please set it." -ForegroundColor Red
#         exit 1
#     }
# }

# 3. Start Backend (FastAPI with Cohere/MCP integration)
Write-Host "Starting FastAPI Backend (with Cohere tool use & MCP server) on port 8000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; python -m uvicorn main:app --host 0.0.0.0 --reload --port 8000"

# 4. Wait for backend to be ready (increased for DB/Cohere init)
Start-Sleep -Seconds 6

# 5. Start Frontend (Next.js with custom chat UI)
Write-Host "Starting Next.js Frontend (custom Cohere chatbot UI) on port 3000..." -ForegroundColor Yellow
# Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev" #changed to include webpack for better HMR
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev -- --webpack"

Write-Host "All services running in separate windows!" -ForegroundColor Green
Write-Host "Access frontend: http://localhost:3000"
Write-Host "Backend API: http://localhost:8000 (docs at http://localhost:8000/docs)"
Write-Host "Tip: Press Ctrl+C in each window to stop."