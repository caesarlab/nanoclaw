#!/bin/bash
# Build Stagehand CLI wrapper

set -e

cd "$(dirname "$0")/.."

echo "Building Stagehand CLI..."

# Compile TypeScript
npm run build

# Make CLI executable
chmod +x dist/stagehand-cli.js

# Create symlink for easy access
ln -sf "$(pwd)/dist/stagehand-cli.js" /usr/local/bin/stagehand 2>/dev/null || true

echo "Stagehand CLI built successfully"
