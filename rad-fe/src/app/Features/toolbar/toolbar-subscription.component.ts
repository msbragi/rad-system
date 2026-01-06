import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";
import { RouterModule } from "@angular/router";
import { AuthService } from "../../Services/api/auth.service";

/**
 * Subscription component for the toolbar - handles subscription badge display
 */
@Component({
  selector: "tc-toolbar-subscription",
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    RouterModule,
  ],
  template: `
    <button
      mat-button
      class="subscription-badge"
      [ngClass]="getSubscriptionBadgeClass()"
      [routerLink]="getSubscriptionLink()"
      [matTooltip]="getSubscriptionTooltip()"
    >
      <mat-icon>{{ getSubscriptionIcon() }}</mat-icon>
      <span class="subscription-text">{{ getSubscriptionDisplayText() }}</span>
    </button>
  `,
  styles: [
    `
      .subscription-badge {
        margin-right: 8px;
        border-radius: 16px;
        font-size: 12px;
        padding: 4px 12px;
        min-width: auto;
      }

      .subscription-text {
        margin-left: 4px;
        font-weight: 500;
      }

      .subscription-badge-guest {
        color: #666;
        background-color: rgba(0, 0, 0, 0.04);
      }

      .subscription-badge-active {
        color: #1976d2;
        background-color: rgba(25, 118, 210, 0.08);
      }

      @media (max-width: 768px) {
        .subscription-text {
          display: none !important; // Hide text labels on mobile
        }
      }
    `,
  ],
})
export class ToolbarSubscriptionComponent implements OnInit {
  /** User data from authentication service */
  user: any = null;

  constructor(private authService: AuthService) {}

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
   * Get the appropriate CSS class for the subscription badge
   */
  getSubscriptionBadgeClass(): string {
    if (!this.user) {
      return "subscription-badge-guest";
    }

    // Check if user has any active plans - simplified logic
    // For now, we'll consider a user as having active plans if they exist
    // This can be refined later to check actual subscription status
    return "subscription-badge-active";
  }

  /**
   * Get the appropriate icon for the subscription badge
   */
  getSubscriptionIcon(): string {
    if (!this.user) {
      return "local_offer"; // Shopping/pricing icon for guests
    }

    // Simplified: logged-in users get the plans icon
    return "view_list"; // Plans/list icon for logged-in users
  }

  /**
   * Get the display text for the subscription badge
   */
  getSubscriptionDisplayText(): string {
    if (!this.user) {
      return "Buy Plans";
    }

    // Simplified: logged-in users see "My Plans"
    return "My Plans";
  }

  /**
   * Get the tooltip text for the subscription badge
   */
  getSubscriptionTooltip(): string {
    if (!this.user) {
      return "View our pricing plans and purchase capsules";
    }

    // Simplified tooltip for logged-in users
    return "View your plans and usage details";
  }

  /**
   * Get the appropriate link for the subscription badge
   */
  getSubscriptionLink(): string {
    if (!this.user) {
      return "/subscription-plans"; // Public plans page for guests
    }
    return "/subscription"; // Private subscription status page for logged-in users
  }
}
