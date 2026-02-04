import { Injectable } from "@angular/core";
import { NavigationEnd, Router } from "@angular/router";
import { BehaviorSubject, filter } from "rxjs";
import { AnalyticsService } from "./analytics.service";
import { StoreService } from "./store.service";

export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

export interface CookieConsentStatus {
  hasConsent: boolean;
  consentDate: Date | null;
  preferences: CookiePreferences;
  bannerDismissed: boolean;
  version: string; // Versioning for future changes
}

export type CookieDisplayMode = "banner" | "icon" | null;

@Injectable({
  providedIn: "root",
})
export class CookieService {
  private currentRoute = "";
  private readonly CURRENT_VERSION = "1.0";
  private readonly DEFAULT_PREFERENCES: CookiePreferences = {
    necessary: true, // Always true - required for app functionality
    analytics: false,
    marketing: false,
    functional: false,
  };

  // Observable for components to react to consent changes
  private consentStatus$ = new BehaviorSubject<CookieConsentStatus>(
    this.getConsentStatus(),
  );
  public readonly consentStatus = this.consentStatus$.asObservable();

  constructor(
    private router: Router,
    private analyticsService: AnalyticsService, // ← Add this
  ) {
    // Track route changes for banner / icon / nothin
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentRoute = event.url;
        this.consentStatus$.next(this.getConsentStatus());
      });
    this.loadStoredPreferences();
  }

  /**
   * Return what to show banner / Icon or nothing
   */
  show(): CookieDisplayMode {
    const stored = this.getStoredState();
    if (!stored) return "banner"; // First visit
    if (this.currentRoute.includes("/home") || this.currentRoute === "") {
      return "icon";
    }
    return null;
  }

  /**
   * Get current consent status
   */
  getConsentStatus(): CookieConsentStatus {
    const stored = this.getStoredState();
    return {
      hasConsent: stored?.hasConsent || false,
      consentDate: stored?.consentDate || null,
      preferences: stored?.preferences || this.DEFAULT_PREFERENCES,
      bannerDismissed: stored?.bannerDismissed || false,
      version: stored?.version || this.CURRENT_VERSION,
    };
  }

  /**
   * Dismiss banner without giving consent
   */
  dismissBanner(): void {
    const currentState = this.getStoredState() || this.createDefaultState();
    const newState = {
      ...currentState,
      bannerDismissed: true,
      version: this.CURRENT_VERSION,
    };

    this.saveState(newState);
    this.consentStatus$.next(this.getConsentStatus());
  }

  /**
   * Check if user has given consent
   */
  hasUserConsent(): boolean {
    return this.getConsentStatus().hasConsent;
  }

  /**
   * Set cookie preferences and mark as consented
   */
  setConsentPreferences(preferences: Partial<CookiePreferences>): void {
    const finalPreferences: CookiePreferences = {
      necessary: true, // Always required
      analytics: preferences.analytics ?? false,
      marketing: preferences.marketing ?? false,
      functional: preferences.functional ?? false,
    };

    const newState: CookieConsentStatus = {
      hasConsent: true,
      consentDate: new Date(),
      preferences: finalPreferences,
      bannerDismissed: true, // Banner is dismissed when consent is given
      version: this.CURRENT_VERSION,
    };

    this.saveState(newState);
    this.writeCookies(finalPreferences);
    this.applyAnalyticsSettings(finalPreferences); // ← Add this
    this.consentStatus$.next(this.getConsentStatus());
  }

  /**
   * Accept all cookies
   */
  acceptAll(): void {
    this.setConsentPreferences({
      analytics: true,
      marketing: true,
      functional: true,
    });
  }

  /**
   * Accept only necessary cookies
   */
  acceptNecessaryOnly(): void {
    this.setConsentPreferences({
      analytics: false,
      marketing: false,
      functional: false,
    });
  }

  /**
   * Check if specific cookie type is allowed
   */
  isAllowed(cookieType: keyof CookiePreferences): boolean {
    return this.getConsentStatus().preferences[cookieType];
  }

  /**
   * Reset all cookie preferences (for testing/admin purposes)
   */
  resetConsent(): void {
    StoreService.removeCookiePreference();
    //localStorage.removeItem(this.STORAGE_KEY);
    this.clearAllCookies(); // Cancella anche i cookie dal browser
    this.analyticsService.disableAnalytics(); // ← Add this
    const defaultStatus: CookieConsentStatus = {
      hasConsent: false,
      consentDate: null,
      preferences: this.DEFAULT_PREFERENCES,
      bannerDismissed: false,
      version: this.CURRENT_VERSION,
    };
    this.consentStatus$.next(defaultStatus);
  }

  /**
   * Apply analytics settings based on consent
   */
  private applyAnalyticsSettings(preferences: CookiePreferences): void {
    if (preferences.analytics) {
      this.analyticsService.enableAnalytics();
    } else {
      this.analyticsService.disableAnalytics();
    }
  }

  /**
   * Clear all non-necessary cookies
   */
  private clearAllCookies(): void {
    this.deleteCookie("tc-analytics");
    this.deleteCookie("tc-marketing");
    this.deleteCookie("tc-functional");
    // Note: tc-session rimane perché è necessary
  }

  /**
   * Create default state for new users
   */
  private createDefaultState(): CookieConsentStatus {
    return {
      hasConsent: false,
      consentDate: null,
      preferences: this.DEFAULT_PREFERENCES,
      bannerDismissed: false,
      version: this.CURRENT_VERSION,
    };
  }

  /**
   * Get stored state from localStorage
   */
  private getStoredState(): CookieConsentStatus | null {
    const parsed = StoreService.getCookiePreference();
    if (parsed) {
      // Validate structure and version
      if (parsed.version === this.CURRENT_VERSION && parsed.preferences) {
        return {
          ...parsed,
          consentDate: parsed.consentDate ? new Date(parsed.consentDate) : null,
        };
      }
    }
    return null;
  }

  /**
   * Save state to localStorage
   */
  private saveState(state: CookieConsentStatus): void {
    try {
      StoreService.setCookiePreference(state);
    } catch (error) {
      console.error("Failed to save cookie consent:", error);
    }
  }

  /**
   * Load stored preferences on service initialization
   */
  private loadStoredPreferences(): void {
    const status = this.getConsentStatus();

    // Apply stored preferences immediately if consent was given
    if (status.hasConsent) {
      this.writeCookies(status.preferences);
      this.applyAnalyticsSettings(status.preferences); // ← Add this
    }

    this.consentStatus$.next(status);
  }

  /**
   * Write actual cookies based on preferences
   */
  private writeCookies(preferences: CookiePreferences): void {
    // Necessary cookies (sempre scritti)
    this.setCookie("tc-session", "active", 365);

    // Analytics cookies
    if (preferences.analytics) {
      this.setCookie("tc-analytics", "enabled", 365);
    } else {
      this.deleteCookie("tc-analytics");
    }

    // Marketing cookies
    if (preferences.marketing) {
      this.setCookie("tc-marketing", "enabled", 365);
    } else {
      this.deleteCookie("tc-marketing");
    }

    // Functional cookies
    if (preferences.functional) {
      this.setCookie("tc-functional", "enabled", 365);
    } else {
      this.deleteCookie("tc-functional");
    }
  }

  private setCookie(name: string, value: string, days: number): void {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
  }

  private deleteCookie(name: string): void {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
  }
}
