import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
    private cache: Map<string, any> = new Map();

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const key = request.url;
        
        if (request.method !== 'GET') {
            return next.handle();
        }

        if (this.cache.has(key)) {
            return of(this.cache.get(key));
        }

        return next.handle().pipe(
            tap(response => this.cache.set(key, response)),
        );
    }
}
