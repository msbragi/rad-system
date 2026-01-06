# Backend AI Agent Guide

Refer to the main [root copilot instructions](../../.github/copilot-instructions.md) for all general rules, architecture, and workflows.

## Backend-Specific Docs
- [Architecture](./architecture.md)
- [Quick Reference & Patterns](./quick-reference-patterns.md)
- **DO NOT** create or execute DB migration scripts.
    - **Instead:** Provide the data structure and the developer will apply DB changes.

---

### Before Writing Any Code
- **ASK TO DEVELOPER:** Where to find examples or guidelines for the feature you’re working on.   
- **Always extend `BaseService`** for CRUD operations.
- When in @agent mode, **ask for confirmation before making changes**.
- Check `todo.md` for pending tasks.

---

### Core Architecture & Patterns

- **Security:**  
  - JWT authentication is required.
  - Always validate ownership and permissions.

- **Database:**  
  - All entities extends [BaseEntity](`../../src/common/entities/base.entity`)
  - Use interfaces per consistency 
  - All interface name is prefixed with I and follow the pattern I{Namesingular} ex: IUser
  - Define proper entity relationships and validation.

---

### Security Standards

- Always implement ownership validation in services.
- Use the `@Public()` decorator only for truly public endpoints.
- Use the `@Admin()` decorator per required admin or super_user role.
- Validate all inputs with DTOs, interfaces and `class-validator`.
- Follow authentication patterns with the `@User()` decorator.

---

### Development Standards

- Comment code only if complex or unclear.
- Use TypeScript strictly with comprehensive typing.
- Follow clean architecture principles.
- Implement proper error handling with NestJS exceptions.

---

### Workflow for New Features or Changes

1. **Before you start:**
    - Ask where to find examples or guidelines for the feature you’re working on.
    - Confirm how to reuse existing libraries or services.

2. **For any uncertainty:**
    - Ask for guidance or examples before writing code.

---

