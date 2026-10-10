import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  RoutingPolicy,
  RoutingPolicySchema,
} from './schemas/routing-policy.schema';
import {
  DecisionAudit,
  DecisionAuditSchema,
} from './schemas/decision-audit.schema';
import { RoutingService } from './routing.service';
import { RoutingController } from './routing.controller';
import { PricingModule } from '../pricing/pricing.module';
import { QualityGatesModule } from '../quality-gates/quality-gates.module';
import { UsageModule } from '../usage/usage.module';
import { BudgetsModule } from '../budgets/budgets.module';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RoutingPolicy.name, schema: RoutingPolicySchema },
      { name: DecisionAudit.name, schema: DecisionAuditSchema },
    ]),
    PricingModule,
    QualityGatesModule,
    UsageModule,
    BudgetsModule,
    IntegrationsModule,
  ],
  controllers: [RoutingController],
  providers: [RoutingService],
  exports: [RoutingService],
})
export class RoutingModule {}
