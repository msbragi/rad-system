#!/bin/bash
# RAG Project - Frontend build script with versioning
# Builds Angular frontend, creates versioned tarballs for distribution

set -e

# Get paths relative to script location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DOCKER_ROOT="$PROJECT_ROOT/Docker"
FRONTEND_ROOT="$PROJECT_ROOT/rad-fe"
ASSETS_SRC="$FRONTEND_ROOT/src/assets"
UPDATE_DIR="$DOCKER_ROOT/update"

# Read version from .global-version file
VERSION_FILE="$DOCKER_ROOT/.global-version"
if [ ! -f "$VERSION_FILE" ]; then
    echo "ERROR: .global-version file not found at $VERSION_FILE"
    exit 1
fi

VERSION=$(awk -F': *' '/^version:/ {gsub(/^[ \t]+|[ \t]+$/, "", $2); print $2; exit}' "$VERSION_FILE")
if [ -z "$VERSION" ]; then
    echo "ERROR: Invalid or empty version in $VERSION_FILE"
    exit 1
fi

# Create versioned directory
VERSIONED_DIR="$UPDATE_DIR/$VERSION"
mkdir -p "$VERSIONED_DIR"

echo "========================================"
echo "Starting Frontend build"
echo "Version: $VERSION"
echo "========================================"

# Validate required directories
if [ ! -d "$FRONTEND_ROOT" ]; then
    echo "ERROR: Frontend directory not found: $FRONTEND_ROOT"
    exit 1
fi

# Build frontend
echo "Building Angular frontend..."
cd "$FRONTEND_ROOT"

# Clean old build
if [ -d "dist" ]; then
    echo "Cleaning old dist..."
    rm -rf dist
fi

# Build production (Angular outputs to dist/rag-fe based on angular.json)
echo "Running production build..."
npm run build -- --configuration production

# Check if build output exists
if [ ! -d "dist/rag-fe/browser" ]; then
    echo "ERROR: Build output not found at dist/rag-fe/browser"
    echo "Angular build may have failed or output path changed"
    exit 1
fi

# Create versioned dist tarball from browser content (not the browser folder itself)
DIST_TAR="frontend-dist-${VERSION}.tar.gz"
echo "Creating $DIST_TAR..."
cd dist/rag-fe/browser
tar -czf "$VERSIONED_DIR/$DIST_TAR" .

# Create versioned assets tarball (excluding config folder)
ASSETS_TAR="frontend-assets-${VERSION}.tar.gz"
echo "Creating $ASSETS_TAR (excluding config)..."
cd "$ASSETS_SRC"
tar --exclude='config' -czf "$VERSIONED_DIR/$ASSETS_TAR" .

# Create/update release notes
RELEASE_FILE="$VERSIONED_DIR/release.md"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

if [ ! -f "$RELEASE_FILE" ]; then
    cat > "$RELEASE_FILE" << EOF
# Release $VERSION

Generated on: $TIMESTAMP

EOF
fi

cat >> "$RELEASE_FILE" << EOF
## Frontend Build
- Built on: $TIMESTAMP
- Files:
  - $DIST_TAR
  - $ASSETS_TAR

EOF


echo ""
echo "========================================"
echo "Frontend build complete!"
echo "Version: $VERSION"
echo "Distribution: $VERSIONED_DIR"
echo "========================================"
echo ""
echo "Files created:"
echo "  - $VERSIONED_DIR/$DIST_TAR"
echo "  - $VERSIONED_DIR/$ASSETS_TAR"
echo ""
echo "To deploy: tar -xzf $DIST_TAR -C Docker/frontend/dist/"