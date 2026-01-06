import { Injectable, OnDestroy } from "@angular/core";
import { BehaviorSubject, Observable, Subscription } from "rxjs";
import { IAppConfig, IMenuItem } from "../../Models/config.model";
import { IUser } from "../../Models/models.interface";
import { AuthService } from "../../Services/api/auth.service";
import { StoreService } from "./store.service";

/**
 * Available menu types in the application
 */
export type MenuType = "guest" | "user" | "admin";

/**
 * Service for managing application configuration
 * Provides API URL and role-based menu configurations
 */
@Injectable({
  providedIn: "root",
})
export class ConfigService implements OnDestroy {
  private currentUser: IUser | null = null;
  private userSubscription: Subscription | null = null;

  private currentMenuSubject = new BehaviorSubject<IMenuItem[]>([]);
  public currentMenu$ = this.currentMenuSubject.asObservable();

  /**
   * Cached configuration observable to prevent multiple HTTP requests
   */
  private cachedConfig$: Observable<IAppConfig> | null = null;

  constructor(private authService: AuthService) {
    // Subscribe to user changes and store the current user
    this.userSubscription = this.authService.currentUser$.subscribe((user) => {
      //console.log('ConfigService: User changed:', user);
      this.currentUser = user;
      this.updateMenuForCurrentUser();
    });
  }

  /**
   * Clean up subscriptions when service is destroyed
   */
  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
      this.userSubscription = null;
    }
  }

  /**
   * Updates the current menu items based on the user's role
   */
  private updateMenuForCurrentUser(): void {
    if (!this.currentUser) {
      this.currentMenuSubject.next(StoreService.getMenuType("guest"));
      return;
    }

    // Always start with the user menu for logged-in users
    const userMenu = StoreService.getMenuType("user");

    // Add additional menu items based on user role
    let combinedMenu = [...userMenu];

    if (
      this.currentUser.role === "admin" ||
      this.currentUser.role === "super_user"
    ) {
      const adminMenu = StoreService.getMenuType("admin");
      combinedMenu = [...userMenu, ...adminMenu];
    }

    // Update the menu items subject
    this.currentMenuSubject.next(combinedMenu);
  }
}
