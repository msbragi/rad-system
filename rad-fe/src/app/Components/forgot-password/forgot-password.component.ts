import { Component, OnInit } from "@angular/core";

import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { Router, RouterLink } from "@angular/router";
import {
  AuthService,
  ISsoPasswordLinks,
} from "../../Services/api/auth.service";
import { TranslocoDirective } from "@jsverse/transloco";
import { SnackbarService } from "../../Core/services/snackbar.service";

@Component({
  selector: "app-forgot-password",
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    TranslocoDirective,
    RouterLink,
  ],
  templateUrl: "./forgot-password.component.html",
  styleUrls: ["./forgot-password.component.scss"],
})
export class ForgotPasswordComponent implements OnInit {
  loading = false;
  isLoggedIn = false;
  userEmail = "";
  ssoLinks: ISsoPasswordLinks[] = [];

  forgotPasswordForm = new FormGroup({
    email: new FormControl("", [Validators.required, Validators.email]),
  });

  constructor(
    private authService: AuthService,
    private router: Router,
    private snackbarService: SnackbarService,
  ) {}

  ngOnInit() {
    // Check if user is authenticated
    this.isLoggedIn = this.authService.isAuthenticated();

    if (this.isLoggedIn) {
      // Get current user's email and auto-fill
      const currentUser = this.authService.getCurrentUserValue();
      this.authService.getSsoPasswordLinks().subscribe((links) => {
        this.ssoLinks = links;
        if (!this.ssoLinks || this.ssoLinks.length === 0) {
          if (currentUser?.email) {
            this.userEmail = currentUser.email;
            this.forgotPasswordForm.patchValue({ email: currentUser.email });
            this.forgotPasswordForm.get("email")?.disable(); // Lock the field
          }
        }
      });
    }
  }

  submit() {
    if (this.forgotPasswordForm.invalid) return;

    this.loading = true;
    const email = this.forgotPasswordForm.value.email || "";

    this.authService.requestPasswordReset(email).subscribe({
      next: () => {
        this.loading = false;
        if (this.isLoggedIn) {
          this.snackbarService.success(
            "Password change email sent. Please check your inbox to continue.",
          );
          this.router.navigate(["/dashboard"]);
        } else {
          this.snackbarService.success(
            "Password reset email sent. Please check your inbox.",
          );
          this.router.navigate(["/login"]);
        }
      },
      error: (error: any) => {
        this.loading = false;
      },
    });
  }
}
