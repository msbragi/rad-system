import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import {
  I18nLang,
  IAppConfig,
  IMenuItem,
  SiteModeType,
} from "../../Models/config.model";
import { FileUploadConfig } from "../../Models/upload.model";
import { CookieConsentStatus } from "./cookie.service";

/**
 * The app configuration is loaded when angular starts in main.ts
 * This service provides access to the configuration
 * and manages application state in localStorage/sessionStorage
 */
@Injectable({
  providedIn: "root",
})
export abstract class StoreService {
  private static PREFIX: string = "RAD.";
  private static CONFIG = {} as IAppConfig;

  // Token change observable
  private static tokenSubject = new BehaviorSubject<string>("");
  public static tokenChange$ = StoreService.tokenSubject.asObservable();

  constructor() {}

  static set(key: string, value: any, persistent: boolean = false) {
    key = this.PREFIX + key;
    if (persistent) localStorage.setItem(key, value);
    else sessionStorage.setItem(key, value);
  }

  static get(key: string): any {
    key = this.PREFIX + key;
    return localStorage.getItem(key)
      ? localStorage.getItem(key)
      : sessionStorage.getItem(key);
  }

  static remove(key: string) {
    key = this.PREFIX + key;
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }
  static clear() {
    localStorage.clear();
    sessionStorage.clear();
  }

  static getAll() {
    const allItems = { ...localStorage, ...sessionStorage };
    const filteredItems: { [key: string]: string } = {};
    for (const key in allItems) {
      if (key.startsWith(this.PREFIX)) {
        filteredItems[key.replace(this.PREFIX, "")] = allItems[key];
      }
    }
    return filteredItems;
  }

  // TOKENS SECTION
  static setJwtToken(token: string) {
    if (!token) {
      this.remove("auth_token");
      this.tokenSubject.next(""); // Emit empty token (logout)
      return;
    }
    this.set("auth_token", token);
    this.tokenSubject.next(token); // Emit new token (login/refresh)
  }

  static getJwtToken(): string {
    return this.get("auth_token") || "";
  }
  static setRefreshToken(token: string | null) {
    this.set("refresh_token", token);
  }

  static getRefreshToken(): string | null {
    return this.get("refresh_token") || null;
  }

  static setServerTimeOffset(time: number) {
    this.set("server_time_offset", time, true);
  }

  static getServerTimeOffset(): number {
    if (!this.get("server_time_offset")) {
      return 0;
    }
    return Number(this.get("server_time_offset"));
  }

  // Cookie preferences
  static removeCookiePreference() {
    this.remove("cookie_preference");
  }

  static getCookiePreference(): CookieConsentStatus | null {
    const stored = this.get("cookie_preference");
    return stored ? JSON.parse(stored) : null;
  }

  static setCookiePreference(value: CookieConsentStatus) {
    this.set("cookie_preference", JSON.stringify(value), true); // persistent = true
  }

  // CONFIG SECTION
  static setConfig(config: IAppConfig) {
    this.CONFIG = config;
  }

  private static getConfig(): IAppConfig {
    return this.CONFIG;
  }

  static getApiUrl(): string {
    return this.getConfig().apiUrl;
  }

  static getSiteMode(): SiteModeType {
    return this.getConfig().siteMode as SiteModeType;
  }

  static getAppName() {
    return this.getConfig().appName;
  }

  static getAppVersion(): string {
    return this.getConfig().version;
  }

  static getAvailableLangs(): I18nLang[] {
    return this.getConfig().langs;
  }

  static getModelTagRegex(): string {
    return this.getConfig().modelTagRegex;
  }

  static getMenuType(menuType: "user" | "guest" | "admin"): IMenuItem[] | [] {
    return this.getConfig().menus[menuType] || [];
  }

  // Google Section
  static getGoogleClientId(): string {
    return this.getConfig().google.clientId;
  }

  static getGoogleAnalyticsId(): string {
    return this.getConfig().google.analyticsId || "";
  }

  static getGoogleButtonStyle(): any {
    return this.getConfig().google.button;
  }

  static getGoogleRedirectUri(): string {
    return this.getConfig().google.redirectUri;
  }

  static getLogMode(): string {
    return this.getConfig().logMode;
  }

  static getUploadConfig(): FileUploadConfig {
    return this.getConfig().uploadConfig;
  }
}
