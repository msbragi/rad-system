import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import {
  BehaviorSubject,
  catchError,
  finalize,
  map,
  Observable,
  tap,
  throwError,
} from "rxjs";
import {
  IAuthResponse,
  IRefreshTokenResponse,
  IResponse,
} from "../../Models/auth.interface";
import { IAuth, IUser } from "../../Models/models.interface";
import { ApiService } from "../api/api.service";
import { StoreService } from "../../Core/services/store.service";

export interface ISsoPasswordLinks {
  provider: string;
  url: string;
}

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<IUser | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private refreshingToken = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);
  private serverTimeOffset: number = 0;

  constructor(
    private apiService: ApiService,
    private router: Router,
  ) {
    this.checkAuthStatus();
  }

  /**
   * Get all sso links
   */
  getSsoPasswordLinks(): Observable<ISsoPasswordLinks[]> {
    return this.apiService.get<IResponse>("auth/sso-password-links").pipe(
      map((response: IResponse) => {
        return response.data as ISsoPasswordLinks[];
      }),
    );
  }

  /**
   * Updates the server-client time offset based on server timestamp
   * @param serverTimestamp Server timestamp from response
   */
  private updateServerTimeOffset(serverTimestamp: string): void {
    try {
      // Convert server timestamp (ISO string format) to seconds
      const serverTime = Math.floor(new Date(serverTimestamp).getTime() / 1000);
      const clientTime = Math.floor(Date.now() / 1000);
      this.serverTimeOffset = serverTime - clientTime;
      StoreService.setServerTimeOffset(this.serverTimeOffset);
    } catch (error) {
      console.warn("Error calculating server time offset:", error);
    }
  }

  /**
   * Check if the user is already authenticated
   */
  private checkAuthStatus(): void {
    const token = StoreService.getJwtToken();
    console.log("AuthService: checkAuthStatus - token exists:", !!token);

    if (token) {
      console.log("AuthService: Fetching current user data...");
      // Fetch current user data directly and update the BehaviorSubject
      this.apiService
        .get<IResponse>("users/me")
        .pipe(map((response: IResponse) => response.data as IUser))
        .subscribe({
          next: (user) => {
            console.log("AuthService: User data loaded successfully:", user);
            this.currentUserSubject.next(user);
          },
          error: (error) => {
            console.error("AuthService: Failed to load user data:", error);
            this.logout();
          },
        });
    }
  }

  private storeTokens(response: IAuthResponse): void {
    StoreService.setJwtToken(response.data.access_token);
    if (response.data.refresh_token) {
      StoreService.setRefreshToken(response.data.refresh_token);
    }
    // Update server time offset using the timestamp in the response
    if (response.timestamp) {
      this.updateServerTimeOffset(response.timestamp);
    }
  }

  /**
   * Logout the current user
   */
  logout(): void {
    StoreService.setJwtToken("");
    StoreService.setRefreshToken(null);
    this.currentUserSubject.next(null);
    this.router.navigate(["/login"]);
  }

  /**
   * Login with email and password
   */
  login(credentials: IAuth): Observable<IAuthResponse> {
    return this.apiService
      .post<IAuthResponse>("auth/login", credentials, "Login successful")
      .pipe(
        tap((response: IAuthResponse) => {
          console.log("AuthService: Login successful, storing tokens");
          this.storeTokens(response);
          // Fetch complete user data from /users/me after login
          this.fetchCurrentUserData();
        }),
      );
  }

  /**
   * Login with Google
   */
  googleLogin(token: string): Observable<IAuthResponse> {
    const request = { idToken: token };
    return this.apiService
      .post<IAuthResponse>("auth/google", request, "Google login successful")
      .pipe(
        tap((response: IAuthResponse) => {
          console.log("AuthService: Google login successful, storing tokens");
          this.storeTokens(response);
          // Fetch complete user data from /users/me after login
          this.fetchCurrentUserData();
        }),
      );
  }

  /**
   * Refresh the access token using a refresh token
   * @returns Observable with the new access token response or error
   */
  refreshToken(): Observable<any> {
    // Don't attempt to refresh if already refreshing
    if (this.refreshingToken) {
      return this.refreshTokenSubject.asObservable().pipe(
        map((token) => {
          if (token) return { success: true };
          throw new Error("Refresh token process failed"); // Use throw inside map, not throwError
        }),
      );
    }

    const refreshToken = StoreService.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error("No refresh token available"));
    }

    this.refreshingToken = true;
    this.refreshTokenSubject.next(null);

    return this.apiService
      .post<IRefreshTokenResponse>("auth/refresh-token", {
        refresh_token: refreshToken,
      })
      .pipe(
        tap((response) => {
          // Store the new access token
          if (response.data.access_token) {
            StoreService.setJwtToken(response.data.access_token);
            this.refreshTokenSubject.next(response.data.access_token);
          }
        }),
        catchError((error) => {
          // If refresh fails, clear tokens and redirect to login
          this.logout();
          return throwError(() => new Error("Failed to refresh token"));
        }),
        finalize(() => {
          this.refreshingToken = false;
        }),
      );
  }

  /**
   * Register a new user
   * @param userData - User registration data
   */
  register(userData: {
    email: string;
    password: string;
  }): Observable<IResponse> {
    const normalizedLang = (StoreService.get("lang") || "en").toLowerCase();
    return this.apiService.post<IResponse>(
      `auth/register/${normalizedLang}`,
      userData,
      "Registration successful",
    );
  }

  /**
   * Verify email with token
   * @param token - Email verification token
   */
  verifyEmail(token: string): Observable<IResponse> {
    // Create DTO matching backend expectations
    const payload = {
      token: token.trim(), // Clean any whitespace
    };

    return this.apiService.post<IResponse>(
      "auth/verify-email",
      payload,
      "Email verified successfully",
    );
  }

  /**
   * Resend verification email
   * @param email - User email address
   */
  resendVerificationEmail(email: string): Observable<IResponse> {
    return this.apiService.post<IResponse>(
      "auth/resend-verification",
      { email },
      "Verification email sent",
    );
  }

  /**
   * Request password reset
   * @param email - User email address
   */
  requestPasswordReset(email: string): Observable<IResponse> {
    const normalizedLang = (StoreService.get("lang") || "en").toLowerCase();
    return this.apiService.post<IResponse>(
      `auth/forgot-password/${normalizedLang}`,
      { email: email },
      "Password reset email sent",
    );
  }

  /**
   * Reset password with token
   * @param token - Password reset token
   * @param password - New password
   */
  resetPassword(token: string, password: string): Observable<IResponse> {
    const payload = {
      token: token.trim(),
      password,
    };

    return this.apiService.post<IResponse>(
      "auth/reset-password",
      payload,
      "Password reset successful",
    );
  }

  /**
   * Check if the user is authenticated
   */
  isAuthenticated(): boolean {
    return !!StoreService.getJwtToken();
  }

  unpackToken(token: string): any {
    const payload = token.split(".")[1];
    const decodedPayload = atob(payload);
    return JSON.parse(decodedPayload);
  }

  /**
   * Gets the current time adjusted for server time offset
   * @returns Current time (in seconds) adjusted for server/client differences
   */
  getServerAdjustedTime(): number {
    // Retrieve the offset from storage (in case the app was reloaded)
    const storedOffset = StoreService.getServerTimeOffset();
    return Math.floor(Date.now() / 1000) + storedOffset;
  }

  /**
   * Check if the JWT token has expired, using server-adjusted time
   * @returns True if token is expired or invalid, false otherwise
   */
  isTokenExpired(): boolean {
    const token = StoreService.getJwtToken();
    if (!token) return true;

    try {
      const decoded = this.unpackToken(token);
      const adjustedTime = this.getServerAdjustedTime();

      // Return true if token is expired
      return decoded.exp < adjustedTime;
    } catch (e) {
      return true;
    }
  }
  /**
   * Check if token is expiring soon within the specified minutes
   * @param minutesThreshold Minutes before expiration to consider token as expiring soon
   * @returns True if token expires within the threshold, false otherwise
   */
  isTokenExpiringSoon(minutesThreshold: number = 5): boolean {
    const token = StoreService.getJwtToken();
    if (!token) return false;

    try {
      const decoded = this.unpackToken(token);
      const currentTime = this.getServerAdjustedTime();
      const expirationTime = decoded.exp;
      const thresholdInSeconds = minutesThreshold * 60;

      //console.log('Exp, Iat:', decoded.exp, decoded.iat);
      //console.log('ThresholInSeconds:', thresholdInSeconds);
      //console.log('Expiration, Current:', expirationTime, currentTime);
      //console.log('Remaining Time:', expirationTime - currentTime);
      //console.log('Count:', (expirationTime - currentTime) - thresholdInSeconds);
      // Return true if token expires within the threshold
      return expirationTime - currentTime < thresholdInSeconds;
    } catch (e) {
      return false;
    }
  }

  /**
   * Fetch current user data from /users/me endpoint and update the observable
   */
  private fetchCurrentUserData(): void {
    console.log("AuthService: Fetching current user data from /users/me...");
    this.apiService
      .get<IResponse>("users/me")
      .pipe(map((response: IResponse) => response.data as IUser))
      .subscribe({
        next: (user) => {
          console.log("AuthService: Complete user data loaded:", user);
          this.currentUserSubject.next(user);
        },
        error: (error) => {
          console.error(
            "AuthService: Failed to load complete user data:",
            error,
          );
          this.logout();
        },
      });
  }

  /**
   * Get the current user value synchronously (snapshot)
   * @returns Current user or null if not authenticated
   */
  getCurrentUserValue(): IUser | null {
    return this.currentUserSubject.value;
  }

  get currentUser(): IUser | null {
    return this.getCurrentUserValue();
  }
}
