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
- change the passwords (if you want) for rag_user and and rag_n8n


### 4. Access Services

Once all services are running:

|-----------------|-----------------------|---------------------------|
| Service         | URL                   | Description               |
|-----------------|-----------------------|---------------------------|
| **Frontend**    | http://localhost:8080 | UI (Angular)              |
| **FastAPI**     | http://localhost:8000 | FastAPI backend           |
| **Backend**     | http://localhost:3300 | Info and API Docs url     |
| **n8n**         | http://localhost:5678 | Workflow automation       |
| **Qdrant UI**   | http://localhost:6333 | Vector database dashboard |
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
1. Departments: Add at least 1 department
2. Models: Add at least 1 model
3. Contexts: Add at least 1 context (set departments and model to use)
4. Users: Configure supersuser (set department(s) to access contexts)
5. Documents: Upload some documents and click on embed button when uploaded 
6. Dashboard: Try some query.

### Advanced topics

#### Architecture Overview
The stack consists of several services:
- **Frontend**: Angular UI for user interaction
- **Backend**: NestJS API for business logic and authentication
- **FastAPI**: Handles AI model inference and RAG orchestration
- **n8n**: Workflow automation and integration
- **Qdrant**: Vector database for document embeddings

Services communicate via internal Docker networking. Data is persisted in named Docker volumes (see `docker-compose.yml`).

#### Customizing Configuration
- All environment variables are set in `.env` (see `.env.example` for reference)
- Service-specific configs are in `config/backend/`, `config/frontend/`, and `config/postgres/`
- To change ports, edit the `docker-compose.yml` and corresponding `.env` values

#### Persistent Data & Backups
- Critical data is stored in named volumes (Postgres, Qdrant, uploads, etc.)
- Use `scripts/named-volumes.sh` to create volumes before first run
- To back up all data:
	1. Run `./scripts/named-volumes.sh` to access the data container
	2. Archive `/data` as shown in the Quick Start
- To restore, extract the archive into the same location before starting the stack

#### Adding/Upgrading Services
- To add a new service, extend `docker-compose.yml` and provide a config in `config/`
- After changes, run `docker compose up -d --build` to apply
- For custom images, place Dockerfiles in `images/` and update compose config

### Detailed Documentation

For more in-depth information, please refer to the following guides:

- **[Technical Documentation](../docs/tecnical-doc.md)**: Detailed service overview, n8n workflow structures, and FastAPI endpoint specifications.
- **[Business Scenarios](../docs/business-scenarios.md)**: Use cases, hardware requirements, and a comparison between Local and API-based LLM engines.

#### Troubleshooting
- Use `docker-compose ps` and `docker-compose logs` to check service status
- If a service fails to start, check for port conflicts or missing environment variables
- For database issues, ensure volumes are not corrupted and credentials match `.env`
- To reset a service, stop the stack, remove its volume (`docker volume rm <name>`), and restart

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
