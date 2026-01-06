import { Component, OnInit, OnDestroy } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";

import { AuthService } from "../../Services/api/auth.service";
import { StoreService } from "../../Core/services/store.service";
import { Subscription, interval, combineLatest, startWith } from "rxjs";
import { TranslocoModule } from "@jsverse/transloco";

@Component({
  selector: "tc-token-status",
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatTooltipModule, TranslocoModule],
  template: `
    <span *transloco="let t">
      @if (isExpiring) {
        <button
          mat-icon-button
          color="accent"
          class="token-status-button"
          (click)="refreshSession()"
          [matTooltip]="t('toolbar.session_expiring')"
          aria-label="Session expiring soon"
        >
          <mat-icon [class.pulse]="isExpiring">schedule</mat-icon>
        </button>
      }
    </span>
  `,
  styles: [
    `
      .token-status-button {
        margin: 5px 20px 0px 0px;
        color: #e23c2b;
        background-color: transparent;
      }

      .pulse {
        animation: pulse-animation 1.5s infinite;
      }

      @keyframes pulse-animation {
        0% {
          opacity: 1;
        }
        50% {
          opacity: 0.5;
        }
        100% {
          opacity: 1;
        }
      }
    `,
  ],
})
export class TokenStatusComponent implements OnInit, OnDestroy {
  isExpiring = false;
  private subscription?: Subscription;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Combine token changes with periodic checks
    this.subscription = combineLatest([
      StoreService.tokenChange$,
      interval(30000).pipe(startWith(0)), // Check every 30 seconds
    ]).subscribe(([token]) => {
      // Reset expiring state when token changes (logout or refresh)
      if (!token) {
        this.isExpiring = false;
        return;
      }

      // Check token status when authenticated
      this.checkTokenStatus();
    });
  }

  private checkTokenStatus(): void {
    // Only check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      this.isExpiring = false;
      return;
    }

    if (this.authService.isTokenExpiringSoon(5)) {
      // 5 minute warning
      this.isExpiring = true;
    } else {
      this.isExpiring = false;
    }
  }

  refreshSession(): void {
    this.authService.refreshToken().subscribe({
      next: () => {
        // Token status will be updated automatically via tokenChange$ observable
        console.log("Token refreshed successfully");
      },
      error: (error) => {
        console.error("Token refresh failed:", error);
        // Let the auth service handle logout if refresh fails
      },
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
