import { Injectable, computed, effect, signal } from "@angular/core";

export interface AppTheme {
  name: "light" | "dark" | "system";
  icon: string;
}

export type ThemeType = "light" | "dark" | "system";

@Injectable({
  providedIn: "root",
})
export class ThemeService {
  private themes: AppTheme[] = [
    { name: "light", icon: "light_mode" },
    { name: "dark", icon: "dark_mode" },
    // { name: 'system', icon: 'desktop_windows' },
  ];

  appTheme = signal<ThemeType>("light");

  getThemes() {
    return this.themes;
  }

  setTheme(theme: ThemeType) {
    this.appTheme.set(theme);
  }

  selectedTheme = computed(() => {
    return this.themes.find((t) => t.name === this.appTheme());
  });

  setSystemTheme = effect(() => {
    const appTheme = this.appTheme();
    const colorScheme = appTheme === "system" ? "light dark" : appTheme;
    document.body.style.setProperty("color-scheme", colorScheme);
  });
}
