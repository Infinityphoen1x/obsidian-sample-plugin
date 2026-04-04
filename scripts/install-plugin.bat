@echo off
REM Metadata Organizer Plugin - Installation Script for Windows
REM This script sets up the plugin for local development and testing

cd /d "%~dp0\.."
set PROJECT_ROOT=%CD%
set PLUGIN_ID=metadata-organizer

echo.
echo 🚀 Metadata Organizer Plugin Installation
echo ==========================================
echo.

REM Step 1: Check Node.js
echo ✓ Checking Node.js...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo   Node.js version: %NODE_VERSION%
echo.

REM Step 2: Install dependencies
echo 📦 Installing dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm install failed
    pause
    exit /b 1
)
echo ✓ Dependencies installed
echo.

REM Step 3: Build the plugin
echo 🔨 Building plugin...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Build failed
    pause
    exit /b 1
)
echo ✓ Plugin built successfully
echo.

REM Step 4: Run tests
echo 🧪 Running unit tests...
call npm test
echo ✓ Tests completed
echo.

REM Step 5: Check for required files
echo ✓ Verifying build artifacts...
if exist "%PROJECT_ROOT%\main.js" (
    echo   ✓ main.js
) else (
    echo   ❌ main.js
)
if exist "%PROJECT_ROOT%\manifest.json" (
    echo   ✓ manifest.json
) else (
    echo   ❌ manifest.json
)
if exist "%PROJECT_ROOT%\styles.css" (
    echo   ✓ styles.css
) else (
    echo   ⚠  styles.css (optional)
)
echo.

REM Step 6: Installation instructions
echo 📋 Installation Instructions:
echo ============================
echo.
echo To install the plugin in Obsidian:
echo.
echo OPTION 1: Manual Installation (Recommended for Development)
echo ---
echo 1. Open Obsidian and go to Settings → About → Vault folder location
echo 2. Navigate to: VAULT_PATH\.obsidian\plugins\%PLUGIN_ID%
echo 3. Copy the following files:
echo    - main.js
echo    - manifest.json
echo    - styles.css (if present)
echo.
echo    From: %PROJECT_ROOT%
echo.
echo 4. Reload Obsidian (Ctrl+R) or restart the app
echo 5. Enable the plugin in Settings → Community plugins
echo.

REM Step 7: If OBSIDIAN_VAULT is set, perform installation
if not "%OBSIDIAN_VAULT%"=="" (
    echo 🔗 Installing to vault: %OBSIDIAN_VAULT%
    set PLUGIN_DIR=%OBSIDIAN_VAULT%\.obsidian\plugins\%PLUGIN_ID%
    
    if not exist "!PLUGIN_DIR!" (
        mkdir "!PLUGIN_DIR!"
        echo ✓ Created plugin directory
    )
    
    copy "%PROJECT_ROOT%\main.js" "!PLUGIN_DIR!\"
    copy "%PROJECT_ROOT%\manifest.json" "!PLUGIN_DIR!\"
    if exist "%PROJECT_ROOT%\styles.css" (
        copy "%PROJECT_ROOT%\styles.css" "!PLUGIN_DIR!\"
    )
    
    echo ✓ Plugin installed to: !PLUGIN_DIR!
    echo.
    echo Next steps:
    echo   1. Reload Obsidian (Ctrl+R)
    echo   2. Go to Settings → Community plugins
    echo   3. Find '%PLUGIN_ID%' and enable it
)

echo.
echo 🎉 Installation complete!
echo.
echo Development Workflow:
echo   • Make changes to source files in src\
echo   • Run 'npm run dev' for live rebuild on changes
echo   • Run 'npm run build' for production build
echo   • Run 'npm test' to run unit tests
echo   • Run 'npm run lint' to check code style
echo.
pause
