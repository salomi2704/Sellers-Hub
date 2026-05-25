import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import pino from 'pino';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = pino({ level: process.env.LOG_LEVEL ?? 'info' });

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<{
      status: (code: number) => { json: (body: unknown) => void };
    }>();
    const request = ctx.getRequest<{
      url: string;
      method: string;
      correlationId?: string;
    }>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    this.logger.error({
      err: exception,
      path: request.url,
      method: request.method,
      correlationId: request.correlationId,
    });

    response.status(status).json({
      statusCode: status,
      message,
      correlationId: request.correlationId,
      timestamp: new Date().toISOString(),
    });
  }
}
