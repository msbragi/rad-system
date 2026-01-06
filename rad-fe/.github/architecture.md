# Frontend Architecture (Condensed)

> **Version**: Angular 21 with Angular Material  
> **Last Updated**: October 2025  
> **Purpose**: High-level overview of architecture and data flow for AI assistants

## Core Structure & Data Flow
- **Angular 20** with **standalone components** and OnPush change detection
- Smart/dumb component pattern for separation of logic and UI
- API communication via `ApiService` (never direct `HttpClient`)
- Centralized error handling in services, not components
- Internationalization via `@jsverse/transloco` with flat keys in `assets/i18n/`

## Mandatory Patterns
- Use new Angular syntax (`@if`, `@for`, `@switch`) instead of structural directives
- All API calls through `ApiService` (never use `HttpClient` directly)
- Use Reactive Forms with validators for all forms
- Error handling at service level, not in component subscriptions
- SCSS with BEM methodology and strict component encapsulation
- No overriding Angular Material backgrounds/colors

## Key Integration Points
- **API**: Services in `Services/api/` (extending `ApiService`)
- **UI Feedback**: `SnackbarService` for all user notifications
- **Loading**: `LoadingService` with automatic HTTP request tracking
- **Authentication**: JWT with `AuthService` and guards
- **Forms**: Reactive Forms with validators from `Validators/`

## 📁 Project Structure Overview

```
src/app/
├── Componets/              # Here lives all developed components
├── Core/                    # Essential services, guards, interceptors
│   ├── guards/             # Route protection
│   ├── interceptors/       # HTTP interceptors
│   └── services/           # Core application services
├── Services/               # Business logic services
│   └── api/               # Backend API communication
├── Features/              # Reusable UI components
├── Models/                # TypeScript interfaces and types
├── Pipes/                 # Data transformation pipes
├── Utils/                 # Helper functions and utilities
├── Validators/            # Custom form validators
└── Directives/            # Custom Angular directives
```

---

## Core Services & Utilities

| Service | Purpose | Key Features |
|---------|---------|-------------|
| `ApiService` | Foundation HTTP service | JWT injection, error handling, standardized responses |
| `SnackbarService` | User notifications | Success, error, warning messages with translations |
| `LoadingService` | Loading state management | Automatic tracking of HTTP requests |
| `AuthService` | Authentication | Login, JWT handling, session management |
| `TokenService` | Token management | Storage, validation, refresh |
| `LoggerService` | Centralized logging | Environment-aware logging (replaces console.log) |
| `StoreService` | Client-side storage | LocalStorage wrapper with encryption |
| `ContentTypeHelper` | File operations | MIME type detection, validation, icon mapping |
| `DateFormatPipe` | Date formatting | Consistent date display across app |

---

## Guards & Interceptors

| Component | Purpose | Features |
|-----------|---------|----------|
| `AuthGuard` | Route protection | Redirect unauthenticated users |
| `AuthInterceptor` | Token injection | Add JWT to all API requests |
| `LoadingInterceptor` | Loading UI | Manage loading spinner automatically |
| `TokenRefreshInterceptor` | Token management | Silent refresh of expired tokens |

---

## Anti-Patterns to Avoid

| Pattern | Why It's Wrong | Correct Approach |
|---------|----------------|-----------------|
| Direct HttpClient usage | Bypasses error handling | Use `ApiService` |
| Error handling in components | Inconsistent UI feedback | Let services & interceptors handle |
| Custom loading flags | Duplicate functionality | Use `LoadingService` |
| Manual toast notifications | Inconsistent UX | Use `SnackbarService` |
| Direct console.log | No environment control | Use `LoggerService` |

---

## For Code Examples & Patterns

For detailed code examples, patterns, and import references, see [quick-reference-patterns.md](./quick-reference-patterns.md).
