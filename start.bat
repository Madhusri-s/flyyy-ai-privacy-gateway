@echo off
echo ============================================================
echo   FLYYY.AI Privacy Platform — Starting Services
echo ============================================================
echo.
echo [1/2] Starting Backend API on http://127.0.0.1:8000
start "FLYYY Backend" cmd /k "cd /d %~dp0 && venv\Scripts\python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 4 /nobreak > nul

echo [2/2] Starting Frontend on http://127.0.0.1:5173
start "FLYYY Frontend" cmd /k "cd /d %~dp0 && npm --prefix frontend run dev -- --host 127.0.0.1 --port 5173"

timeout /t 4 /nobreak > nul

echo.
echo ============================================================
echo   Platform running!
echo   Backend API  -> http://127.0.0.1:8000
echo   Frontend UI  -> http://127.0.0.1:5173
echo   API Docs     -> http://127.0.0.1:8000/docs
echo ============================================================
echo.
start "" "http://127.0.0.1:5173"
