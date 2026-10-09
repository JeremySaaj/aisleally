@echo off
cd /d "%~dp0"
echo Building AisleAlly frontend...
npm run build
if %errorlevel% neq 0 (
  echo BUILD FAILED - see errors above
  pause
  exit /b 1
)
echo.
echo BUILD SUCCEEDED
pause
