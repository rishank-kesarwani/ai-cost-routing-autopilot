import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PublicDemoGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const publicEnabled = this.configService.get<boolean>(
      'publicAccessEnabled',
      true,
    );

    // If method is GET or route is a dry-run simulation, allow public access when enabled
    if (publicEnabled) {
      if (
        request.method === 'GET' ||
        request.url.includes('/simulation') ||
        request.url.includes('/seed') ||
        request.url.includes('/health')
      ) {
        return true;
      }
    }

    // Otherwise, check authorization header or api key
    const authHeader = request.headers['authorization'];
    const apiKeyHeader = request.headers['x-api-key'];
    const masterApiKey = this.configService.get<string>('aiPlatform.apiKey');

    if (apiKeyHeader && apiKeyHeader === masterApiKey) {
      return true;
    }

    if (authHeader && authHeader.startsWith('Bearer ')) {
      // In demo mode or with valid token
      return true;
    }

    throw new UnauthorizedException(
      'Authentication required to modify policies, budgets or execute live routing',
    );
  }
}
