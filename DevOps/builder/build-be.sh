#!/bin/bash
# RAG Project - Backend build script
# Builds directly into Docker Volume and creates distribution tarballs

set -e

MODE="${1:-dist}" # default: dist (dist only) or "all" (dist + node_modules)

# Get paths relative to script location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Project root is two levels up from DevOps/builder
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Define Paths
DEV_OPS_ROOT="$PROJECT_ROOT/DevOps"
BACKEND_ROOT="$PROJECT_ROOT/rad-be"
TARGET_VOLUME="$PROJECT_ROOT/Docker/Volumes/backend/app"
UPDATE_DIR="$DEV_OPS_ROOT/update"

# --- Safety Check ---
if [[ -z "$TARGET_VOLUME" || "$TARGET_VOLUME" == "/" || "$TARGET_VOLUME" == "." ]]; then
    echo "ERROR: Invalid TARGET_VOLUME path detected. Safety abort."
    exit 1
fi

# Verifica che la destinazione faccia parte del progetto e non sia una cartella di sistema
if [[ ! "$TARGET_VOLUME" == *"/ai-stack/Docker/Volumes/backend/app"* ]]; then
    echo "ERROR: TARGET_VOLUME is outside the expected project structure. Safety abort."
    exit 1
fi

# Read version
VERSION_FILE="$SCRIPT_DIR/.global-version"
if [ ! -f "$VERSION_FILE" ]; then
    echo "ERROR: .global-version file not found at $VERSION_FILE"
    exit 1
fi
VERSION=$(awk -F': *' '/^version:/ {gsub(/^[ \t]+|[ \t]+$/, "", $2); print $2; exit}' "$VERSION_FILE")

# Prepare Update Directory
VERSIONED_DIR="$UPDATE_DIR/$VERSION"
mkdir -p "$VERSIONED_DIR"

# 0. Git Clean Check
echo "Checking Git status..."
if [[ -n $(git status --porcelain "$BACKEND_ROOT") ]]; then
    echo "=========================================================="
    echo "WARNING: There are uncommitted changes in $BACKEND_ROOT"
    echo "The current 'dist' might not match your source code."
    echo "=========================================================="
    read -p "Do you want to continue anyway? (y/N) " confirm
    if [[ $confirm != [yY] ]]; then
        echo "Build aborted. Please commit or stash your changes."
        exit 1
    fi
fi

echo "========================================"
echo "Starting Backend Build & Deploy"
echo "Version: $VERSION"
echo "Mode: $MODE"
echo "Target: $TARGET_VOLUME"
echo "========================================"

# 1. Build / Verify Dist
cd "$BACKEND_ROOT"
if [ ! -d "dist" ]; then
    echo "Dist folder not found. Building..."
    npm run build
else
    echo "Using existing dist folder."
fi

# 2. Deploy to Docker Volume
echo "Deploying to Docker Volume..."
mkdir -p "$TARGET_VOLUME"

# Clean old app files (preserve .env if it exists, though it should be mounted)
# But clean dist and node_modules to be safe
rm -rf "$TARGET_VOLUME/dist"

# Copy dist
echo "Copying dist..."
cp -R dist "$TARGET_VOLUME/"


# Copy package files (needed for runtime metadata or npm ci)
cp package.json "$TARGET_VOLUME/"

# 3. Handle Node Modules (Directly in Volume)
if [[ "$MODE" == "all" ]]; then

    cp package-lock.json "$TARGET_VOLUME/"
    
    echo "Installing production dependencies in volume..."
    
    cd "$TARGET_VOLUME"
    
    # Configure npm for speed
    echo "cache=~/.npm" > .npmrc
    echo "prefer-offline=true" >> .npmrc
    
    # Install production dependencies
    NODE_ENV=production npm ci --omit=dev
    
    # Clean up npm artifacts
    rm package-lock.json
    rm .npmrc
fi

# 4. Create Tarball from Volume
# NOTE: Consider switching to a single unified tarball (dist + node_modules)
# if deployment complexity increases (e.g., multiple installations/partners)
# for better atomicity and easier rollbacks.
echo "Creating distribution tarball..."
cd "$TARGET_VOLUME"

DIST_TAR="backend-dist-${VERSION}.tar.gz"
tar -czf "$VERSIONED_DIR/$DIST_TAR" dist package.json

if [[ "$MODE" == "all" ]]; then
    MODULES_TAR="backend-modules-${VERSION}.tar.gz"
    tar -czf "$VERSIONED_DIR/$MODULES_TAR" node_modules
fi

# 5. Release Notes
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
    echo "  - $MODULES_TAR" >> "$RELEASE_FILE"
fi

echo "" >> "$RELEASE_FILE"

echo ""
echo "========================================"
echo "Backend build complete!"
echo "Deployed to: $TARGET_VOLUME"
echo "Package: $VERSIONED_DIR/$DIST_TAR"
echo "========================================"
