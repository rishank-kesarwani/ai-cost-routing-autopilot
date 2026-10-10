import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BudgetAlertDocument = BudgetAlert & Document;

@Schema({ timestamps: true, collection: 'budget_alerts' })
export class BudgetAlert {
  @Prop({ required: true, unique: true, index: true })
  alertId: string;

  @Prop({ required: true, index: true })
  policyId: string;

  @Prop({ required: true, index: true })
  tenantId: string;

  @Prop({ required: true })
  policyName: string;

  @Prop({
    required: true,
    enum: ['WARNING', 'HARD_BLOCK'],
  })
  alertType: 'WARNING' | 'HARD_BLOCK';

  @Prop({ required: true })
  thresholdCrossedPercent: number;

  @Prop({ required: true })
  spendAtAlertUsd: number;

  @Prop({ required: true })
  limitUsd: number;

  @Prop({ required: true, unique: true, index: true })
  idempotencyKey: string;

  @Prop({
    required: true,
    enum: ['DELIVERED', 'SKIPPED_IDEMPOTENT', 'QUEUED', 'FAILED'],
    default: 'DELIVERED',
  })
  notificationStatus: string;

  @Prop({ default: 'Budget threshold breached.' })
  message: string;
}

export const BudgetAlertSchema = SchemaFactory.createForClass(BudgetAlert);
BudgetAlertSchema.index({ tenantId: 1, createdAt: -1 });
BudgetAlertSchema.index({ policyId: 1, createdAt: -1 });
