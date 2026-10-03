@echo off
REM Helper to start XAMPP, import DB schema, and launch frontend dev server.
SETLOCAL
SET XAMPP_PATH=C:\xampp

echo Using XAMPP path: %XAMPP_PATH%

:: 1) Start XAMPP control panel
IF EXIST "%XAMPP_PATH%\xampp-control.exe" (
    start "XAMPP Control" "%XAMPP_PATH%\xampp-control.exe"
) ELSE IF EXIST "%XAMPP_PATH%\xampp_start.exe" (
    start "XAMPP Start" "%XAMPP_PATH%\xampp_start.exe"
) ELSE (
    echo Could not find xampp-control.exe or xampp_start.exe at %XAMPP_PATH%
)

echo Please start Apache and MySQL from the XAMPP Control Panel, then press any key to continue...
PAUSE>nul

:: 2) Import DB schema (if MySQL CLI exists)
SET SCHEMA_PATH=%~dp0..\backend\database\schema.sql
IF EXIST "%XAMPP_PATH%\mysql\bin\mysql.exe" (
    echo Importing schema from %SCHEMA_PATH% ...
    "%XAMPP_PATH%\mysql\bin\mysql.exe" -u root < "%SCHEMA_PATH%"
    IF %ERRORLEVEL% EQU 0 (
        echo Database import completed.
    ) ELSE (
        echo Database import returned error code %ERRORLEVEL%.
    )
) ELSE (
    echo MySQL CLI not found at %XAMPP_PATH%\mysql\bin\mysql.exe. Skipping DB import.
)

:: 3) Ensure backend DB config is correct
echo Please ensure backend database credentials in backend/config/config.php are correct (DB host, user, password, name).

:: 4) Start frontend dev server
cd /d %~dp0..\frontend
if exist package.json (
    echo Installing frontend dependencies (this may take a while)...
    echo Frontend dev server starting in a new window.
    start cmd /k "npm install && npm run dev"
) else (
    echo package.json not found in frontend folder. Skipping frontend.
)

echo Done. Keep this terminal open if you need backend logs, or close it.
pause