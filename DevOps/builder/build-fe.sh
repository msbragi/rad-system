#!/bin/bash
# RAG Project - Frontend build script
# Builds directly into Docker Volume and creates distribution tarballs

set -e

# Get paths relative to script location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Project root is two levels up from DevOps/builder
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Define Paths
DEV_OPS_ROOT="$PROJECT_ROOT/DevOps"
FRONTEND_ROOT="$PROJECT_ROOT/rad-fe"
TARGET_VOLUME="$PROJECT_ROOT/Docker/Volumes/frontend"
UPDATE_DIR="$DEV_OPS_ROOT/update"

# --- Safety Check ---
if [[ -z "$TARGET_VOLUME" || "$TARGET_VOLUME" == "/" || "$TARGET_VOLUME" == "." ]]; then
    echo "ERROR: Invalid TARGET_VOLUME path detected. Safety abort."
    exit 1
fi

# Verifica che la destinazione faccia parte del progetto e non sia una cartella di sistema
if [[ ! "$TARGET_VOLUME" == *"/ai-stack/Docker/Volumes/frontend"* ]]; then
    echo "ERROR: TARGET_VOLUME is outside the expected project structure. Safety abort."
    exit 1
fi

# Read version from .global-version file located with the script
VERSION_FILE="$SCRIPT_DIR/.global-version"
if [ ! -f "$VERSION_FILE" ]; then
    echo "ERROR: .global-version file not found at $VERSION_FILE"
    exit 1
fi

VERSION=$(awk -F': *' '/^version:/ {gsub(/^[ \t]+|[ \t]+$/, "", $2); print $2; exit}' "$VERSION_FILE")
if [ -z "$VERSION" ]; then
    echo "ERROR: Invalid or empty version in $VERSION_FILE"
    exit 1
fi

# Prepare Update Directory
VERSIONED_DIR="$UPDATE_DIR/$VERSION"
mkdir -p "$VERSIONED_DIR"

# 0. Git Clean Check
echo "Checking Git status..."
if [[ -n $(git status --porcelain "$FRONTEND_ROOT") ]]; then
    echo "=========================================================="
    echo "WARNING: There are uncommitted changes in $FRONTEND_ROOT"
    echo "The current 'dist' might not match your source code."
    echo "=========================================================="
    read -p "Do you want to continue anyway? (y/N) " confirm
    if [[ $confirm != [yY] ]]; then
        echo "Build aborted. Please commit or stash your changes."
        exit 1
    fi
fi

echo "========================================"
echo "Starting Frontend Build & Deploy"
echo "Version: $VERSION"
echo "Target: $TARGET_VOLUME"
echo "========================================"

# 1. Build / Verify Dist
cd "$FRONTEND_ROOT"
if [ ! -d "dist" ]; then
    echo "Dist folder not found. Building..."
    npm run build -- --configuration production
else
    echo "Using existing dist folder."
fi

# Check if build output exists (Angular outputs to dist/rag-fe/browser)
if [ ! -d "dist/rag-fe/browser" ]; then
    echo "ERROR: Build output not found at dist/rag-fe/browser. Please run 'npm run build' manually."
    exit 1
fi

# 2. Deploy to Docker Volume
echo "Deploying to Docker Volume..."
# Pulisce tutto il contenuto del volume tranne i file nascosti (.keep)
rm -rf "$TARGET_VOLUME"/* 

# Copia il contenuto della build (browser) nel volume
echo "Copying browser content..."
cp -R dist/rag-fe/browser/* "$TARGET_VOLUME/"

# Copia i file aggiuntivi (licenze e rotte prerenderizzate)
echo "Copying extra build files..."
[ -f "dist/rag-fe/3rdpartylicenses.txt" ] && cp "dist/rag-fe/3rdpartylicenses.txt" "$TARGET_VOLUME/"
[ -f "dist/rag-fe/prerendered-routes.json" ] && cp "dist/rag-fe/prerendered-routes.json" "$TARGET_VOLUME/"

# 3. Create Tarball from Volume
echo "Creating distribution tarball..."
cd "$TARGET_VOLUME"

DIST_TAR="frontend-dist-${VERSION}.tar.gz"
tar -czf "$VERSIONED_DIR/$DIST_TAR" .

# 4. Release Notes
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
EOF

echo "" >> "$RELEASE_FILE"

echo ""
echo "========================================"
echo "Frontend build complete!"
echo "Deployed to: $TARGET_VOLUME"
echo "Package: $VERSIONED_DIR/$DIST_TAR"
echo "========================================"