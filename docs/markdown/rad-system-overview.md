# RAD-System Overview

In my previous post, I mentioned my aversion to "rebuilding." The RAD-system is the technical manifestation of this philosophy. It is a full-stack ecosystem designed to eliminate development background noise, allowing me to focus exclusively on Business Logic from minute zero.

---

## The Architecture: Consistency Across Layers

The system is built on a sharp yet synergistic separation between a NestJS 11 backend and an Angular 21 frontend.

### 1. Backend: The Power of Abstraction (DRY)

The backend core revolves around two fundamental abstractions that guarantee speed and security:

*   **BaseEntity**: All database entities extend this abstract class. It automatically handles audit columns (`createdAt`, `updatedAt`, `deletedAt`), enabling native soft-delete capabilities through TypeORM. Note: The Primary Key (ID) is defined in the concrete entity to allow flexibility.
*   **BaseService**: This generic class implements standard CRUD operations. It enforces secure data access by requiring the implementation of an abstract `checkOwnership()` method, ensuring that users can only access or modify data they own.

### 2. Frontend: Modern Angular Standards

The frontend leverages cutting-edge features of Angular 21 to maintain high performance and code maintainability:

*   **Standalone Components**: No NgModules, resulting in fully self-contained and modular components.
*   **Functional Interceptors**: A streamlined `HttpInterceptorFn` pattern manages the global loading spinner, JWT injection, and 401 token refresh logic.
*   **Reactive State**: Use of `BehaviorSubjects` and a dedicated `StoreService` for managing local/session storage without the overhead of NgRx.
*   **Infrastructure**: Docker-Native & Deployment

The entire stack is containerized for consistency across environments:

*   **PostgreSQL 16**: Data persistence with custom configurations and schema support.
*   **Backend (NestJS)**: Compiled Node 22 image running as a non-root user for security.
*   **Frontend (Nginx)**: Static assets served with Gzip compression and security headers.

This architecture demonstrates enterprise-grade standards, reducing boilerplate while maintaining a security-first design.
