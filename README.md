# RAD System
> **Rapid Architecture Development**: A Zero-Boilerplate Full-Stack Ecosystem.

## Overview
RAD System is not just a template; it is a production-ready "abstract machine" designed to eliminate development noise. It allows developers to focus on **Business Logic** from minute zero by providing a robust, pre-configured architecture for both Backend (NestJS) and Frontend (Angular).

### Key Features
*   **Backend (NestJS 11)**:
    *   **Abstraction Layer**: `BaseService` & `BaseEntity` handle 90% of CRUD, Audit, and Ownership checks automatically.
    *   **Modular Architecture**: Pre-built modules for Auth (JWT/SSO), Users, Departments, Email (Handlebars), and Config.
    *   **Database Agnostic**: Supports PostgreSQL and MySQL/MariaDB with dynamic dialect handling.
    *   **Secure by Default**: Global Guards, Helmet security, and Declarative Decorators (`@Public`, `@AdminRequired`).
    *   **Auto-Documentation**: OpenAPI 3 (Swagger) generated automatically.

*   **Frontend (Angular 21)**:
    *   **Modern Core**: Fully Standalone Components (No NgModules) and Signal-ready architecture.
    *   **Runtime Configuration**: "Build Once, Deploy Anywhere" strategy using `app-config.json` injection.
    *   **StoreService**: Lightweight state management replacing complex NgRx boilerplate.
    *   **Smart Features**: Dynamic Menu, Session Watchdog, and Theme/Language pickers (Transloco).

*   **DevOps & Deployment**:
    *   **Docker Stack**: Production-mirror environment with isolated networking and persistence.
    *   **Artifact-Based Deployment**: Smart builders create versioned `.tgz` artifacts. **Zero builds in production**—just extract and run.
    *   **Hot-Reload**: Volumes configured for seamless local development.

## 📚 Detailed Documentation
We have prepared detailed documentation for every aspect of the system:

-   [📖 System Overview](docs/markdown/rad-system-overview.md)
-   [⚙️ Backend Architecture](docs/markdown/rad-system-backend.md)
-   [🎨 Frontend Architecture](docs/markdown/rad-system-frontend.md)
-   [🚀 DevOps & Docker Strategy](docs/markdown/rad-system-docker.md)

## Project Structure
```bash
rad-system/
├── DevOps/             # Smart builders for artifact creation
├── Docker/             # Docker Compose & Configs (Postgres, Nginx)
├── docs/               # Detailed Documentation (Markdown)
├── rad-be/             # NestJS Backend Source
│   └── src/common/     # The Core Abstraction Layer
└── rad-fe/             # Angular Frontend Source
    ├── src/app/Fetures/ # Useful features
    └── src/app/Core/   # StoreService, Config, Interceptors
```

## Quick Start (Docker)
The entire system can be spun up with a single command:

```bash
docker compose up -d
```
*   **Frontend**: http://localhost:4200
*   **Backend API**: http://localhost:3000
*   **Swagger Docs**: http://localhost:3000/api-docs/v1

## Maintainer
[Marco Sbragi](https://github.com/msbragi)
