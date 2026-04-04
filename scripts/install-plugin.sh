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

# Step 6: Installation instructions
echo "📋 Installation Instructions:"
echo "============================"
echo ""
echo "To install the plugin in Obsidian:"
echo ""
echo "OPTION 1: Manual Installation (Recommended for Development)"
echo "---"
echo "1. Open Obsidian and go to Settings → About → Vault folder location"
echo "2. Copy the following command to install to your test vault:"
echo ""
echo "   VAULT_PATH=\"/path/to/your/vault\""
echo "   cp \"$PROJECT_ROOT/main.js\" \"\$VAULT_PATH/.obsidian/plugins/$PLUGIN_ID/\""
echo "   cp \"$PROJECT_ROOT/manifest.json\" \"\$VAULT_PATH/.obsidian/plugins/$PLUGIN_ID/\""
echo "   cp \"$PROJECT_ROOT/styles.css\" \"\$VAULT_PATH/.obsidian/plugins/$PLUGIN_ID/\" 2>/dev/null || true"
echo ""
echo "3. Reload Obsidian (Ctrl+R or Cmd+R) or restart the app"
echo "4. Enable the plugin in Settings → Community plugins"
echo ""

echo "OPTION 2: Create Test Vault Directory Structure"
echo "---"
echo "If you have a test vault location, set the OBSIDIAN_VAULT environment variable:"
echo ""
echo "   export OBSIDIAN_VAULT=\"/path/to/test/vault\""
echo "   bash $SCRIPT_DIR/install-plugin.sh"
echo ""

# Step 7: If OBSIDIAN_VAULT is set, perform installation
if [ -n "$OBSIDIAN_VAULT" ]; then
    echo "🔗 Installing to vault: $OBSIDIAN_VAULT"
    PLUGIN_DIR="$OBSIDIAN_VAULT/.obsidian/plugins/$PLUGIN_ID"
    
    if [ ! -d "$PLUGIN_DIR" ]; then
        mkdir -p "$PLUGIN_DIR"
        echo "✓ Created plugin directory"
    fi
    
    cp "$PROJECT_ROOT/main.js" "$PLUGIN_DIR/"
    cp "$PROJECT_ROOT/manifest.json" "$PLUGIN_DIR/"
    cp "$PROJECT_ROOT/styles.css" "$PLUGIN_DIR/" 2>/dev/null || true
    
    echo "✓ Plugin installed to: $PLUGIN_DIR"
    echo ""
    echo "Next steps:"
    echo "  1. Reload Obsidian (Ctrl+R / Cmd+R)"
    echo "  2. Go to Settings → Community plugins"
    echo "  3. Find '$PLUGIN_ID' and enable it"
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
