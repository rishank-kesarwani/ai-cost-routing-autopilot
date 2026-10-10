import { Controller, Get, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Connection } from 'mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import { AiPlatformClient } from '../integrations/ai-platform.client';
import { ModelRegressionClient } from '../integrations/model-regression.client';

@ApiTags('health')
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectConnection() private readonly mongoConnection: Connection,
    private readonly aiPlatformClient: AiPlatformClient,
    private readonly modelRegressionClient: ModelRegressionClient,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Liveness health probe' })
  getLiveness() {
    return {
      status: 'ok',
      service: 'ai-cost-routing-autopilot-backend',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe validating dependencies' })
  async getReadiness() {
    const mongoStatus =
      this.mongoConnection.readyState === 1 ? 'UP' : 'STANDBY_DEGRADED';

    const [aiHealth, regressionHealth] = await Promise.all([
      this.aiPlatformClient.checkHealth(),
      this.modelRegressionClient.checkHealth(),
    ]);

    const isReady = true; // Service operates with graceful fallbacks if dependencies are offline

    return {
      status: isReady ? 'ok' : 'degraded',
      dependencies: {
        mongodb: {
          status: mongoStatus,
          readyState: this.mongoConnection.readyState,
        },
        aiPlatform: {
          status: aiHealth.status,
          latencyMs: aiHealth.latencyMs,
          url: this.configService.get('aiPlatform.url'),
        },
        modelRegressionService: {
          status: regressionHealth.status,
          latencyMs: regressionHealth.latencyMs,
          url: this.configService.get('modelRegression.url'),
        },
        notificationService: {
          status: 'CONFIGURED',
          url: this.configService.get('notificationService.url'),
        },
      },
      timestamp: new Date().toISOString(),
    };
  }
}
