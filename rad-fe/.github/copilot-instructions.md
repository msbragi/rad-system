# Frontend Architecture & Angular 21 Standards

## 1. Context & Tech Stack
- **Framework**: Angular 21, Standalone Components, Angular Material.
- **BASE_DIR**: `/workspace/angular/rad-system/rad-fe`.

## 2. Core Services & Components (Re-use first)
- **API**: Use `ApiService` for all calls (extends `HttpClient` logic).
- **UI Feedback**: Use `SnackbarService` (notifications) and `LoadingService` (spinners).
- **Storage**: Use `StoreService` for state/local storage.
- **Utilities**: Check `src/app/Utils/` and `src/app/Pipes/` (e.g., `DateFormatPipe`) before coding helpers.

## 3. Strict UI Rules
- **Control Flow**: ONLY `@if`, `@for`, `@switch`.
- **Error Handling**: NO error callbacks in components; handled by `Core/interceptors/`.
- **i18n**: All text must use `transloco` keys from `assets/i18n/`.

## 4. Project Structure Reference
- `src/app/Core/`: Guards, interceptors, core services.
- `src/app/Features/`: Reusable UI components.
- `src/app/Componets/`: Feature-specific components.

## 5. Workflow (BMAD)
1. **Brief**: Analyze UI requirements.
2. **Models**: Define TypeScript interfaces.
3. **Architecture**: Choose standalone components, define service integration.
4. **Delivery**: Final code using Reactive Forms and OnPush.