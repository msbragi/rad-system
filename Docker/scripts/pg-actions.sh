#!/bin/bash
# =========================================================================
# POSTGRES ORCHESTRATOR SCRIPT
# Usage: ./pg-actions.sh <action> <db_name>
# Actions: backup | schema | rebuild
# =========================================================================

# --- MOVE TO PARENT DIR OF SCRIPT ---
cd "$(dirname "$0")/.." || { echo "ERROR: Cannot cd to parent directory."; exit 1; }

# --- ARGUMENTS ---
ACTION="$1"
DB_NAME="$2"

# --- CONFIGURATION ---
CONTAINER_NAME="rad_postgres"
SERVICE_NAME="postgresdb"

ADMIN_USER="admin"
ADMIN_PASSWORD="YOUR_ADMIN_PASSWORD"

BACKUP_DIR="pg-backup"
INIT_DIR="pg-backup"

SCHEMA_FILE="$BACKUP_DIR/${DB_NAME}_schema_$(date +%Y%m%d_%H%M%S).sql"
FULL_BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_full_$(date +%Y%m%d_%H%M%S).sql"
INIT_FILE="$INIT_DIR/${DB_NAME}_init.sql"

export PGPASSWORD="$ADMIN_PASSWORD"

# --- CHECK STACK IS RUNNING ---
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "ERROR: Docker container '${CONTAINER_NAME}' is not running."
    echo "Start the stack with: docker-compose up -d"
    exit 1
fi

# --- CHECK ARGUMENTS ---
if [ -z "$ACTION" ] || [ -z "$DB_NAME" ]; then
    echo "ERROR: Missing required arguments."
	_show_help
    exit 1
fi

# --- FUNCTIONS ---
_show_help() {
    echo "Usage: $0 <action> <db_name>"
    echo
    echo "Actions:"
    echo "  schema   : Dump schema only for the specified database"
    echo "  backup   : Full backup (schema + data) for the specified database"
    echo "  rebuild  : Drop, recreate, and restore the specified database"
    echo
    echo "Files:"
    echo "  Schema   : pg-backup/<db_name>_schema.sql"
    echo "  Backup   : pg-backup/<db_name>_full_<timestamp>.sql"
    echo "  Init     : pg-backup/<db_name>_init.sql"
}

_dump_schema() {
    echo "--- DUMPING SCHEMA ONLY FOR DB: $DB_NAME ---"

    mkdir -p "$BACKUP_DIR"

    docker exec -t "$CONTAINER_NAME" \
        pg_dump -U "$ADMIN_USER" -d "$DB_NAME" -s \
        > "$SCHEMA_FILE"

    if [ $? -eq 0 ]; then
        echo "SUCCESS: Schema dumped to $SCHEMA_FILE"
    else
        echo "ERROR: Schema dump failed." >&2
        return 1
    fi
}

_full_backup() {
    echo "--- CREATING FULL BACKUP FOR DB: $DB_NAME ---"

    mkdir -p "$BACKUP_DIR"

    docker exec -t "$CONTAINER_NAME" \
        pg_dump -U "$ADMIN_USER" -d "$DB_NAME" \
        > "$FULL_BACKUP_FILE"

    if [ $? -eq 0 ]; then
        echo "SUCCESS: Full backup saved to $FULL_BACKUP_FILE"
    else
        echo "ERROR: Full backup failed." >&2
        return 1
    fi
}

_rebuild_db() {
    echo "--- STARTING DESTRUCTIVE REBUILD FOR DB: $DB_NAME ---"

    if [ ! -f "$SCHEMA_FILE" ]; then
        echo "ERROR: Schema file not found: $SCHEMA_FILE" >&2
        return 1
    fi

    if [ ! -f "$INIT_FILE" ]; then
        echo "ERROR: Init file not found: $INIT_FILE" >&2
        return 1
    fi

    echo "1. Restarting service: $SERVICE_NAME"
    docker-compose down
    docker-compose up -d "$SERVICE_NAME" || return 1

    echo "Waiting 10 seconds for PostgreSQL to initialize..."
    sleep 10

    echo "2. Dropping and recreating database $DB_NAME"
    docker exec -i "$CONTAINER_NAME" psql -U "$ADMIN_USER" -d postgres <<EOF
DROP DATABASE IF EXISTS $DB_NAME;
CREATE DATABASE $DB_NAME;
EOF

    echo "3. Restoring schema"
    docker exec -i "$CONTAINER_NAME" \
        psql -U "$ADMIN_USER" -d "$DB_NAME" < "$SCHEMA_FILE" || return 1

    echo "4. Applying init data"
    docker exec -i "$CONTAINER_NAME" \
        psql -U "$ADMIN_USER" -d "$DB_NAME" < "$INIT_FILE" || return 1

    echo "--- Database $DB_NAME rebuild complete ---"
}

# --- MAIN ---
case "$ACTION" in
    schema)
        _dump_schema
        ;;
    backup)
        _full_backup
        ;;
    rebuild)
        _rebuild_db
        ;;
    help)
        _show_help
        ;;
    *)
        echo "ERROR: Unknown action '$ACTION'" >&2
        _show_help
        exit 1
        ;;
esac

unset PGPASSWORD

