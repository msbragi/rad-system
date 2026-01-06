# Backend Quick Reference & Patterns

> Use this guide for fast answers, code standards, and best practices. For architecture, see [architecture.md](./architecture.md).

## Essential Checklist
- Is there a service for this domain/entity? (`modules/`)
- Are you extending `BaseService` for CRUD and ownership?
- Is there a DTO for validation? (`dto/`)
- Are you using authentication guards/decorators?
  - Use `@Public()` for public endpoints (no authentication required)
  - Use `@Admin()` for administrator/super user endpoints
- Is there an email template for this use case?
- Are errors handled by interceptors?
- Are you following entity/interface naming conventions?

## Common Operations
### Service Pattern
Use `BaseService` for CRUD and ownership validation.
```typescript
@Injectable()
export class MyEntityService extends BaseService<MyEntity> {
  constructor(
    @InjectRepository(MyEntity) private repository: Repository<MyEntity>
  ) {
    super(repository);
  }
  protected async checkOwnership(id: number, userId: number): Promise<boolean> {
    const entity = await this.findOne(id);
    return entity?.userId === userId;
  }
}
```

### Controller Pattern
Use decorators for authentication and user context.
```typescript
@Controller('my-entity')
export class MyEntityController {
  constructor(private myEntityService: MyEntityService) {}
  @Get()
  async findAll(@User() user: any) {
    return this.myEntityService.findAllForUser(user.id);
  }
}
```

### DTO Pattern
Use `class-validator` for input validation.
```typescript
export class CreateMyEntityDto {
  @IsString()
  @IsNotEmpty()
  title: string;
}
```

### Entity Pattern
Extend `BaseEntity` and use proper relationships.
```typescript
@Entity('my_entities')
export class MyEntity extends BaseEntity {
  @Column({ length: 100 })
  title: string;
  @Column({ name: 'user_id' })
  userId: number;
}
```

### Anti-Patterns
- Do not use repositories directly in controllers.
- Do not skip ownership validation.
- Do not handle errors manually; use exceptions and interceptors.
- Do not expose internal fields in DTOs.

## Quick Import Reference
- `BaseService`, `BaseEntity`, `User`, `Public`, `Admin`, `JwtAuthGuard`, `EmailService`, `SqliteService`, `class-validator`

---
For architecture details, see [architecture.md](./architecture.md).
