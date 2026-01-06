import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { ApplicationConfig, isDevMode } from "@angular/core";
import {
  provideRouter,
  withInMemoryScrolling,
  withViewTransitions,
} from "@angular/router";
import { provideTransloco } from "@jsverse/transloco";
import { routes } from "./app.routes";
import { authInterceptor } from "./Core/interceptors/auth.interceptor";
import { loadingInterceptor } from "./Core/interceptors/loading.interceptor";
import { tokenRefreshInterceptor } from "./Core/interceptors/token-refresh.interceptor";
import { TranslocoHttpLoader } from "./transloco-loader";
import {
  MAT_FORM_FIELD_DEFAULT_OPTIONS,
  MatFormFieldDefaultOptions,
} from "@angular/material/form-field";

const customFormFieldOptions: MatFormFieldDefaultOptions = {
  appearance: "outline",
  floatLabel: "auto",
  hideRequiredMarker: true,
  subscriptSizing: "dynamic", // This option itself requires Angular 16+
};
// Import locale registration
import { registerLocaleData } from "@angular/common";
import localeIt from "@angular/common/locales/it";

// Register Italian locale
registerLocaleData(localeIt);

export const appConfig: ApplicationConfig = {
  providers: [
    //provideAnimations(),
    provideRouter(
      routes,
      withViewTransitions({
        skipInitialTransition: true,
        onViewTransitionCreated: ({ transition }) => {
          // Skip transition if document is hidden
          if (document.hidden) {
            transition.skipTransition();
          }
        },
      }),
      withInMemoryScrolling({
        scrollPositionRestoration: "top",
        anchorScrolling: "enabled",
      }),
    ),
    provideHttpClient(
      withInterceptors([
        loadingInterceptor, // First - handle loading state
        authInterceptor, // Second - add authentication token
        tokenRefreshInterceptor, // Last - handle token refresh if needed
      ]),
    ),
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: customFormFieldOptions,
    },
    provideTransloco({
      config: {
        availableLangs: ["en", "it"],
        defaultLang: "it",
        fallbackLang: "it",
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
        missingHandler: {
          logMissingKey: true,
          useFallbackTranslation: true,
        },
      },
      loader: TranslocoHttpLoader,
    }),
  ],
};
