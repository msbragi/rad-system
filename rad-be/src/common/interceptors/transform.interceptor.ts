import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { instanceToPlain } from 'class-transformer';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
    data: T;
    timestamp: string;
    path: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<unknown>> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<Response<unknown>> {
        const request = context.switchToHttp().getRequest();
        return next.handle().pipe(
            map(data => ({
                data: instanceToPlain(data), // <-- serialize entities, include virtual getters
                timestamp: new Date().toISOString(),
                path: request.url,
            })),
        );
    }
}
