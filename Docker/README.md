# RAD System - Docker Stack

This directory contains the Docker Compose configuration for the RAD Template

## Quick Start

### 1. Prerequisites
- Docker or Docker Desktop installed (with WSL2 on Windows)
- At least 8GB RAM available
- 10GB free disk space

### 2. Initial Setup
- copy .env.example .env and update with your credentials
- The Docker/scripts contains 2 utilities:

### 3. Start the Stack
from the root Docker dir
```bash
docker compose up -d # start the stack and create all necessary db
```
N.B. You need to update the files in config/postgres/init to:
- reflect the admin password you used in your .env 
- change the passwords (if you want) for rad_user


### 4. Access Services

Once all services are running:

|-----------------|-----------------------|---------------------------|
| Service         | URL                   | Description               |
|-----------------|-----------------------|---------------------------|
| **Frontend**    | http://localhost:8080 | UI (Angular)              |
| **Backend**     | http://localhost:3300 | Info and API Docs url     |
| **Postgres**    | http://localhost:5432 | Postgres DB               |
|-----------------|-----------------------|---------------------------|

### 5. Check Service Health

```bash
# View all running containers
docker-compose ps

# View logs for all services
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend
```

### 6. Data Configuration
- Login to UI frontend (superuser/Password123!)
- From sidebar menu
1. Users: Configure supersuser (set department(s) to access contexts)
2. Profile: Change your  profile data 

### Advanced topics

#### Architecture Overview
The stack consists of several services:
- **Frontend**: Angular UI for user interaction
- **Backend**: NestJS API for business logic and authentication

Services communicate via internal Docker networking. Data is persisted in named Docker volumes (see `docker-compose.yml`).

#### Customizing Configuration
- All environment variables are set in `.env` (see `.env.example` for reference)
- Service-specific configs are in `config/backend/`, `config/frontend/`, and `config/postgres/`
- To change ports, edit the `docker-compose.yml` and corresponding `.env` values

### Detailed Documentation

#### Security Notes
- Change all default passwords in `.env` and config files before production use
- Limit access to exposed ports in production environments
- Regularly update images to receive security patches

#### Useful Commands
```bash
# Rebuild and restart all services
docker compose up -d --build

# Remove all stopped containers and unused volumes
docker system prune -af --volumes

# Enter a running container (example: backend)
docker exec -it <container_name> /bin/bash
```
