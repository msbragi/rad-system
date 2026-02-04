import { FileUploadConfig } from "./upload.model";

/**
 * Interface for internationalization language configuration
 */
export interface I18nLang {
  code: string; // Language code (e.g., 'en', 'it')
  label: string; // Display label for the language (e.g., 'ENG', 'ITA')
  description: string; // Description of the language (e.g., 'English', 'Italiano')
  langEn?: string; // Description Always in english
}

/**
 * Interface for menu item configuration
 */
export interface IMenuItem {
  /** Display name of the menu item */
  label: string;
  /** Icon to display with menu item */
  icon: string;
  /** Routing path */
  route: string;
  /** Optional submenu items */
  children?: IMenuItem[];
}

export type SiteModeType = "production" | "development" | "maintenance";
/**
 * Interface for application configuration
 */
export interface IAppConfig {
  /** API host URL */
  appName: string;
  apiUrl: string;
  /** Logging mode (none, console, file) */
  logMode: string;
  siteMode: SiteModeType;
  version: string;
  modelTagRegex: string;
  langs: I18nLang[];
  /** Google client ID for authentication */
  google: {
    clientId: string;
    redirectUri: string;
    analyticsId?: string;
    button: any;
  };
  uploadConfig: FileUploadConfig;
  menus: {
    /** Menu items for guests (not logged in) */
    guest: IMenuItem[];
    /** Menu items for standard users */
    user: IMenuItem[];
    /** Menu items for admins and super_users */
    admin: IMenuItem[];
  };
}
