import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKeyHeader = request.headers['x-api-key'];
    const authHeader = request.headers['authorization'];

    const validKey =
      this.configService.get<string>('aiPlatform.apiKey') ||
      'platform_master_key_dev_12345';

    if (apiKeyHeader && apiKeyHeader === validKey) {
      return true;
    }

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      if (token === validKey) {
        return true;
      }
    }

    throw new UnauthorizedException('Invalid or missing service API key');
  }
}
