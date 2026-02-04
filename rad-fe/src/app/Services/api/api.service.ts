import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, throwError } from "rxjs";
import { catchError, tap } from "rxjs/operators";
import { SnackbarService } from "../../Core/services/snackbar.service";
import { StoreService } from "../../Core/services/store.service";

@Injectable({
  providedIn: "root",
})
export class ApiService {
  private apiUrl = StoreService.getApiUrl() || "http://localhost:3000/api/v1";

  /**
   * get Helper for baseUrl;
   */
  get baseApiUrl(): string {
    return this.apiUrl;
  }

  /**
   * get Helper for http service;
   */
  get stdHeaders() {
    return this.getHeaders();
  }

  /**
   * get Helper for http service;
   */
  get httpService() {
    return this.http;
  }

  constructor(
    private http: HttpClient,
    private snackbarService: SnackbarService,
  ) {}

  /**
   * Get HTTP headers with authentication token
   */
  private getHeaders(): HttpHeaders {
    //const token = StoreService.get('auth_token');
    return new HttpHeaders({
      "Content-Type": "application/json",
      //'Authorization': `Bearer ${token}` // This is managed by the http interceptor
    });
  }

  /**
   * Handle HTTP errors
   */
  public handleError(error: HttpErrorResponse) {
    let errorMessage = "An unknown error occurred!";
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      if (error.status === 401) {
        errorMessage = "Authentication required. Please log in again.";
      } else if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else {
        errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      }
    }
    this.snackbarService.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Generic GET request
   */
  get<T>(endpoint: string, successMessage?: string): Observable<T> {
    return this.http
      .get<T>(`${this.apiUrl}/${endpoint}`, { headers: this.getHeaders() })
      .pipe(
        tap(() => {
          if (successMessage) {
            this.snackbarService.success(successMessage);
          }
        }),
        catchError((error) => this.handleError(error)),
      );
  }

  /**
   * Generic POST request
   * @param endpoint API endpoint
   * @param data Request payload
   * @param successMessage Optional success message to display
   * @param isFormData Whether the payload is FormData (for file uploads)
   */
  post<T>(
    endpoint: string,
    data: any,
    successMessage?: string,
    isFormData: boolean = false,
  ): Observable<T> {
    const headers = isFormData
      ? new HttpHeaders() // For FormData, let the browser set the content type
      : this.getHeaders();

    //const headers = isFormData ?
    //  new HttpHeaders({ 'Authorization': `Bearer ${StoreService.get('auth_token')}` }) :
    //  this.getHeaders();

    return this.http
      .post<T>(`${this.apiUrl}/${endpoint}`, data, { headers })
      .pipe(
        tap(() => {
          if (successMessage) {
            this.snackbarService.success(successMessage);
          }
        }),
        catchError((error) => this.handleError(error)),
      );
  }

  /**
   * Generic PUT request
   */
  put<T>(endpoint: string, data: any, successMessage?: string): Observable<T> {
    return this.http
      .put<T>(`${this.apiUrl}/${endpoint}`, data, {
        headers: this.getHeaders(),
      })
      .pipe(
        tap(() => {
          if (successMessage) {
            this.snackbarService.success(successMessage);
          }
        }),
        catchError((error) => this.handleError(error)),
      );
  }

  /**
   * Generic PATCH request
   */
  patch<T>(
    endpoint: string,
    data: any,
    successMessage?: string,
  ): Observable<T> {
    return this.http
      .patch<T>(`${this.apiUrl}/${endpoint}`, data, {
        headers: this.getHeaders(),
      })
      .pipe(
        tap(() => {
          if (successMessage) {
            this.snackbarService.success(successMessage);
          }
        }),
        catchError((error) => this.handleError(error)),
      );
  }

  /**
   * Generic DELETE request
   */
  delete<T>(endpoint: string, successMessage?: string): Observable<T> {
    return this.http
      .delete<T>(`${this.apiUrl}/${endpoint}`, { headers: this.getHeaders() })
      .pipe(
        tap(() => {
          if (successMessage) {
            this.snackbarService.success(successMessage);
          }
        }),
        catchError((error) => this.handleError(error)),
      );
  }

  /**
   * GET request specifically for binary data
   * @param endpoint API endpoint
   * @returns Observable of Blob data
   */
  getBinary(endpoint: string): Observable<Blob> {
    return this.http
      .get(`${this.apiUrl}/${endpoint}`, {
        headers: this.getHeaders(),
        responseType: "blob",
      })
      .pipe(catchError((error) => this.handleError(error)));
  }
}
