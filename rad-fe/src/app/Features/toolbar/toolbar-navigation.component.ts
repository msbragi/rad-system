import { Component, EventEmitter, Output } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { StoreService } from "../../Core/services/store.service";

/**
 * Navigation component for the toolbar - handles menu toggle and logo display
 */
@Component({
  selector: "tc-toolbar-navigation",
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  template: `
    <button
      mat-icon-button
      (click)="onToggleSidenav()"
      aria-label="Toggle navigation menu"
    >
      <mat-icon>menu</mat-icon>
    </button>
    <div class="logo-container">
      <img
        src="./assets/img/logo.png"
        [title]="appName"
        alt="logo"
        class="responsive-logo"
      />
      <span class="app-name">{{ appName }}</span>
    </div>
  `,
  styles: [
    `
      :host {
        display: flex;
        align-items: center;
      }

      .logo-container {
        display: flex;
        align-items: center;
        margin-left: 16px;
      }

      .logo-container .app-name {
        font-weight: bold;
        font-size: 1.2em;
        margin-left: 16px;
      }

      .responsive-logo {
        height: 32px;
        width: auto;

        @media (max-width: 768px) {
          height: 28px;
        }

        @media (max-width: 480px) {
          height: 24px;
        }
      }
    `,
  ],
})
export class ToolbarNavigationComponent {
  /** Event emitter for toggling the sidenav */
  @Output() toggleSidenav = new EventEmitter<void>();
  appName = StoreService.getAppName();
  /**
   * Emits the toggle sidenav event
   */
  onToggleSidenav(): void {
    this.toggleSidenav.emit();
  }
}
