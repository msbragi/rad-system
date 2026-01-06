import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
  HttpContextToken,
} from "@angular/common/http";
import { inject } from "@angular/core";
import { catchError, finalize, throwError } from "rxjs";
import { LoadingService } from "../../Core/services/loading.service";

// Definiamo un token per il contesto HTTP
export const SKIP_LOADING = new HttpContextToken<boolean>(() => false);

export const loadingInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const loadingService = inject(LoadingService);

  // Se il contesto contiene il token SKIP_LOADING a true, passa oltre senza attivare lo spinner
  if (req.context.get(SKIP_LOADING)) {
    return next(req);
  }

  loadingService.startLoading();

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      loadingService.resetLoading();
      return throwError(() => error);
    }),
    finalize(() => {
      loadingService.stopLoading();
    }),
  );
};
