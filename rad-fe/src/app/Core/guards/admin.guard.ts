import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { map, catchError, of, filter, take, timeout, switchMap } from "rxjs";
import { AuthService } from "../../Services/api/auth.service";
import { SnackbarService } from "../services/snackbar.service";

/**
 * Guard that prevents access to admin routes unless the user has admin privileges
 * Redirects to dashboard if user is not an admin
 */
export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const snackbar = inject(SnackbarService);

  // First check if user is authenticated and token is not expired
  if (!authService.isAuthenticated() || authService.isTokenExpired()) {
    snackbar.error("auth.access_denied");
    return router.createUrlTree(["/login"]);
  }

  // If we already have user data, check it immediately
  const currentUser = authService.getCurrentUserValue();
  if (currentUser) {
    if (currentUser.role === "admin" || currentUser.role === "super_user") {
      return true;
    } else {
      snackbar.error("admin.access_denied");
      return router.createUrlTree(["/dashboard"]);
    }
  }

  // Otherwise, wait for user data to be loaded (with timeout)
  return authService.currentUser$.pipe(
    filter((user) => user !== null), // Wait for non-null user
    take(1), // Take only the first emission
    timeout(5000), // Add timeout to prevent infinite waiting
    map((user) => {
      // Check if user has admin privileges (admin or super_user)
      if (user && (user.role === "admin" || user.role === "super_user")) {
        return true;
      }

      // User is not an admin, show message and redirect
      snackbar.error("admin.access_denied");
      return router.createUrlTree(["/dashboard"]);
    }),
    catchError((error) => {
      // If there's an error or timeout, deny access
      console.error("AdminGuard error:", error);
      snackbar.error("auth.access_denied");
      return of(router.createUrlTree(["/login"]));
    }),
  );
};
