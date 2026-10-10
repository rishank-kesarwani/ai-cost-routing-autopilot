import { Module } from '@nestjs/common';
import { NotificationClient } from './notification.client';
import { AiPlatformClient } from './ai-platform.client';
import { ModelRegressionClient } from './model-regression.client';

@Module({
  providers: [NotificationClient, AiPlatformClient, ModelRegressionClient],
  exports: [NotificationClient, AiPlatformClient, ModelRegressionClient],
})
export class IntegrationsModule {}
