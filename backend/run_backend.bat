@echo off
setlocal

set PORT=5069
set APPDIR=C:\Users\administrator.OILCHEM\Documents\GitHub\oc_enex_dashboard\backend
set PY=%APPDIR%\venv\Scripts\python.exe

mkdir C:\logs 2>nul
set LOG=C:\logs\oc_enex_backend.log

echo [%date% %time%] Starting OC_ENEX backend... >> %LOG%

REM Kill anything already listening on the port (prevents WinError 10048)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /r /c:":%PORT% .*LISTENING"') do (
  echo [%date% %time%] Killing PID %%a on port %PORT% >> %LOG%
  taskkill /PID %%a /F >> %LOG% 2>&1
)

cd /d %APPDIR%

echo [%date% %time%] Running: %PY% -m uvicorn app.main:app --host 127.0.0.1 --port %PORT% >> %LOG%
%PY% -m uvicorn app.main:app --host 127.0.0.1 --port %PORT% >> %LOG% 2>&1