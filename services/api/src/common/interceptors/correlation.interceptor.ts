import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Observable } from 'rxjs';

@Injectable()
export class CorrelationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<{
      correlationId?: string;
      headers: Record<string, string | string[] | undefined>;
    }>();
    const response = http.getResponse<{
      setHeader: (name: string, value: string) => void;
    }>();

    const header = request.headers['x-correlation-id'];
    const correlationId =
      (Array.isArray(header) ? header[0] : header) ?? randomUUID();

    request.correlationId = correlationId;
    response.setHeader('x-correlation-id', correlationId);

    return next.handle();
  }
}
