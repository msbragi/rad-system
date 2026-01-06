import { inject } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "../../Services/api/auth.service";

/**
 * Guard that prevents access to protected routes unless the user is authenticated
 * Redirects to login page if user is not authenticated
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);

  // Check if the user is authenticated
  if (authService.isAuthenticated()) {
    // Allow access to the route
    return true;
  }

  // User is not authenticated, show message and redirect to login
  snackBar.open("Please log in to access this page", "OK", {
    duration: 5000,
  });

  // Redirect to login page
  return router.createUrlTree(["/login"]);
};
