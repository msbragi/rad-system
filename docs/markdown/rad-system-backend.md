# The Engineering of Speed

In a Rapid Architecture Development (RDA) system, the backend shouldn't just be a collection of endpoints, but an abstract machine capable of handling 90% of repetitive work without manual intervention. The heart of our NestJS system lies in the combination of `BaseEntity` and `BaseService`.

---

### 1. The Foundation: BaseEntity and Dynamic Audit

Every database record must be traceable. Instead of defining timestamp fields in every entity, the RAD-system uses an abstract `BaseEntity`.

This class ensures that every table in your PostgreSQL 16 natively manages the data lifecycle, including Soft Delete. The Primary Key (ID) is defined in the concrete entity, allowing flexibility (UUID or Integer).

```typescript
import { CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { IBase } from '../interfaces/models.interface';

export abstract class BaseEntity implements IBase {

    @ApiProperty()
    @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @ApiProperty()
    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    updatedAt?: Date;

    @ApiProperty()
    @DeleteDateColumn({ name: 'deleted_at', nullable: true })
    deletedAt?: Date | null;
}
```

### 2. The Engine: BaseService and Generics

The real magic happens in the `BaseService`. Thanks to TypeScript Generics, this class can manage any entity, providing ready-to-use CRUD methods.

The advantage here is twofold:

*   **DRY (Don't Repeat Yourself)**: You never write the same findOne or findAll logic twice.
*   **Type Safety**: The compiler knows exactly what type of object you are manipulating.

**Implementing CRUD Logic**

Let's look at the structure of the `BaseService`:

```typescript
export abstract class BaseService<T extends BaseEntity> {
  constructor(protected readonly repository: Repository<T>) {}

  // Abstract method that must be implemented by concrete services
  protected abstract checkOwnership(id: number, userId: number): Promise<boolean>;

  async findAll(options?: FindManyOptions<T>): Promise<T[]> {
    return await this.repository.find(options);
  }

  async findOne(id: number | string, options?: FindOneOptions<T>): Promise<T> {
    const entity = await this.repository.findOne({ where: { id } as any, ...(options as any) });
    if (!entity) throw new NotFoundException(`Entity with ID ${id} not found`);
    return entity;
  }
}
```

### 3. Security in the DNA: Ownership Validation

In many applications, security is added as an "external layer". In the RAD-system, security is an integral part of the service.

Through the `checkOwnership` abstract method, we enforce user validation on every sensitive operation. If a user tries to access a resource they didn't create (or don't own), the system raises a ForbiddenException at the core level.

```typescript
async findOneByUser(id: number, userId: number, options?: FindOneOptions<T>): Promise<T> {
    const hasAccess = await this.checkOwnership(id, userId);
    if (!hasAccess) {
        throw new ForbiddenException('Access denied');
    }
    const entity = await this.findOne(id, options);
    if (!entity) {
        throw new NotFoundException(`Entity not found`);
    }
    return entity;
}

// Note: Concrete services must implement checkOwnership, for example:
// protected async checkOwnership(id: number, userId: number): Promise<boolean> {
//   const count = await this.repository.count({ where: { id, userId } as any });
//   return count > 0;
// }
```

### 4. Why this architecture wins

Moving from RAD (Development) to RDA (Architecture) means that when you create a new module — for example Invoices or Tasks — your development activity is reduced to:

1.  Defining the entity that extends `BaseEntity`.
2.  Defining the service that extends `BaseService`.

Done. You already have secure, validated endpoints with soft-delete and time tracking, ready to be consumed by the Angular frontend.

### 5. The Core: Common Utilities & Interceptors
The `src/common` folder is the architectural backbone. It ensures that every part of the system behaves consistently without code duplication.

#### Global Response Standardization
Instead of returning raw objects, the `TransformInterceptor` intercepts every response to ensure a consistent JSON structure (standardizing data, timestamps, and request paths) and applies `class-transformer` rules (like `@Exclude()`).

```typescript
// src/common/interceptors/transform.interceptor.ts
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<unknown>> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<Response<unknown>> {
        const request = context.switchToHttp().getRequest();
        return next.handle().pipe(
            map(data => ({
                data: instanceToPlain(data), // Applies entity serialization rules
                timestamp: new Date().toISOString(),
                path: request.url,
            })),
        );
    }
}
```

#### Intelligent Guards
Security is applied globally. The `JwtAuthGuard` is registered globally but respects the `@Public()` decorator using NestJS `Reflector`. This means the system is **secure by default**: you must explicitly opt-out of security, not opt-in.

```typescript
// src/common/guards/jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') implements CanActivate {
  constructor(private reflector: Reflector) { super(); }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }
}
```

### 6. Agnostic Database Management
The system is designed to be database-agnostic, supporting PostgreSQL and MySQL/MariaDB out of the box without changing a single line of business logic.

#### Dynamic Configuration
The `database.config.ts` file dynamically loads the correct TypeORM driver based on the `DB_TYPE` environment variable. This allows you to use lightweight databases (like SQLite) for local testing and robust databases (like PostgreSQL) for production.

#### The SQL Helper: Solving Dialect Hell
Writing raw SQL often ties you to a specific vendor (e.g., string concatenation uses `||` in Postgres but `CONCAT()` in MySQL). The `SqlHelper` utility abstracts these differences, ensuring your custom queries run everywhere.

```typescript
// src/common/utils/sql.helper.ts
export class SqlHelper {
    static concat(...values: (string | string[])[]): string {
        const flatValues = values.flat();
        switch (this.getDbType()) {
            case 'postgres':
            case 'sqlite':
                return flatValues.join(' || '); // Standard SQL
            case 'mysql':
            default:
                return `CONCAT(${flatValues.join(', ')})`; // MySQL specific
        }
    }
}
```

### 7. Structured for Scale: Modular Filesystem

The backend is organized into a modular structure where each feature is self-contained. Here is the structure of `rad-be/src/modules`:

*   `admin/`: System administration features.
*   `auth/`: JWT authentication, SSO, and guards.
*   `config/`: Dynamic configuration management.
*   `departments/`: Organization structure management.
*   `email/`: Notification system with Handlebars templates.
*   `users/`: User management and profile handling.

### 8. Declarative Security: Custom Decorators

Security in this system is declarative, handled by custom decorators located in `common/decorators`. This keeps controllers clean and readable.

Key decorators include:

*   `@Public()`: To whitelist endpoints (bypass JWT guard).
*   `@User()`: To inject the current user into the controller method (cleaner than `req.user`).
*   `@AdminRequired()`: To enforce role-based access.

```typescript
// Example usage in a Controller
@Controller('users')
export class UsersController {
  
  @Get('profile')
  getProfile(@User() user: UserEntity) {
    return user;
  }

  @Post()
  @AdminRequired() // Only admins can create users
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }
}
```

### 9. Auto-Documentation: OpenAPI 3 & Swagger

The system automatically generates API documentation using `DocumentBuilder` in `main.ts`.

*   Interactive documentation is served at `/api-docs/v1`.
*   A `rad-openapi3-spec.json` file is auto-generated on every build, which is useful for frontend client generation.
