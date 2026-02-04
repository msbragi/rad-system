import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, of, catchError, switchMap } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class ImageUtils {
  private cache = new Map<string, string>();
  private failedUrls = new Set<string>();

  constructor(private http: HttpClient) {}

  /**
   * Universal image loader that works with ANY image service
   * Falls back gracefully through multiple strategies
   */
  loadImage(imageUrl: string, fallbackUrl?: string): Observable<string> {
    // Return cached result
    if (this.cache.has(imageUrl)) {
      return of(this.cache.get(imageUrl)!);
    }

    // Skip known failed URLs
    if (this.failedUrls.has(imageUrl)) {
      return of(fallbackUrl || this.getDefaultImage());
    }

    // Strategy 1: Try direct URL first (works for most services)
    return this.tryDirectUrl(imageUrl).pipe(
      catchError(() =>
        // Strategy 2: Try converting to blob/base64 (bypasses some CORS)
        this.tryBlobConversion(imageUrl).pipe(
          catchError(() =>
            // Strategy 3: Try canvas conversion (last resort)
            this.tryCanvasConversion(imageUrl).pipe(
              catchError(() => {
                // All strategies failed - use fallback
                this.failedUrls.add(imageUrl);
                const fallback = fallbackUrl || this.getDefaultImage();
                this.cache.set(imageUrl, fallback);
                return of(fallback);
              }),
            ),
          ),
        ),
      ),
    );
  }

  private tryDirectUrl(url: string): Observable<string> {
    return new Observable<string>((observer) => {
      const img = new Image();

      img.onload = () => {
        this.cache.set(url, url);
        observer.next(url);
        observer.complete();
      };

      img.onerror = () => {
        observer.error(new Error("Direct URL failed"));
      };

      // Try without CORS first
      img.src = url;

      // Timeout after 5 seconds
      setTimeout(() => {
        observer.error(new Error("Direct URL timeout"));
      }, 5000);
    });
  }

  private tryBlobConversion(url: string): Observable<string> {
    return this.http.get(url, { responseType: "blob" }).pipe(
      switchMap((blob) => {
        return new Observable<string>((observer) => {
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result as string;
            this.cache.set(url, dataUrl);
            observer.next(dataUrl);
            observer.complete();
          };
          reader.onerror = (error) => {
            observer.error(error);
          };
          reader.readAsDataURL(blob);
        });
      }),
    );
  }

  private tryCanvasConversion(url: string): Observable<string> {
    return new Observable<string>((observer) => {
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;

          ctx?.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.8);

          this.cache.set(url, dataUrl);
          observer.next(dataUrl);
          observer.complete();
        } catch (error) {
          observer.error(error);
        }
      };

      img.onerror = () => {
        observer.error(new Error("Canvas conversion failed"));
      };

      img.src = url;
    });
  }

  private getDefaultImage(): string {
    return "assets/img/avatars/default-avatar.png";
  }

  /**
   * Clear cache for specific URL or all cache
   */
  clearCache(url?: string): void {
    if (url) {
      this.cache.delete(url);
      this.failedUrls.delete(url);
    } else {
      this.cache.clear();
      this.failedUrls.clear();
    }
  }
}
