import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatIconModule } from "@angular/material/icon";
import { MatListModule } from "@angular/material/list";
import { RouterModule } from "@angular/router";
import { Subscription } from "rxjs";
import { IMenuItem } from "../../Models/config.model";
import { ConfigService } from "../../Core/services/config.service";

/**
 * Component for displaying navigation menu based on user role
 */
@Component({
  selector: "tc-menu",
  standalone: true,
  imports: [MatListModule, MatIconModule, MatExpansionModule, RouterModule],
  templateUrl: "./menu.component.html",
  styleUrls: ["./menu.component.scss"],
})
export class MenuComponent implements OnInit, OnDestroy {
  /** Menu items to be displayed */
  menuItems: IMenuItem[] = [];

  /** Flag to collapse/expand all menu items */
  @Input() collapsed = false;

  /** Subscription to menu changes */
  private menuSubscription: Subscription | null = null;

  /**
   * Creates an instance of MenuComponent
   * @param configService - Service for loading menu configuration
   */
  constructor(private configService: ConfigService) {}

  /**
   * Initializes the component and subscribes to menu changes
   */
  ngOnInit(): void {
    console.log("MenuComponent: Initializing");

    // Subscribe to menu changes from the config service
    this.menuSubscription = this.configService.currentMenu$.subscribe({
      next: (menuItems) => {
        console.log("MenuComponent: Received menu items:", menuItems);
        this.menuItems = menuItems;
      },
      error: (err) => {
        console.error("MenuComponent: Error receiving menu items:", err);
      },
    });
  }

  /**
   * Clean up subscriptions when component is destroyed
   */
  ngOnDestroy(): void {
    // Unsubscribe to prevent memory leaks
    if (this.menuSubscription) {
      this.menuSubscription.unsubscribe();
      this.menuSubscription = null;
    }
  }
}
