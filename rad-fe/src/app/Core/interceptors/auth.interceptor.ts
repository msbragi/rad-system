import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
} from "@angular/common/http";
import { StoreService } from "../services/store.service";

/**
 * Interceptor to add JWT authentication token to outgoing requests
 * Adds the Authorization header with Bearer token for authenticated requests
 */
export const authInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const token = StoreService.getJwtToken();
  // If token exists, clone the request and add the Authorization header
  if (token) {
    const authRequest = request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
    return next(authRequest);
  }

  // No token, proceed with the original request
  return next(request);
};
