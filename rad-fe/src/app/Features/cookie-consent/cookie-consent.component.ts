import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";
import { TranslocoModule } from "@jsverse/transloco";
import { Subject, takeUntil } from "rxjs";
import {
  CookieDisplayMode,
  CookieService,
} from "../../Core/services/cookie.service";
import { CookiePreferencesDialogComponent } from "./cookie-preferences-dialog/cookie-preferences-dialog.component";

@Component({
  selector: "tc-cookie-consent",
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule,
    MatTooltipModule,
    TranslocoModule,
  ],
  templateUrl: "./cookie-consent.component.html",
  styleUrl: "./cookie-consent.component.scss",
})
export class CookieConsentComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  displayMode: CookieDisplayMode = null;

  constructor(
    private cookieService: CookieService,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.cookieService.consentStatus.subscribe(() => {
      this.displayMode = this.cookieService.show();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Accept all cookies
   */
  onAcceptAll(): void {
    this.cookieService.acceptAll();
  }

  /**
   * Accept only necessary cookies
   */
  onAcceptNecessaryOnly(): void {
    this.cookieService.acceptNecessaryOnly();
  }

  /**
   * Close banner without giving consent (dismiss)
   */
  onDismissBanner(): void {
    this.cookieService.dismissBanner();
  }

  /**
   * Open cookie preferences dialog
   */
  onManagePreferences(): void {
    const dialogRef = this.dialog.open(CookiePreferencesDialogComponent, {
      width: "500px",
      maxWidth: "90vw",
      disableClose: true,
      panelClass: "cookie-preferences-dialog",
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if (result) {
          // Dialog returns preferences object
          this.cookieService.setConsentPreferences(result);
        }
      });
  }
}
