import { Component, OnInit } from "@angular/core";
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
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatTooltipModule } from "@angular/material/tooltip";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { Subject, finalize, takeUntil } from "rxjs";
import { IUser } from "../../Models/models.interface";
import { AuthService } from "../../Services/api/auth.service";
import { UserService } from "../../Services/api/user.service";
import { Router } from "@angular/router";

@Component({
  selector: "tc-user-profile",
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    TranslocoModule,
  ],
  templateUrl: "./user-profile.component.html",
  styleUrl: "./user-profile.component.scss",
})
export class UserProfileComponent implements OnInit {
  profileForm!: FormGroup;
  user: IUser | null = null;
  editMode = false;
  saving = false;
  private destroy$ = new Subject<void>();

  // Default avatar if none is provided
  defaultAvatar = "assets/img/avatars/default-avatar.png";

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private fb: FormBuilder,
    private router: Router,
    private translocoService: TranslocoService,
  ) {}

  ngOnInit(): void {
    // Initialize the form
    this.initForm();

    // Subscribe to user data from auth service
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        this.user = user;
        if (user) {
          this.updateFormWithUserData(user);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.profileForm = this.fb.group({
      username: [{ value: "", disabled: true }, [Validators.required]],
      email: [
        { value: "", disabled: true },
        [Validators.required, Validators.email],
      ],
      fullName: ["", Validators.maxLength(100)],
      avatar: ["", Validators.pattern(/^(https?:\/\/).+$/)],
    });
  }

  private updateFormWithUserData(user: IUser): void {
    this.profileForm.patchValue({
      username: user.username,
      email: user.email,
      fullName: user.fullName || "",
      avatar: user.avatar || "",
    });
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode;

    // If canceling edit, reset the form to original values
    if (!this.editMode && this.user) {
      this.updateFormWithUserData(this.user);
    }
  }

  getAvatarUrl(): string {
    return this.user?.avatar || this.defaultAvatar;
  }

  /**
   * Remove the avatar and restore the default one
   */
  removeAvatar(): void {
    if (this.editMode) {
      this.profileForm.get("avatar")?.setValue(null);
    }
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      return;
    }

    const formValue = this.profileForm.getRawValue();

    // Create update payload
    const updateData = {
      email: formValue.email,
      fullName: formValue.fullName || undefined,
      // If avatar is null/empty, explicitly set to null to remove it
      avatar: formValue.avatar || null,
    };

    this.saving = true;

    this.userService
      .updateCurrentUser(updateData)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.saving = false;
          this.editMode = false;
        }),
      )
      .subscribe({
        next: (updatedUser) => {
          // Update the auth service's currentUserSubject with the new data
          // This is a temporary solution until we move user state management to UserService
          this.authService["currentUserSubject"].next(updatedUser);
        },
      });
  }
  /**
   * Navigate to change password page
   */
  navigateToChangePassword(): void {
    this.router.navigate(["/change-password"]);
  }
}
