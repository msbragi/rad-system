import { Component, OnInit, OnDestroy, ChangeDetectorRef } from "@angular/core";
import { Subscription } from "rxjs";

import { LoadingService } from "../../Core/services/loading.service";

@Component({
  selector: "tc-loading",
  standalone: true,
  imports: [],
  template: `
    @if (isLoading) {
      <div class="loading-overlay">
        <div class="spinner-container">
          <div class="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    }
  `,
  styles: [
    `
      /* Default dark mode styles */
      .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        backdrop-filter: blur(3px);
        background-color: rgba(0, 0, 0, 0.5);
      }

      .spinner-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        border-radius: 16px;
        padding: 40px;
        background-color: transparent; /* Removed background */
      }

      .spinner {
        width: 80px; /* Increased size */
        height: 80px; /* Increased size */
        border: 6px solid rgba(255, 255, 255, 0.2); /* Thicker border */
        border-radius: 50%;
        border-top-color: #9c27b0; /* Brighter purple for visibility */
        border-left-color: #9c27b0;
        box-shadow: 0 0 15px rgba(156, 39, 176, 0.6); /* Added glow effect */
        animation: spin 1s cubic-bezier(0.42, 0.61, 0.58, 0.41) infinite;
      }

      p {
        color: white;
        margin-top: 20px;
        font-size: 20px; /* Larger text */
        font-weight: 500; /* Bolder text */
        letter-spacing: 0.5px;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5); /* Text shadow for better readability */
      }

      /* Light mode overrides */
      :host-context(body.light) .loading-overlay {
        background-color: rgba(255, 255, 255, 0.5);
      }

      :host-context(body.light) .spinner {
        border: 6px solid rgba(0, 0, 0, 0.1);
        border-top-color: #7b1fa2;
        border-left-color: #7b1fa2;
        box-shadow: 0 0 15px rgba(123, 31, 162, 0.4);
      }

      :host-context(body.light) p {
        color: rgba(0, 0, 0, 0.87);
        text-shadow: 0 2px 4px rgba(255, 255, 255, 0.5);
      }

      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class LoadingComponent implements OnInit, OnDestroy {
  isLoading = false;
  private subscription: Subscription = new Subscription();

  constructor(
    private loadingService: LoadingService,
    private cdRef: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.subscription = this.loadingService.loading$.subscribe(
      (loading: boolean) => {
        this.isLoading = loading;
        this.cdRef.detectChanges();
      },
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
