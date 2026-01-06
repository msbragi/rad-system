import { Component } from "@angular/core";
import { Router, RouterModule, RouterOutlet } from "@angular/router";
//import { TranslocoDirective } from '@jsverse/transloco';

import { MatListModule } from "@angular/material/list";
import { MatSidenavModule } from "@angular/material/sidenav";
import { TranslocoService } from "@jsverse/transloco";
import { StoreService } from "./Core/services/store.service";
import { LoadingComponent } from "./Features/loading/loading.component";
import { MenuComponent } from "./Features/menu/menu.component";
import { ToolbarComponent } from "./Features/toolbar/toolbar.component";
import { I18nLang } from "./Models/config.model";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [
    RouterOutlet,
    RouterModule,
    MatSidenavModule,
    MatListModule,
    ToolbarComponent,
    MenuComponent,
    LoadingComponent,
  ],
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent {
  sidenavOpen: boolean = false;
  siteMode = StoreService.getSiteMode();

  constructor(
    private translocoService: TranslocoService,
    private router: Router,
  ) {
    // Set available languages from config
    const langs: string[] = StoreService.getAvailableLangs().map(
      (lang: I18nLang) => {
        return lang.code;
      },
    );
    translocoService.setAvailableLangs(langs || ["it"]);
  }

  routeChanged(event: any) {
    this.sidenavOpen = false; // Close the sidenav when the route changes
  }

  isHomePage(): boolean {
    // Example: matches /pages/en/home, /pages/it/home, etc.
    const homeRegex = /^\/pages\/[a-z]{2}\/home$/;
    return homeRegex.test(this.router.url);
  }

  get showToolbar(): boolean {
    const noToolbar = "|/view-pdf|Add-other-route-here";
    return !this.router.url.startsWith("/view-pdf");
  }
}
