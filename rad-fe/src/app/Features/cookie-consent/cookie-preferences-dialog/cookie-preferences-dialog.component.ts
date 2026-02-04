import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { MatIconModule } from "@angular/material/icon";
import { MatDividerModule } from "@angular/material/divider";
import { TranslocoModule } from "@jsverse/transloco";

import {
  CookieService,
  CookiePreferences,
} from "../../../Core/services/cookie.service";

@Component({
  selector: "tc-cookie-preferences-dialog",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatIconModule,
    MatDividerModule,
    TranslocoModule,
  ],
  templateUrl: "./cookie-preferences-dialog.component.html",
  styleUrl: "./cookie-preferences-dialog.component.scss",
})
export class CookiePreferencesDialogComponent implements OnInit {
  preferences: CookiePreferences = {
    necessary: true,
    analytics: false,
    marketing: false,
    functional: false,
  };

  constructor(
    private dialogRef: MatDialogRef<CookiePreferencesDialogComponent>,
    private cookieService: CookieService,
  ) {}

  ngOnInit(): void {
    // Load current preferences
    const currentStatus = this.cookieService.getConsentStatus();
    this.preferences = { ...currentStatus.preferences };
  }

  /**
   * Save preferences and close dialog
   */
  onSave(): void {
    this.dialogRef.close(this.preferences);
  }

  /**
   * Cancel without saving
   */
  onCancel(): void {
    this.dialogRef.close(null);
  }

  /**
   * Set all cookies to enabled (but don't save yet)
   */
  onAcceptAll(): void {
    this.preferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true,
    };
    // Don't close dialog - user must click Save
  }

  /**
   * Set only necessary cookies (but don't save yet)
   */
  onAcceptNecessaryOnly(): void {
    this.preferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
    };
    // Don't close dialog - user must click Save
  }
}
