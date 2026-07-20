@echo off
setlocal EnableExtensions

cd /d "%~dp0"
set "URL=http://127.0.0.1:5173"
set "API_URL=http://127.0.0.1:8787/api/health"
set "WEB_PORT=5173"
set "API_PORT=8787"

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js is required. Install Node.js 20 or newer, then run this file again.
  pause
  exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
  echo npm was not found. Check your Node.js installation, then run this file again.
  pause
  exit /b 1
)

if not exist "node_modules\.bin\vite.cmd" (
  echo Installing project dependencies...
  call npm.cmd install
  if errorlevel 1 (
    echo Dependency installation failed.
    pause
    exit /b 1
  )
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "if (Get-NetTCPConnection -LocalPort %WEB_PORT% -State Listen -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }" >nul 2>&1
if errorlevel 1 (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "if (Get-NetTCPConnection -LocalPort %API_PORT% -State Listen -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }" >nul 2>&1
  if errorlevel 1 (
    echo Starting AlgoNote Web and API...
    start "AlgoNote Web" /min cmd /d /c "cd /d ""%~dp0"" && npm.cmd run dev:web"
    start "AlgoNote API" /min cmd /d /c "cd /d ""%~dp0"" && set PORT=%API_PORT%&& node --import tsx server/index.ts"
  ) else (
    echo Starting AlgoNote Web...
    start "AlgoNote Web" /min cmd /d /c "cd /d ""%~dp0"" && npm.cmd run dev:web"
  )
) else (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "if (Get-NetTCPConnection -LocalPort %API_PORT% -State Listen -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }" >nul 2>&1
  if errorlevel 1 (
    echo Starting AlgoNote API...
    start "AlgoNote API" /min cmd /d /c "cd /d ""%~dp0"" && set PORT=%API_PORT%&& node --import tsx server/index.ts"
  )
)

echo Waiting for AlgoNote at %URL% ...
for /l %%N in (1,1,60) do (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "try { Invoke-WebRequest -UseBasicParsing -Uri '%URL%' -TimeoutSec 2 | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
  if not errorlevel 1 (
    powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "try { Invoke-WebRequest -UseBasicParsing -Uri '%API_URL%' -TimeoutSec 2 | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
    if not errorlevel 1 goto open_site
  )
  timeout /t 1 /nobreak >nul
)

echo AlgoNote did not become ready within 60 seconds.
echo Check the dev server window for details.
pause
exit /b 1

:open_site
start "" "%URL%"
echo AlgoNote is ready: %URL%
exit /b 0
