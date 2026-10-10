import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();

    const correlationId = (req.headers['x-correlation-id'] as string) || uuidv4();
    req.correlationId = correlationId;
    res.setHeader('x-correlation-id', correlationId);

    const { method, url } = req;
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - now;
        this.logger.log(
          `[${correlationId}] ${method} ${url} ${res.statusCode} +${duration}ms`,
        );
      }),
    );
  }
}
