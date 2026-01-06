import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { StoreService } from "./store.service";

@Injectable({
  providedIn: "root",
})
export class TokenService {
  private baseUrl = StoreService.getApiUrl() || "http://localhost:3000/api/v1";

  constructor(private http: HttpClient) {}

  /**
   * Refresh access token using refresh token
   */
  refreshToken(): Observable<{ access_token: string }> {
    const refreshToken = StoreService.getRefreshToken();

    return this.http
      .post<{
        access_token: string;
      }>(`${this.baseUrl}/auth/refresh-token`, { refresh_token: refreshToken })
      .pipe(
        tap((response) => {
          if (response.access_token) {
            StoreService.setJwtToken(response.access_token);
          }
        }),
      );
  }
}
