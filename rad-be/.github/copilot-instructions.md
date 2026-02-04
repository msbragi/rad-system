# Backend Architecture & NestJS Standards

## 1. Context & Paths
- **Framework**: NestJS 11, TypeORM, PostgreSQL.
- **BASE_DIR**: `/workspace/angular/rad-system/rad-be`.

## 2. Core Components & Patterns (Re-use first)
- **Base Classes**: All entities must extend `BaseEntity`. All services must extend `BaseService`.
- **Interfaces**: Always prefix with `I` (e.g., `IUser`).
- **Security Decorators**: Use `@User()`, `@Public()`, and `@Admin()` for access control.
- **Common Helpers**: Check `${BASE_DIR}/src/common/` for shared guards, interceptors, and decorators before creating new ones.

## 3. Strict Rules
- **Ownership**: Every sensitive operation MUST implement `checkOwnership`.
- **Repositories**: NEVER use repositories directly in controllers; always go through a service.
- **Validation**: Use DTOs with `class-validator` for all inputs.

## 4. Workflow (BMAD)
1. **Brief**: Re-state the logic.
2. **Models**: Define Entity, Interface, and DTOs.
3. **Architecture**: Extend `BaseService`, implement `checkOwnership`.
4. **Delivery**: Code implementation.
