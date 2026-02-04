# Frontend Quick Reference & Patterns

> Use this guide for fast answers, code standards, and best practices. For architecture, see [architecture.md](./architecture.md).

## Essential Checklist
- Is there an API service for this endpoint? (`Services/api/`)
- Is there a loading helper? (`Core/services/loading.service.ts`)
- Are errors handled by interceptors? (Never in components)
- Is there a notification system? (`SnackbarService`)
- Are you using Reactive Forms and validators?
- Is there a date/time formatting pipe?
- Are you using translation keys from `assets/i18n/`?

## Common Operations
### API Calls
Use `ApiService` for all HTTP requests. Never use `HttpClient` directly.
```typescript
@Injectable()
export class MyService {
  constructor(private apiService: ApiService) {}
  getData(): Observable<MyData[]> {
    return this.apiService.get<MyData[]>('/my-endpoint');
  }
}
```

### User Notifications
Use `SnackbarService` for all user feedback.
```typescript
this.snackbar.showSuccess('common.save_success');
```

### Loading States
Use `LoadingService` for loading indicators. Managed automatically for HTTP calls.

### Error Handling
Errors are handled by interceptors. Do not handle errors in component subscriptions.

### Forms & Validation
Use Reactive Forms and validators from `Validators/`.
```typescript
formGroup = this.fb.group({
  name: ['', [Validators.required]],
  email: ['', [Validators.required, Validators.email]]
});
```

### Translations
Use `@jsverse/transloco` and flat JSON keys in `assets/i18n/`.

## Code Patterns
### Service Injection
```typescript
@Injectable({ providedIn: 'root' })
export class MyService {
  constructor(
    private apiService: ApiService,
    private snackbar: SnackbarService,
    private logger: LoggerService
  ) {}
}
```

### Component Structure
```typescript
@Component({})
export class MyComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  constructor(private service: MyService) {}
  ngOnInit(): void { this.loadData(); }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
```

### Anti-Patterns
- Do not use `HttpClient` directly.
- Do not handle errors in component subscriptions.
- Do not create custom loading flags; use `LoadingService`.
- Do not use manual notifications (e.g., `alert`).
- Do not duplicate helpers/services.

## Quick Import Reference
- `ApiService`, `SnackbarService`, `LoadingService`, `AuthService`, `DateFormatPipe`, `ContentTypeHelper`

---
For architecture details, see [architecture.md](./architecture.md).
