import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  UsageEvent,
  UsageEventSchema,
} from './schemas/usage-event.schema';
import { UsageService } from './usage.service';
import { UsageController } from './usage.controller';
import { PricingModule } from '../pricing/pricing.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UsageEvent.name, schema: UsageEventSchema },
    ]),
    PricingModule,
  ],
  controllers: [UsageController],
  providers: [UsageService],
  exports: [UsageService],
})
export class UsageModule {}
