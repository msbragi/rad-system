
# Backend Architecture (Condensed)

> **Version**: NestJS 11 with TypeORM  
> **Purpose**: High-level overview of architecture and data flow for AI assistants

## Core Structure & Data Flow
- **NestJS 11** with **TypeORM** and hybrid database strategy
- Modular: `src/modules/` for features, `src/common/` for shared infrastructure
- **Database**: MySQL (global/user data) + SQLite (per-user capsule content)
- **Authentication**: JWT-based with role decorators (`@Public()`, `@Admin()`)
- **Error Handling**: Global interceptors handle errors, formatting, and logging

## Mandatory Patterns
- All services extend `BaseService` for CRUD and ownership validation
- Entities extend `BaseEntity`; interfaces prefixed with `I` (e.g., `IUser`)
- Use DTOs with `class-validator` decorators for input validation
- Always validate ownership in services via `checkOwnership` method
- Use decorators for authentication: `@User()`, `@Public()`, `@Admin()`

## Key Integration Points
- **Email**: `EmailService` with Handlebars templates in 6 languages
- **Media**: File uploads via Multer, stored per user
- **Database**: Per-user SQLite DBs managed via `SqliteService`

## 📁 Project Structure Overview

```
src/
├── app.module.ts              # Main application module with global configuration
├── main.ts                    # Application bootstrap
├── common/                    # Shared infrastructure components
│   ├── decorators/           # Custom parameter decorators (@User, @Public)
│   ├── entities/             # Base entity with common fields
│   ├── guards/               # Authentication guards (JWT)
│   ├── interceptors/         # Global interceptors (logging, transform, error)
│   ├── interfaces/           # Shared TypeScript interfaces
│   ├── pipes/                # Custom validation pipes
│   └── services/             # Base services and utilities
│       └── base.service.ts   # Abstract CRUD service with ownership
└── modules/                  # Feature modules
    ├── auth/                 # Authentication & authorization
    └── users/                # User management & statistics
```

---

### Core Business Services

| Service | Purpose | Key Features |
|---------|---------|-------------|
| `AuthService` | Authentication | JWT, OAuth, email verification, password reset |

---

## Global Interceptors & Response Formats

| Interceptor | Purpose | Response Format |
|-------------|---------|-----------------|
| `ErrorInterceptor` | Error handling | `{ success: false, message: string, error?: any }` |
| `TransformInterceptor` | Response formatting | `{ success: true, data: any, message?: string }` |
| `LoggingInterceptor` | Request logging | N/A (logs to console/file) |
| `ThrottlerGuard` | Rate limiting | N/A (returns 429 when exceeded) |

---

## Anti-Patterns to Avoid

| Pattern | Why It's Wrong | Correct Approach |
|---------|----------------|-----------------|
| Direct repository usage in controllers | Bypasses service layer logic | Always use services for data access |
| Missing ownership validation | Security vulnerability | Use `checkOwnership()` in services |
| Manual error handling with try/catch | Inconsistent error responses | Let global interceptors handle errors |

---

## For Code Examples & Patterns

For detailed code examples, patterns, and import references, see [quick-reference-patterns.md](./quick-reference-patterns.md).
