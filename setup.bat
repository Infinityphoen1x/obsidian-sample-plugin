@echo off
REM Quick setup script for Windows - installs dependencies and runs initial tests
REM Usage: setup.bat [vault-path]

cd /d "%~dp0"

echo.
echo 🚀 Metadata Organizer - Quick Setup
echo ====================================
echo.

REM Check if vault path provided
if not "%1"=="" (
    set OBSIDIAN_VAULT=%1
    echo Vault path: %OBSIDIAN_VAULT%
    echo.
)

REM Run the install script
call scripts\install-plugin.bat

echo.
echo ✨ Setup complete! Your plugin is ready.
echo.
echo 📖 For detailed instructions, see: INSTALL.md
echo.
