#!/bin/bash

# =========================================================================
# NAMED VOLUMES INITIAL SETUP SCRIPT
#
# This script checks for the existence of Docker volumes marked as
# 'external: true' in docker-compose.yml and creates them if they do not exist.
#
# Recommended to run from WSL 2 (Linux filesystem).
# =========================================================================

 # Array of critical volumes to create (those with external: true)
declare -a VOLUMES=(
    "rad_postgres_data"
    "rad_backend_data"
    "rad_frontend_data"
)

echo "--- Starting Docker Volumes Setup ---"


# Loop through the defined volumes
for VOLUME_NAME in "${VOLUMES[@]}"
do
    # Check if the volume already exists
    # `docker volume inspect` returns 0 (success) if the volume exists
    # and an error (non 0) if it does not exist. We use /dev/null to suppress output.
    if docker volume inspect "$VOLUME_NAME" >/dev/null 2>&1; then
        echo "✅ Volume '$VOLUME_NAME' exists. No action needed."
    else
        echo "⏳ Volume '$VOLUME_NAME' not found. Creating..."
        # Attempt to create
        if docker volume create "$VOLUME_NAME"; then
            echo "✨ Volume '$VOLUME_NAME' created successfully."
        else
            echo "❌ ERROR: Failed to create volume '$VOLUME_NAME'. Stopping."
            exit 1
        fi
    fi
done

echo "--- Volumes Setup Completed ---"
echo "You can now launch the stack with: docker compose up -d --build"
echo ""