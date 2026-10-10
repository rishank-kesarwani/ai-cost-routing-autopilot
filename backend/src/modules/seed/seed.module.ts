import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  UsageEvent,
  UsageEventSchema,
} from '../usage/schemas/usage-event.schema';
import {
  BudgetPolicy,
  BudgetPolicySchema,
} from '../budgets/schemas/budget-policy.schema';
import {
  BudgetAlert,
  BudgetAlertSchema,
} from '../budgets/schemas/budget-alert.schema';
import {
  RoutingPolicy,
  RoutingPolicySchema,
} from '../routing/schemas/routing-policy.schema';
import {
  DecisionAudit,
  DecisionAuditSchema,
} from '../routing/schemas/decision-audit.schema';
import { SeedService } from './seed.service';
import { SeedController } from './seed.controller';
import { PricingModule } from '../pricing/pricing.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UsageEvent.name, schema: UsageEventSchema },
      { name: BudgetPolicy.name, schema: BudgetPolicySchema },
      { name: BudgetAlert.name, schema: BudgetAlertSchema },
      { name: RoutingPolicy.name, schema: RoutingPolicySchema },
      { name: DecisionAudit.name, schema: DecisionAuditSchema },
    ]),
    PricingModule,
  ],
  controllers: [SeedController],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
