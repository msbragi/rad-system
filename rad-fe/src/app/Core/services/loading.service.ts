import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private requestCount = 0;

  get loading$(): Observable<boolean> {
    return this.loadingSubject.asObservable();
  }

  startLoading(): void {
    if (this.requestCount === 0) {
      this.loadingSubject.next(true);
    }
    this.requestCount++;
  }

  stopLoading(): void {
    this.requestCount--;
    if (this.requestCount <= 0) {
      this.requestCount = 0; // Safety check to avoid negative counts
      this.loadingSubject.next(false);
    }
  }

  // Force stop loading regardless of counter (for error cases)
  resetLoading(): void {
    this.requestCount = 0;
    this.loadingSubject.next(false);
  }

  // Get current loading state
  isLoading(): boolean {
    return this.loadingSubject.value;
  }
}
