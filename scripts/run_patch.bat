@echo off
REM Usage: run_patch.bat [XAMPP_PATH]
SET XAMPP_PATH=%1
IF "%XAMPP_PATH%"=="" SET XAMPP_PATH=C:\xampp
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0patch_xampp_configs.ps1" -XamppPath "%XAMPP_PATH%"
PAUSE