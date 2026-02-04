// toolbar.component.ts

import { Component, EventEmitter, OnInit, Output } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatMenuModule } from "@angular/material/menu";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatTooltipModule } from "@angular/material/tooltip";
import { Router, RouterModule } from "@angular/router";
import { AuthService } from "../../Services/api/auth.service";
import { LangPickerComponent } from "../lang-picker/lang-picker.component";
import { ThemePickerComponent } from "../theme-picker/theme-picker.component";
import { TokenStatusComponent } from "../token-status/token-status.component";
import { ToolbarNavigationComponent } from "./toolbar-navigation.component";
import { ToolbarUserSectionComponent } from "./toolbar-user-section.component";

/**
 * Toolbar component that displays navigation controls, app logo, and user authentication options
 */
@Component({
  selector: "tc-toolbar",
  standalone: true,
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    LangPickerComponent,
    ThemePickerComponent,
    RouterModule,
    TokenStatusComponent,
    ToolbarNavigationComponent,
    ToolbarUserSectionComponent,
  ],
  templateUrl: "./toolbar.component.html",
  styleUrls: ["./toolbar.component.scss"],
})
export class ToolbarComponent implements OnInit {
  /** Event emitter for toggling the sidenav */
  @Output() toggleSidenav = new EventEmitter<void>();

  /** User data from authentication service */
  user: any = null;

  /** Fallback avatar if Google image fails */
  fallbackAvatar = "assets/img/avatars/default-avatar.png";

  /**
   * Creates an instance of the ToolbarComponent
   * @param authService - Service for handling user authentication
   * @param router - Angular router for navigation
   */
  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  /**
   * Initializes the component and subscribes to user authentication state
   */
  ngOnInit(): void {
    // Subscribe to user data from authentication service
    this.authService.currentUser$.subscribe((userData) => {
      this.user = userData;
    });
  }

  /**
   * Handles user logout by clearing authentication data and navigating to login page
   */
  logout(): void {
    this.authService.logout(); // Clear user data in AuthService
    this.router.navigate(["/login"]); // Redirect to login page
  }

  /**
   * Handle image load error by replacing with fallback
   */
  onAvatarError(event: any): void {
    event.target.src = this.fallbackAvatar;
  }
}
