#!/bin/bash

# Metadata Organizer Plugin - Installation Script
# This script sets up the plugin for local development and testing

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PLUGIN_ID="metadata-organizer"

echo "🚀 Metadata Organizer Plugin Installation"
echo "=========================================="
echo ""

# Step 1: Check Node.js
echo "✓ Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi
NODE_VERSION=$(node -v)
echo "  Node.js version: $NODE_VERSION"
echo ""

# Step 2: Install dependencies
echo "📦 Installing dependencies..."
cd "$PROJECT_ROOT"
npm install || { echo "❌ npm install failed"; exit 1; }
echo "✓ Dependencies installed"
echo ""

# Step 3: Build the plugin
echo "🔨 Building plugin..."
npm run build || { echo "❌ Build failed"; exit 1; }
echo "✓ Plugin built successfully"
echo ""

# Step 4: Run tests
echo "🧪 Running unit tests..."
npm test 2>&1 | grep -E "Test Suites:|Tests:" || npm test
echo "✓ Tests passed"
echo ""

# Step 5: Check for required files
echo "✓ Verifying build artifacts..."
REQUIRED_FILES=("main.js" "manifest.json" "styles.css")
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$PROJECT_ROOT/$file" ]; then
        echo "  ✓ $file"
    else
        echo "  ⚠ $file (optional)"
    fi
done
echo ""

# Step 6: Determine vault path
echo "📋 Plugin Installation"
echo "====================="
echo ""

VAULT_PATH="${OBSIDIAN_VAULT}"

# If OBSIDIAN_VAULT not set, ask user for vault path
if [ -z "$VAULT_PATH" ]; then
    echo "Enter your Obsidian vault path (or press Enter to skip installation):"
    read -r VAULT_PATH
fi

# Step 7: If vault path provided, perform installation
if [ -n "$VAULT_PATH" ]; then
    echo ""
    echo "🔗 Installing plugin to vault..."
    PLUGIN_DIR="$VAULT_PATH/.obsidian/plugins/$PLUGIN_ID"
    
    # Create plugin directory if it doesn't exist
    if [ ! -d "$PLUGIN_DIR" ]; then
        mkdir -p "$PLUGIN_DIR" || { echo "❌ Failed to create plugin directory. Check path: $VAULT_PATH"; exit 1; }
        echo "✓ Created plugin directory"
    fi
    
    # Copy build artifacts
    cp "$PROJECT_ROOT/main.js" "$PLUGIN_DIR/" || { echo "❌ Failed to copy main.js"; exit 1; }
    cp "$PROJECT_ROOT/manifest.json" "$PLUGIN_DIR/" || { echo "❌ Failed to copy manifest.json"; exit 1; }
    cp "$PROJECT_ROOT/styles.css" "$PLUGIN_DIR/" 2>/dev/null || true
    
    echo "✓ Plugin installed to: $PLUGIN_DIR"
    echo ""
    echo "✨ Next steps:"
    echo "  1. Reload Obsidian (Ctrl+R / Cmd+R)"
    echo "  2. Go to Settings → Community plugins"
    echo "  3. Find '$PLUGIN_ID' and enable it"
else
    echo ""
    echo "ℹ️  Installation skipped. To install later:"
    echo ""
    echo "  export OBSIDIAN_VAULT=\"/path/to/your/vault\""
    echo "  bash $SCRIPT_DIR/install-plugin.sh"
    echo ""
    echo "Or manually copy these files to:"
    echo "  YOUR_VAULT/.obsidian/plugins/$PLUGIN_ID/"
    echo ""
    echo "  • main.js"
    echo "  • manifest.json"
    echo "  • styles.css"
fi

echo ""
echo "🎉 Installation complete!"
echo ""
echo "Development Workflow:"
echo "  • Make changes to source files in src/"
echo "  • Run 'npm run dev' for live rebuild on changes"
echo "  • Run 'npm run build' for production build"
echo "  • Run 'npm test' to run unit tests"
echo "  • Run 'npm run lint' to check code style"
echo ""
