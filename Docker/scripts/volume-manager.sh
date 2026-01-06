#!/bin/bash
# =========================================================================
# Docker Volume Manager
# Usage: ./volume-manager.sh <Update-Version>
# Example: ./volume-manager.sh 0.02
# =========================================================================

UPDATE_VERSION="$1"
UPDATE_DIR="update/$UPDATE_VERSION"
FE_DIST="$UPDATE_DIR/frontend-dist-${UPDATE_VERSION}.tar.gz"
BE_DIST="$UPDATE_DIR/backend-dist-${UPDATE_VERSION}.tar.gz"
BE_MODULES_DIST="$UPDATE_DIR/backend-modules-${UPDATE_VERSION}.tar.gz"

# --- MOVE TO PARENT DIR OF SCRIPT ---
cd "$(dirname "$0")/.." || { echo "ERROR: Cannot cd to parent directory."; exit 1; }

if [ -z "$UPDATE_VERSION" ]; then
    echo "ERROR: Missing update version argument."
    exit 1
fi

if [ ! -f "$UPDATE_DIR/release.md" ]; then
    echo "ERROR: $UPDATE_DIR is not a valid update directory"
    exit 1
fi

if [ ! -f "tar_helper-compose.yml" ]; then
    echo "ERROR: tar_helper-compose.yml not found in $(pwd)"
    exit 1
fi

docker compose -f tar_helper-compose.yml up -d

# --- COPY FILES
[ -f "$FE_DIST" ] && docker cp "$FE_DIST" tar_helper:/data
[ -f "$BE_DIST" ] && docker cp "$BE_DIST" tar_helper:/data
[ -f "$BE_MODULES_DIST" ] && docker cp "$BE_MODULES_DIST" tar_helper:/data

docker exec -it tar_helper sh
