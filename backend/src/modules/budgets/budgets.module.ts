import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  BudgetPolicy,
  BudgetPolicySchema,
} from './schemas/budget-policy.schema';
import {
  BudgetAlert,
  BudgetAlertSchema,
} from './schemas/budget-alert.schema';
import { BudgetsService } from './budgets.service';
import { BudgetsController } from './budgets.controller';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BudgetPolicy.name, schema: BudgetPolicySchema },
      { name: BudgetAlert.name, schema: BudgetAlertSchema },
    ]),
    IntegrationsModule,
  ],
  controllers: [BudgetsController],
  providers: [BudgetsService],
  exports: [BudgetsService],
})
export class BudgetsModule {}
