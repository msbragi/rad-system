import { Component, OnInit } from "@angular/core";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { TranslocoDirective } from "@jsverse/transloco";
import { SnackbarService } from "../../Core/services/snackbar.service";
import { AuthService } from "../../Services/api/auth.service";
import { matchPasswordValidator } from "../../Validators/match-password.validator";

@Component({
  selector: "app-reset-password",
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    RouterLink,
    TranslocoDirective,
  ],
  templateUrl: "./reset-password.component.html",
  styleUrls: ["./reset-password.component.scss"],
})
export class ResetPasswordComponent implements OnInit {
  loading = false;
  token = "";
  hidePassword = true;
  hideConfirmPassword = true;
  tokenInvalid = false;

  resetForm = new FormGroup(
    {
      password: new FormControl("", [
        Validators.required,
        Validators.minLength(8),
      ]),
      confirmPassword: new FormControl("", [Validators.required]),
    },
    { validators: matchPasswordValidator("password", "confirmPassword") },
  );

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private snackbarService: SnackbarService,
  ) {}

  ngOnInit(): void {
    // Get token from URL query parameters
    this.route.queryParams.subscribe((params) => {
      if (params["token"]) {
        this.token = params["token"];
      } else {
        this.tokenInvalid = true;
      }
    });
  }

  submit(): void {
    if (this.resetForm.invalid || !this.token) return;

    this.loading = true;
    const password = this.resetForm.value.password || "";

    this.authService.resetPassword(this.token, password).subscribe({
      next: () => {
        this.loading = false;
        this.snackbarService.success(
          "Your password has been reset successfully",
        );
        this.router.navigate(["/login"]);
      },
      error: (error: any) => {
        this.loading = false;
      },
    });
  }
}
