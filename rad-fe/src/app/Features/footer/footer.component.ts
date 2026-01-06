import { CommonModule } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { Router } from "@angular/router";
import { TranslocoService } from "@jsverse/transloco";
import { catchError, map, of, Subscription } from "rxjs";

@Component({
  selector: "tc-footer",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./footer.component.html",
  styleUrls: ["./footer.component.scss"],
})
export class FooterComponent implements OnInit, OnDestroy {
  footer: SafeHtml = "";
  private footerDefault: SafeHtml = "";
  private subscriptions = new Subscription();
  private isDefaultLoaded = false;

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private router: Router,
    private translocoService: TranslocoService,
  ) {}

  ngOnInit(): void {
    // First load the default footer
    this.loadDefaultFooter();

    // Then subscribe to language changes
    const langSub = this.translocoService.langChanges$.subscribe((lang) => {
      // Wait for default footer to load before attempting to load language-specific footer
      if (this.isDefaultLoaded) {
        this.loadFooterForLanguage(lang);
      } else {
        // If default footer isn't loaded yet, set up a small delay and retry
        setTimeout(() => {
          if (this.isDefaultLoaded) {
            this.loadFooterForLanguage(lang);
          }
        }, 300);
      }
    });

    this.subscriptions.add(langSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Load the default English footer
   */
  private loadDefaultFooter(): void {
    const url = `assets/i18n/footer/en.html`;
    const defaultSub = this.http.get(url, { responseType: "text" }).subscribe({
      next: (html) => {
        this.footerDefault = this.sanitizer.bypassSecurityTrustHtml(html);
        this.footer = this.footerDefault;
        this.isDefaultLoaded = true;

        // Check if current language is not English and load it
        const currentLang = this.translocoService.getActiveLang();
        if (currentLang !== "en") {
          this.loadFooterForLanguage(currentLang);
        }
      },
      error: (error) => {
        console.error("Failed to load default footer:", error);
        this.footerDefault = this.sanitizer.bypassSecurityTrustHtml(
          `<p>Footer content not available</p>`,
        );
        this.footer = this.footerDefault;
        this.isDefaultLoaded = true;
      },
    });

    this.subscriptions.add(defaultSub);
  }

  /**
   * Load footer content for the specified language
   * @param lang Language code (always forced to 'en' for simplicity)
   */
  private loadFooterForLanguage(lang: string): void {
    // Always load English footer to avoid missing translation errors
    const footerLang = "en";

    const footerSub = this.http
      .get(`assets/i18n/footer/${footerLang}.html`, { responseType: "text" })
      .pipe(
        map((content) => this.sanitizer.bypassSecurityTrustHtml(content)),
        catchError((error) => {
          console.error(
            `Failed to load footer for language: ${footerLang}`,
            error,
          );
          return of(this.createErrorHtml("Footer content not available"));
        }),
      )
      .subscribe({
        next: (content) => {
          this.footer = content;
        },
        error: (error) => {
          console.error("Error in footer subscription:", error);
          this.footer = this.createErrorHtml("Footer loading error");
        },
      });

    this.subscriptions.add(footerSub);
  }
  /**
   * Create error HTML content
   * @param message Error message to display
   */
  private createErrorHtml(message: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(`<p>${message}</p>`);
  }

  /**
   * Handle footer link clicks
   * @param event Mouse click event
   */
  contentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    if (target && target.classList.contains("footer-link")) {
      event.preventDefault();
      const pageId = target.getAttribute("data-page");
      if (pageId) {
        this.router.navigate(["/pages", pageId]);
      }
    }
  }
}
