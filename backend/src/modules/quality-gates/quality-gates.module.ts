import { Module } from '@nestjs/common';
import { QualityGatesService } from './quality-gates.service';
import { QualityGatesController } from './quality-gates.controller';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({
  imports: [IntegrationsModule],
  controllers: [QualityGatesController],
  providers: [QualityGatesService],
  exports: [QualityGatesService],
})
export class QualityGatesModule {}
