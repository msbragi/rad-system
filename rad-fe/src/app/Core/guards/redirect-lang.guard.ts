import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { StoreService } from "../services/store.service";

export const redirectLangGuard: CanActivateFn = (route, state) => {
  const pageId = route.params["pageId"];
  // Use StoreService to get current language, fallback to 'en'
  const lang = StoreService.get("lang") || "en";
  return inject(Router).createUrlTree(["/pages", lang, pageId]);
};
