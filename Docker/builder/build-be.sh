#!/bin/bash
# RAG Project - Backend build script with versioning
# Builds NestJS backend, creates versioned zips for distribution

set -e

MODE="${1:-dist}" # default: dist (dist only) or "all" (dist + node_modules)

# Get paths relative to script location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DOCKER_ROOT="$PROJECT_ROOT/Docker"
BACKEND_ROOT="$PROJECT_ROOT/rad-be"
TMP_DIR="$DOCKER_ROOT/tmp"
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

# Temp directory for clean node_modules build (isolated from dev environment)
TMP_BE="$TMP_DIR/be-build"

echo "========================================"
echo "Starting Backend build"
echo "Version: $VERSION"
echo "Mode: $MODE"
echo "========================================"

# Validate required directories
if [ ! -d "$BACKEND_ROOT" ]; then
    echo "ERROR: Backend directory not found: $BACKEND_ROOT"
    exit 1
fi

# Build backend dist
echo "Building backend dist..."
cd "$BACKEND_ROOT"

# Clean old build
if [ -d "dist" ]; then
    rm -rf dist
fi

# Build production
NODE_ENV=production npm run build

# Create versioned dist tarball
DIST_TAR="backend-dist-${VERSION}.tar.gz"
echo "Creating $DIST_TAR..."
tar -czf "$VERSIONED_DIR/$DIST_TAR" dist

# Build node_modules if MODE is "all"
if [[ "$MODE" == "all" ]]; then
    echo "Building production node_modules in isolated environment..."
    
    # Clean and create temp directory (safe because we validate it's under TMP_DIR)
    if [ -n "$TMP_BE" ] && [[ "$TMP_BE" == "$TMP_DIR"* ]]; then
        rm -rf "$TMP_BE"
        mkdir -p "$TMP_BE"
    else
        echo "ERROR: Invalid temp directory path"
        exit 1
    fi
    
    cd "$TMP_BE"
    
    # Copy package files
    cp "$BACKEND_ROOT/package.json" .
    cp "$BACKEND_ROOT/package-lock.json" .
    
    # Configure npm for offline cache usage
    echo "cache=~/.npm" > .npmrc
    echo "prefer-offline=true" >> .npmrc
    
    # Install production dependencies only
    NODE_ENV=production npm ci --omit=dev
    
    # Create versioned node_modules tarball
    NODE_MODULES_TAR="backend-modules-${VERSION}.tar.gz"
    echo "Creating $NODE_MODULES_TAR..."
    tar -czf "$VERSIONED_DIR/$NODE_MODULES_TAR" node_modules
    
    echo "Cleaning up temp directory..."
    cd "$DOCKER_ROOT"
    rm -rf "$TMP_BE"
fi

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
## Backend Build
- Built on: $TIMESTAMP
- Mode: $MODE
- Files:
  - $DIST_TAR
EOF

if [[ "$MODE" == "all" ]]; then
    echo "  - $NODE_MODULES_TAR" >> "$RELEASE_FILE"
fi

echo "" >> "$RELEASE_FILE"

echo ""
echo "========================================"
echo "Backend build complete!"
echo "Version: $VERSION"
echo "Distribution: $VERSIONED_DIR"
echo "========================================"
echo ""
echo "Files created:"
echo "  - $VERSIONED_DIR/$DIST_TAR"
if [[ "$MODE" == "all" ]]; then
    echo "  - $VERSIONED_DIR/$NODE_MODULES_TAR"
fi
echo ""
echo "To deploy, extract the tarballs to Docker/backend/app/"