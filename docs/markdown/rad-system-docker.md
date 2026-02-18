# Docker Ecosystem & DevOps: Production-Ready Orchestration

The RAD System employs a sophisticated Docker ecosystem designed to bridge the gap between local development flexibility and production stability. By leveraging `docker-compose.yml`, the system orchestrates a full stack environment where every service—from the database to the frontend—is isolated yet interconnected.

## 1. The Containerized Ecosystem

At the heart of the deployment strategy is the `docker-compose.yml` file. It orchestrates the entire production-ready environment, ensuring that services communicate securely and data persists reliably.

*   **Isolation:** All services communicate over a dedicated internal network, `rad_network`. This ensures that the database is not exposed to the public internet, opening only the necessary ports for the application to function.
*   **Volumes:** Data persistence and configuration management are handled through specific volume mounts.
    *   **Persistence:** `./Volumes/postgres` ensures that database data survives container restarts.
    *   **Configuration:** `./Config/backend/.env` allows for secure injection of environment variables without embedding secrets in the image.

## 2. Postgres: Auto-Healing & Initialization

The PostgreSQL container is configured to be more than just a standard database image. It is designed for auto-healing and automatic initialization.

*   **Init Scripts:** The system mounts `./Config/postgres/init/` to `/docker-entrypoint-initdb.d/`. When the container starts for the first time, it automatically executes any SQL or Shell scripts found in this directory. This feature is used to create users, databases, and install extensions without manual intervention.
*   **Config:** Custom `postgresql.conf` and `pg_hba.conf` files are mounted to fine-tune performance and security settings, overriding default values to suit the RAD System's specific needs.

## 3. Backend & Frontend: Hot-Reload & Runtime Config

The development experience is optimized to mirror production while allowing for rapid iteration.

*   **Backend:** The source code is mounted directly into the container via `./Volumes/backend/app:/opt/backend/app`. This setup allows developers to modify code locally on their host machine, while the containerized application detects changes and triggers a Hot-Reload, streamlining the development loop.
*   **Frontend:** The Angular application is served via Nginx. Crucially, the configuration file `app-config.json` is mounted at runtime (`./Config/frontend/assets/config/app-config.json`). This architecture allows operators to change environment variables, such as the API URL, instantly without needing to rebuild the entire frontend container image.

## 4. The Release Cycle: Artifact-Based Deployment

Unlike traditional pipelines that rebuild Docker images for every code change, RAD System uses an **"Artifact-Based"** strategy. The Docker images (Node/Nginx) serve as static runtimes, while the application logic is injected via volumes.

### How it works:
1.  **Build**: The builder scripts (`build-be.sh`, `build-fe.sh`) compile the code locally and create a **versioned tarball** (e.g., `rad-backend-1.0.2.tgz`).
2.  **Deploy**:
    *   Stop the container: `docker compose stop backend`
    *   Extract the artifact into the volume: `tar -xzf rad-backend-1.0.2.tgz -C ./Volumes/backend/app`
    *   Start the container: `docker compose up -d backend`

### Advantages:
*   **Zero Build in Production**: No need for Node.js, NPM, or compilers on the production server.
*   **Instant Rollback**: Reverting to a previous version is as simple as unpacking the old `.tgz` file.
*   **Clean Images**: Docker images remain generic and lightweight, decoupling the runtime environment from the application code.
