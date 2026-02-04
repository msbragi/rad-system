#!/bin/bash
set -e

# Create DBs and users
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f /docker-entrypoint-initdb.d/10-init-users-dbs

# Initialize Schema and tables
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "rad_db" -f /docker-entrypoint-initdb.d/20-init-rad-schema
