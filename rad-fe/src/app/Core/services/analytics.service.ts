import { Injectable } from "@angular/core";
import { NavigationEnd, Router } from "@angular/router";
import { filter } from "rxjs";
import { StoreService } from "./store.service";

declare let gtag: Function;

@Injectable({
  providedIn: "root",
})
export class AnalyticsService {
  private isInitialized = false;
  private measurementId: string | null = null;

  constructor(private router: Router) {
    this.measurementId = StoreService.getGoogleAnalyticsId() || "";
  }

  /**
   * Enable Google Analytics and start tracking
   */
  enableAnalytics(): void {
    if (this.isInitialized) return;

    this.loadGoogleAnalytics().then(() => {
      this.isInitialized = true;
      this.setupPageTracking();

      // Track initial page
      this.trackPageView(this.router.url);
      console.log("📊 Google Analytics enabled");
    });
  }

  /**
   * Disable Google Analytics
   */
  disableAnalytics(): void {
    if (!this.isInitialized) return;

    // Rimuovi ENTRAMBI gli script tramite classe CSS
    const gaScripts = document.querySelectorAll(".tc-ga-script");
    gaScripts.forEach((script) => script.remove());

    // Pulisci le variabili globali
    if (typeof window !== "undefined") {
      (window as any).gtag = undefined;
      (window as any).dataLayer = undefined;
    }

    this.isInitialized = false;
  }
  /**
   * Dynamically load Google Analytics script
   */
  private loadGoogleAnalytics(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.querySelector(".tc-ga-script")) {
        resolve();
        return;
      }

      // Create script elements
      const gtagScript = document.createElement("script");
      gtagScript.async = true;
      gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
      gtagScript.className = "tc-ga-script ga-loader"; // ← Classe per identificarlo

      const configScript = document.createElement("script");
      configScript.className = "tc-ga-script ga-config"; // ← Classe per identificarlo
      configScript.innerHTML = `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${this.measurementId}', {
                    page_title: document.title,
                    page_location: window.location.href
                });
            `;

      // Load scripts
      gtagScript.onload = () => {
        document.head.appendChild(configScript);
        setTimeout(resolve, 100); // Small delay to ensure gtag is ready
      };

      gtagScript.onerror = reject;
      document.head.appendChild(gtagScript);
    });
  }

  /**
   * Setup automatic page tracking on route changes
   */
  private setupPageTracking(): void {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.trackPageView(event.urlAfterRedirects);
      });
  }

  /**
   * Track page view
   */
  public trackPageView(url: string): void {
    if (!this.isAnalyticsAllowed()) return;

    if (typeof gtag !== "undefined") {
      // Usa la base dell'host + url Angular per page_location
      const pageLocation = window.location.origin + url;
      // Aggiorna il titolo in base alla rotta
      const lastSegment = url.split("/").filter(Boolean).pop() || null;
      const pageTitle = lastSegment
        ? `Time Caps - ${lastSegment}`
        : document.title;
      gtag("event", "page_view", {
        page_path: url,
        page_title: pageTitle,
        page_location: pageLocation,
      });
    }
  }

  /**
   * Track custom event
   */
  public trackEvent(
    action: string,
    parameters?: {
      event_category?: string;
      event_label?: string;
      value?: number;
      custom_parameters?: { [key: string]: any };
    },
  ): void {
    if (!this.isAnalyticsAllowed()) return;

    if (typeof gtag !== "undefined") {
      const eventData: any = {
        event_category: parameters?.event_category || "engagement",
        event_label: parameters?.event_label,
        value: parameters?.value,
        ...parameters?.custom_parameters,
      };

      gtag("event", action, eventData);
    }
  }

  /**
   * Track user action
   */
  public trackUserAction(
    action: string,
    category: string = "user_interaction",
  ): void {
    this.trackEvent(action, {
      event_category: category,
      event_label: action,
    });
  }

  /**
   * Track form submission
   */
  public trackFormSubmission(formName: string): void {
    this.trackEvent("form_submit", {
      event_category: "form",
      event_label: formName,
    });
  }

  /**
   * Track error
   */
  public trackError(error: string, fatal: boolean = false): void {
    this.trackEvent("exception", {
      event_category: "error",
      event_label: error,
      custom_parameters: {
        fatal: fatal,
      },
    });
  }

  /**
   * Set user ID for tracking (when user logs in)
   */
  public setUserId(userId: string): void {
    if (!this.isAnalyticsAllowed()) return;

    if (typeof gtag !== "undefined") {
      gtag("config", this.measurementId, {
        user_id: userId,
      });
    }
  }

  /**
   * Track ecommerce purchase (for future use)
   */
  public trackPurchase(
    transactionId: string,
    value: number,
    currency: string = "EUR",
  ): void {
    if (!this.isAnalyticsAllowed()) return;

    if (typeof gtag !== "undefined") {
      gtag("event", "purchase", {
        transaction_id: transactionId,
        value: value,
        currency: currency,
      });
    }
  }

  /**
   * Check if analytics is allowed by measurement ID availability
   */
  private isAnalyticsAllowed(): boolean {
    return (
      this.measurementId !== null &&
      this.measurementId.trim() !== "" &&
      this.isInitialized
    );
  }

  /**
   * Get measurement ID for external use
   */
  public getMeasurementId(): string {
    return this.measurementId ? this.measurementId : "";
  }

  /**
   * Check if service is ready to track
   */
  public isReady(): boolean {
    return this.isInitialized && this.measurementId !== "";
  }
}
