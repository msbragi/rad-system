# AI Coding Agent Guide
  - to understand project goal take a look at README.md 

## Project Overview

- **Frontend**: rad-fe (Angular 21, Angular Material, standalone components)
- **Backend**: rad-be (NestJS 11, TypeORM, MySQL)
- Each part has its own documentation:  
  - Frontend: `rag-fe/.github/copilot-instructions.md`  
  - Backend: `rag-be/.github/copilot-instructions.md`

## Architecture & Data Flow

- **Frontend**:  
  - Uses standalone Angular components, OnPush change detection, and smart/dumb component separation.
  - API communication via `ApiService` (do not use direct `HttpClient`).
  - Centralized error handling in services, not components.
  - Internationalization via `@jsverse/transloco` with flat JSON keys in `assets/i18n/`.
  - Common UI/logic helpers: `LoadingService`, `SnackbarService`, `StoreService`.
  - SCSS with BEM, strict encapsulation, no overriding Angular Material backgrounds/colors.

- **Backend**:  
  - Modular NestJS structure: feature modules, shared common module, global guards/interceptors.
  - All services extend `BaseService` for CRUD and ownership validation.
  - Entities extend `BaseEntity`; interfaces prefixed with `I` (e.g., `IUser`).
  - JWT authentication, ownership checks, DTO validation (`class-validator`).
  - SQLite per-user DBs for capsule content; MySQL for global/user data.
  - Decorators: `@User()`, `@Public()`, `@Admin()` for access control.

## Developer Workflows

- **Build/Run/Test**:  
  - Do not execute commands (`npm install`, `npm start`, etc.) or DB migrations.  
  - Ask the developer to run commands and provide logs if needed.
- **Feature Implementation**:  
  - Always check for existing services, helpers, or patterns before coding.
  - Ask where to find examples/guidelines for new features.
  - Confirm with the developer before making changes in @agent mode.
  - Reference architecture, patterns, and quick-reference docs in docs.

## Project-Specific Conventions

- **Frontend**:  
  - Use new Angular syntax (`@if`, `@for`, `@switch`).
  - Use Reactive Forms for validation.
  - Never handle errors in component subscriptions.
  - Use provided helpers/services for loading, notifications, and API calls.

- **Backend**:  
  - Use DTOs and interfaces for all input validation.
  - Follow clean architecture and strict TypeScript typing.
  - Implement error handling with NestJS exceptions.

## Integration Points

- **API**:  
  - Frontend communicates with backend via `ApiService` (see `Services/api/`).
  - Backend exposes RESTful endpoints, secured with JWT and role-based decorators.
- **Database**:  
  - MySQL/Postges for global data and metadata.
- **Media**:  
  - Media uploads via Multer.

