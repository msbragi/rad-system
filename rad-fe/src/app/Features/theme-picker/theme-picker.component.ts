import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { MatMenuModule } from "@angular/material/menu";
import { ThemeService, ThemeType } from "../../Core/services/theme.service";
import { StoreService } from "../../Core/services/store.service";

@Component({
  selector: "tc-theme-picker",
  standalone: true,
  imports: [CommonModule, MatIconModule, MatMenuModule],
  templateUrl: "./theme-picker.component.html",
  styleUrl: "./theme-picker.component.scss",
})
export class ThemePickerComponent {
  protected themeService = inject(ThemeService);

  constructor() {
    const theme = StoreService.get("theme");
    this.themeService.setTheme(theme || "light");
  }

  setTheme(theme: ThemeType) {
    StoreService.set("theme", theme, true);
    this.themeService.setTheme(theme);
  }

  themes() {
    return this.themeService.getThemes();
  }
}
