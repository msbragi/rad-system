# RAD System - Frontend Architecture

The RAD System Frontend is built with Angular 18+, emphasizing runtime configuration, centralized state management without heavy boilerplate, and a modular architecture.

## 1. Runtime Configuration: Build Once, Deploy Anywhere

**Problem:** Angular environment files are compiled into the build. To change an API URL, you usually have to rebuild the entire application.

**Solution:** We load the `app-config.json` file *before* the application bootstraps in `main.ts`. This allows the configuration to be injected at runtime, making the same build deployable to any environment (Dev, Staging, Prod) just by swapping the JSON file.

```typescript
// Load configuration before bootstrapping
const loadConfig = async () => {
  try {
    const dt = new Date().getMilliseconds();
    // Cache-busting to ensure fresh config
    const response = await fetch(`./assets/config/app-config.json?ver=${dt}`); 
    const config = await response.json();
    
    // Store config synchronously for global access
    StoreService.setConfig(config);

    bootstrapApplication(AppComponent, {
      ...appConfig,
      providers: [provideZoneChangeDetection(), ...appConfig.providers],
    });
  } catch (error) {
    console.error("Application cannot start without configuration:", error);
  }
};
loadConfig();
```

## 2. The Brain: StoreService

`StoreService` acts as a lightweight state management solution, effectively replacing heavy libraries like NgRx for standard applications. It also serves as a synchronous wrapper for the loaded configuration, allowing instant access to settings anywhere in the app.

```typescript
@Injectable({ providedIn: "root" })
export abstract class StoreService {
  private static PREFIX: string = "RAD.";

  // Static access allows usage outside Angular's DI (e.g., in functions)
  static set(key: string, value: any, persistent: boolean = false) {
    const storage = persistent ? localStorage : sessionStorage;
    storage.setItem(this.PREFIX + key, value);
  }
  
  static getApiUrl(): string {
    return this.CONFIG.apiUrl;
  }
}
```

## 3. Centralized API Management

Instead of scattering `HttpClient` calls throughout components, all features use the centralized `ApiService`. This service streamlines communication by:

*   Automatically prepending the `apiUrl` from the runtime configuration.
*   Standardizing HTTP Headers (Authorization, Content-Type).
*   Centralizing Error Handling logic (working in tandem with Interceptors).

## 4. Smart Components (The "LEGO" Blocks)

The system includes ready-to-use functional components located in `src/app/Features`:

*   **Dynamic Menu:** The `MenuComponent` constructs the navigation tree at runtime, filtering items based on the user's role (ACL) and the current configuration.
*   **Token Status:** A "Session Watchdog" component that visualizes JWT validity and proactively warns the user before their session expires.
*   **Lang Picker:** A dynamic dropdown component that facilitates instant interface language switching using `Transloco`.
