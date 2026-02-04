import { Routes } from "@angular/router";
import { adminGuard } from "./Core/guards/admin.guard";
import { authGuard } from "./Core/guards/auth.guard";

export const routes: Routes = [
  {
    path: "login",
    loadComponent: () =>
      import("./Components/login/login.component").then(
        (c) => c.LoginComponent,
      ),
  },
  {
    path: "users",
    canActivate: [adminGuard],
    loadComponent: () =>
      import("./Components/user-management/user-management.component").then(
        (c) => c.UserManagementComponent,
      ),
  },
  {
    path: "user-profile",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./Components/user-profile/user-profile.component").then(
        (c) => c.UserProfileComponent,
      ),
  },
  {
    path: "change-password",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./Components/forgot-password/forgot-password.component").then(
        (c) => c.ForgotPasswordComponent,
      ),
  },
  {
    path: "forgot-password",
    loadComponent: () =>
      import("./Components/forgot-password/forgot-password.component").then(
        (c) => c.ForgotPasswordComponent,
      ),
  },
  {
    path: "reset-password",
    loadComponent: () =>
      import("./Components/reset-password/reset-password.component").then(
        (c) => c.ResetPasswordComponent,
      ),
  },
  {
    path: "view-pdf",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./Features/pdf-show/pdf-show.component").then(
        (c) => c.PdfShowComponent,
      ),
  },
  {
    path: "wellcome",
    loadComponent: () =>
      import("./Components/wellcome/wellcome.component").then(
        (c) => c.WellcomeComponent,
      ),
  },
  { path: "**", redirectTo: "wellcome" },
];
