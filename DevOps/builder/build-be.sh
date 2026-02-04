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

# ==========================================
# SAFETY CHECKS & VALIDATION
# ==========================================

echo "Performing Safety Checks..."

# 1. Validate Source Existence
if [ ! -d "$BACKEND_ROOT" ]; then
    echo "❌ ERROR: Backend root directory not found at: $BACKEND_ROOT"
    echo "   Ensure the script is running within the correct project structure."
    exit 1
fi
echo "✅ Backend Source: Found"

# 2. Validate Target Volume Safety
# Prevent accidental deletion of system folders if variables are empty
if [[ -z "$TARGET_VOLUME" || "$TARGET_VOLUME" == "/" || "$TARGET_VOLUME" == "." || "$TARGET_VOLUME" == "$HOME" ]]; then
    echo "❌ ERROR: Invalid or unsafe TARGET_VOLUME path: '$TARGET_VOLUME'"
    exit 1
fi
echo "✅ Target Safety: Confirmed"

# 3. Check Required Tools
if ! command -v npm &> /dev/null; then
    echo "❌ ERROR: 'npm' is not installed or not in PATH."
    exit 1
fi
echo "✅ Toolchain: npm found"

# 4. Check Version File
VERSION_FILE="$SCRIPT_DIR/.global-version"
if [ ! -f "$VERSION_FILE" ]; then
    echo "❌ ERROR: Version file not found at: $VERSION_FILE"
    echo "   Please create a .global-version file in the builder directory."
    exit 1
fi
VERSION=$(awk -F': *' '/^version:/ {gsub(/^[ \t]+|[ \t]+$/, "", $2); print $2; exit}' "$VERSION_FILE")
echo "✅ Version: $VERSION"

# ==========================================
# EXECUTION START
# ==========================================

# Prepare Update Directory
VERSIONED_DIR="$UPDATE_DIR/$VERSION"
mkdir -p "$VERSIONED_DIR"

# 0. Git Clean Check (Interactive only)
if [ -t 1 ]; then # Only check if running in an interactive terminal
    echo "Checking Git status..."
    if [[ -n $(git status --porcelain "$BACKEND_ROOT") ]]; then
        echo "⚠️  WARNING: Uncommitted changes detected in $BACKEND_ROOT"
        read -p "   Do you want to continue anyway? (y/N) " confirm
        if [[ $confirm != [yY] ]]; then
            echo "Build aborted."
            exit 1
        fi
    fi
else
    echo "⚠️  Non-interactive mode: Skipping Git status confirmation (proceeding with potential uncommitted changes)."
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
