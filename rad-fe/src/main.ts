import { provideZoneChangeDetection } from "@angular/core";
/// <reference types="@angular/localize" />
import { bootstrapApplication } from "@angular/platform-browser";
import { appConfig } from "./app/app.config";
import { AppComponent } from "./app/app.component";
import { StoreService } from "./app/Core/services/store.service";

// Load configuration before bootstrapping the application
const loadConfig = async () => {
  try {
    const dt = new Date().getMilliseconds();
    const response = await fetch(`./assets/config/app-config.json?ver=${dt}`);

    if (!response.ok) {
      throw new Error(
        `Failed to load configuration: ${response.status} ${response.statusText}`,
      );
    }

    const config = await response.json();
    StoreService.setConfig(config);

    // Bootstrap application after config is loaded (or failed to load)
    bootstrapApplication(AppComponent, {
      ...appConfig,
      providers: [provideZoneChangeDetection(), ...appConfig.providers],
    }).catch((err) => console.error("Application bootstrap failed:", err));
  } catch (error) {
    console.error(
      "Fatal error: Application cannot start without configuration:",
      error,
    );
  }
};

// Execute the configuration loading
loadConfig();
