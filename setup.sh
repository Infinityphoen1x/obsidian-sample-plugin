#!/bin/bash

# Quick setup script - installs dependencies and runs initial tests
# Usage: bash setup.sh [vault-path]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Metadata Organizer - Quick Setup"
echo "===================================="
echo ""

# Check if vault path provided
if [ $# -eq 1 ]; then
    export OBSIDIAN_VAULT="$1"
    echo "Vault path: $OBSIDIAN_VAULT"
    echo ""
fi

# Run the install script
bash "$SCRIPT_DIR/scripts/install-plugin.sh"

echo ""
echo "✨ Setup complete! Your plugin is ready."
echo ""
echo "📖 For detailed instructions, see: INSTALL.md"
