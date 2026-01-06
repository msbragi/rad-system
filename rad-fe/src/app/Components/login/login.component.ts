import { Component } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { Router } from "@angular/router";
import { TranslocoDirective } from "@jsverse/transloco";
import { SnackbarService } from "../../Core/services/snackbar.service";
import { AuthService } from "../../Services/api/auth.service";

@Component({
  selector: "app-login",
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    TranslocoDirective,
  ],
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
})
export class LoginComponent {
  inputPassword: string = "password";
  loginForm: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackbar: SnackbarService,
  ) {
    this.loginForm = this.fb.group({
      identifier: ["", Validators.required],
      password: ["", Validators.required],
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) return;
    this.loading = true;
    const { identifier, password } = this.loginForm.value;
    this.authService
      .login({
        email: identifier,
        username: identifier,
        password,
      })
      .subscribe({
        next: () => {
          this.loading = false;
          this.snackbar.success("login.Welcome");
          this.router.navigate(["/wellcome"]);
        },
      });
  }

  viewPassword() {
    this.inputPassword =
      this.inputPassword === "password" ? "text" : "password";
  }

  forgotPassword() {
    this.router.navigate(["/forgot-password"]);
  }
}
