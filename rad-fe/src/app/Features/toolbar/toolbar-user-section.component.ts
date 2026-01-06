import { Component, OnInit } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatDivider } from "@angular/material/list";
import { MatMenuModule } from "@angular/material/menu";
import { Router, RouterModule } from "@angular/router";
import { Subject, takeUntil } from "rxjs";
import { AuthService } from "../../Services/api/auth.service";
import { ImageComponent } from "../image-loader/tc-image-component";

/**
 * User section component for the toolbar - handles user avatar, login/logout
 */
@Component({
  selector: "tc-toolbar-user-section",
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDivider,
    RouterModule,
    ImageComponent,
  ],
  template: `
    <!-- User is logged in: show avatar with dropdown menu -->
    @if (user) {
      <button mat-button [matMenuTriggerFor]="userMenu" class="avatar-button">
        <tc-image
          [src]="user.avatar"
          [alt]="user.fullName"
          fallback="assets/img/avatars/default-avatar.png"
          size="32px"
          cssClass="user-avatar"
        >
        </tc-image>
      </button>

      <!-- User dropdown menu -->
      <mat-menu #userMenu="matMenu" xPosition="before">
        <!--
        <div mat-menu-item class="user-menu-header">
          {{ user.role || 'User' }}
        </div>
        -->
        <div mat-menu-item class="user-menu-header">
          {{ user.fullName }}
        </div>
        <mat-divider></mat-divider>
        <button mat-menu-item routerLink="/user-profile">
          <mat-icon>account_circle</mat-icon>
          <span>Profile</span>
        </button>
        <button mat-menu-item (click)="logout()">
          <mat-icon>logout</mat-icon>
          <span>Logout</span>
        </button>
      </mat-menu>
    } @else {
      <!-- User is NOT logged in: show login button -->
      <button mat-button class="btn" routerLink="/login">
        <mat-icon>person</mat-icon>
        <span>Login</span>
      </button>
    }
  `,
  styles: [
    `
      :host {
        display: flex;
        align-items: center;
        height: 100%;
      }

      .avatar-button {
        padding: 0;
        min-width: auto;
        height: 40px;
        width: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
      }

      .user-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        object-fit: cover;
        display: block;
      }

      .user-menu-header {
        font-weight: 500;
        cursor: default;
      }

      .btn {
        height: 36px;
        padding: 0 16px;
        display: flex;
        align-items: center;
        gap: 8px;
        border-radius: 4px;
        font-size: 14px;
        background-color: transparent;
        border: 1px solid rgba(255, 255, 255, 0.23);
        color: inherit;
      }

      .btn:hover {
        background-color: rgba(255, 255, 255, 0.04);
        border-color: rgba(255, 255, 255, 0.3);
      }
    `,
  ],
})
export class ToolbarUserSectionComponent implements OnInit {
  /** User data from authentication service */
  user: any = null;
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  /**
   * Initializes the component and subscribes to user authentication state
   */
  ngOnInit(): void {
    // Subscribe to user data from authentication service
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        this.user = user;
      });
  }

  /**
   * Handles user logout by clearing authentication data and navigating to login page
   */
  logout(): void {
    this.authService.logout(); // Clear user data in AuthService
    this.router.navigate(["/login"]); // Redirect to login page
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
