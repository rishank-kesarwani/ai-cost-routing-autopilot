import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  PricingCatalog,
  PricingCatalogSchema,
} from './schemas/pricing-catalog.schema';
import { PricingService } from './pricing.service';
import { PricingController } from './pricing.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PricingCatalog.name, schema: PricingCatalogSchema },
    ]),
  ],
  controllers: [PricingController],
  providers: [PricingService],
  exports: [PricingService],
})
export class PricingModule {}
