import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BudgetPolicyDocument = BudgetPolicy & Document;

export type BudgetPeriod = 'DAILY' | 'MONTHLY' | 'FEATURE';
export type BudgetStatus = 'ACTIVE' | 'WARNING' | 'EXCEEDED' | 'DISABLED';

@Schema({ timestamps: true, collection: 'budget_policies' })
export class BudgetPolicy {
  @Prop({ required: true, unique: true, index: true })
  policyId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, index: true })
  tenantId: string;

  @Prop({ required: true, index: true })
  applicationId: string;

  @Prop({ default: null, index: true })
  featureId?: string;

  @Prop({
    required: true,
    enum: ['DAILY', 'MONTHLY', 'FEATURE'],
    default: 'MONTHLY',
  })
  period: BudgetPeriod;

  @Prop({ required: true })
  limitUsd: number;

  @Prop({ required: true, default: 80 })
  warnThresholdPercent: number; // e.g. 80%

  @Prop({ required: true, default: false })
  hardBlockEnabled: boolean; // true = hard blocks LLM requests, false = soft limit / alert only

  @Prop({ default: 0 })
  currentSpendUsd: number;

  @Prop({ required: true })
  currentPeriodStart: Date;

  @Prop({ required: true })
  currentPeriodEnd: Date;

  @Prop({ default: null })
  lastAlertSentAt?: Date;

  @Prop({
    default: 'NONE',
    enum: ['NONE', 'WARNING', 'HARD_BLOCK'],
  })
  lastAlertTier: 'NONE' | 'WARNING' | 'HARD_BLOCK';

  @Prop({
    required: true,
    enum: ['ACTIVE', 'WARNING', 'EXCEEDED', 'DISABLED'],
    default: 'ACTIVE',
    index: true,
  })
  status: BudgetStatus;

  @Prop({ default: 'Standard team operational budget' })
  description: string;
}

export const BudgetPolicySchema = SchemaFactory.createForClass(BudgetPolicy);
BudgetPolicySchema.index({ tenantId: 1, applicationId: 1 });
BudgetPolicySchema.index({ tenantId: 1, status: 1 });
