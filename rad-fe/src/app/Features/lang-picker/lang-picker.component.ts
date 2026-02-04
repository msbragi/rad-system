import { Component } from "@angular/core";
import { MatMenuModule } from "@angular/material/menu";
import { TranslocoService } from "@jsverse/transloco";
import { StoreService } from "../../Core/services/store.service";
import { I18nLang } from "../../Models/config.model";

@Component({
  selector: "tc-lang-picker",
  standalone: true,
  imports: [MatMenuModule],
  templateUrl: "./lang-picker.component.html",
  styleUrls: ["./lang-picker.component.scss"],
})
export class LangPickerComponent {
  languages: I18nLang[] = StoreService.getAvailableLangs();

  constructor(public _t: TranslocoService) {
    this._t.setActiveLang(StoreService.get("lang") || "en");
  }

  changeLang(lang: string) {
    this._t.setActiveLang(lang);
    StoreService.set("lang", lang, true);
  }

  getCurrentLang() {
    return this.languages.find((lang) => lang.code == this._t.getActiveLang());
  }
}
