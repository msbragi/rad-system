import {
  HttpErrorResponse,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
  HttpClient,
} from "@angular/common/http";
import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { catchError, switchMap, throwError } from "rxjs";
import { StoreService } from "../services/store.service";
import { IRefreshTokenResponse } from "../../Models/auth.interface";
import { MatSnackBar } from "@angular/material/snack-bar";

/**
 * Helper function to clear authentication state properly
 * Defined outside interceptor - executed once at module load
 */
const clearAuthState = (): void => {
  StoreService.setJwtToken("");
  StoreService.setRefreshToken(null);
};

/**
 * Check if the request should be excluded from token refresh logic
 * Defined outside interceptor - executed once at module load
 * @param url The request URL to check
 * @returns true if the request should be excluded
 */
const shouldExcludeRequest = (url: string): boolean => {
  const apiUrl = StoreService.getApiUrl();
  const authEndpoint = `${apiUrl}/auth/`;

  // Exclude auth endpoints
  if (url.startsWith(authEndpoint)) {
    return true;
  }

  // Exclude assets endpoints (static resources, translations, etc.)
  if (url.includes("/assets/") || url.includes("/i18n/")) {
    return true;
  }

  // Exclude any static file requests
  const staticFileExtensions = [
    ".json",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".svg",
    ".ico",
    ".css",
    ".js",
  ];
  if (staticFileExtensions.some((ext) => url.includes(ext))) {
    return true;
  }

  return false;
};

/**
 * Interceptor that handles token refresh when receiving 401 errors
 * Attempts to refresh the access token and retry failed requests
 */
export const tokenRefreshInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  // Solo injection e variabili essenziali per ogni richiesta
  const router = inject(Router);
  const httpClient = inject(HttpClient);
  const snackBar = inject(MatSnackBar);

  const apiUrl = StoreService.getApiUrl();
  const refreshToken = StoreService.getRefreshToken();

  // Skip token refresh if no refresh token is available (user not authenticated)
  if (!refreshToken) {
    return next(request);
  }

  // Skip token refresh for excluded endpoints
  if (shouldExcludeRequest(request.url)) {
    return next(request);
  }

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      // Check if the error is 401 and we have a refresh token
      if (error.status === 401) {
        // Double-check refresh token availability (defensive programming)
        if (!refreshToken) {
          return throwError(() => error);
        }

        // Make direct HTTP call to refresh token without using AuthService
        return httpClient
          .post<IRefreshTokenResponse>(`${apiUrl}/auth/refresh-token`, {
            refresh_token: refreshToken,
          })
          .pipe(
            switchMap((response: IRefreshTokenResponse) => {
              // Handle wrapped response structure from backend
              const tokenData = response.data || response;

              // Store the new access token
              if (tokenData.access_token) {
                StoreService.setJwtToken(tokenData.access_token);

                // Clone the original request with the new token
                const clonedRequest = request.clone({
                  setHeaders: {
                    Authorization: `Bearer ${tokenData.access_token}`,
                  },
                });

                // Retry the original request with the new token
                return next(clonedRequest);
              }

              // If no new token in response, logout
              clearAuthState();
              router.navigate(["/login"]);
              return throwError(
                () => new Error("Token refresh failed - no access_token"),
              );
            }),
            catchError((refreshError) => {
              // If refresh fails, clear auth state and redirect to login
              clearAuthState();

              snackBar.open(
                "Your session has expired. Please log in again.",
                "OK",
                {
                  duration: 15000,
                },
              );

              router.navigate(["/login"]);
              return throwError(() => refreshError);
            }),
          );
      }

      // For other error types, just pass through
      return throwError(() => error);
    }),
  );
};
