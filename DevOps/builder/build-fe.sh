#!/bin/bash
# Frontend build script
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

# ==========================================
# SAFETY CHECKS & VALIDATION
# ==========================================

echo "Performing Safety Checks..."

# 1. Validate Source Existence
if [ ! -d "$FRONTEND_ROOT" ]; then
    echo "❌ ERROR: Frontend root directory not found at: $FRONTEND_ROOT"
    echo "   Ensure the script is running within the correct project structure."
    exit 1
fi
echo "✅ Frontend Source: Found"

# 2. Validate Target Volume Safety
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
if [ -z "$VERSION" ]; then
    echo "❌ ERROR: Invalid or empty version in $VERSION_FILE"
    exit 1
fi
echo "✅ Version: $VERSION"

# ==========================================
# EXECUTION START
# ==========================================

# Prepare Update Directory
VERSIONED_DIR="$UPDATE_DIR/$VERSION"
mkdir -p "$VERSIONED_DIR"

# 0. Git Clean Check (Interactive only)
if [ -t 1 ]; then
    echo "Checking Git status..."
    if [[ -n $(git status --porcelain "$FRONTEND_ROOT") ]]; then
        echo "⚠️  WARNING: Uncommitted changes detected in $FRONTEND_ROOT"
        read -p "   Do you want to continue anyway? (y/N) " confirm
        if [[ $confirm != [yY] ]]; then
            echo "Build aborted."
            exit 1
        fi
    fi
else
    echo "⚠️  Non-interactive mode: Skipping Git status confirmation."
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

# Check if build output exists (Angular outputs to dist/<project>/browser or dist/<project>)
# Dynamic detection of build output directory to be portable
BUILD_OUTPUT_DIR=""

# Try to find index.html to locate the correct build output folder
if [ -f "dist/index.html" ]; then
    BUILD_OUTPUT_DIR="dist"
else
    # Search for index.html recursively in dist/
    FOUND_INDEX=$(find dist -name "index.html" -print -quit 2>/dev/null)
    if [ -n "$FOUND_INDEX" ]; then
        BUILD_OUTPUT_DIR=$(dirname "$FOUND_INDEX")
    fi
fi

if [ -z "$BUILD_OUTPUT_DIR" ]; then
    echo "❌ ERROR: Could not locate build output (index.html) in dist/."
    echo "   Ensure 'npm run build' was successful and creates an index.html file."
    exit 1
fi

echo "✅ Build output detected at: $BUILD_OUTPUT_DIR"

# 2. Deploy to Docker Volume
echo "Deploying to Docker Volume..."
mkdir -p "$TARGET_VOLUME"

# Pulisce tutto il contenuto del volume tranne i file nascosti (.keep)
rm -rf "$TARGET_VOLUME"/* 

# Copia il contenuto della build rilevata nel volume
echo "Copying application content from $BUILD_OUTPUT_DIR..."
cp -R "$BUILD_OUTPUT_DIR"/* "$TARGET_VOLUME/"

# Copia i file aggiuntivi (licenze e rotte) cercando nella cartella padre dell'output (spesso stanno lì)
BUILD_ROOT_DIR=$(dirname "$BUILD_OUTPUT_DIR")
echo "Copying extra build files from $BUILD_ROOT_DIR..."
[ -f "$BUILD_ROOT_DIR/3rdpartylicenses.txt" ] && cp "$BUILD_ROOT_DIR/3rdpartylicenses.txt" "$TARGET_VOLUME/"
[ -f "$BUILD_ROOT_DIR/prerendered-routes.json" ] && cp "$BUILD_ROOT_DIR/prerendered-routes.json" "$TARGET_VOLUME/"

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