import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RoutingPolicyDocument = RoutingPolicy & Document;

export interface FallbackRule {
  triggerOn: 'TIMEOUT' | 'RATE_LIMIT' | 'PROVIDER_OUTAGE' | 'QUALITY_REGRESSION';
  fallbackModel: string;
  fallbackProvider: string;
  maxAttempts: number;
  backoffMs: number;
}

@Schema({ timestamps: true, collection: 'routing_policies' })
export class RoutingPolicy {
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

  @Prop({ required: true, default: 800 })
  latencyTargetMs: number; // e.g. 800ms SLA

  @Prop({ required: true, default: 0.01 })
  maxCostPer1kTokensUsd: number; // e.g. $0.01 max

  @Prop({ required: true, default: 0.85 })
  qualityThreshold: number; // 0.0 to 1.0 minimum score

  @Prop({ type: [String], default: ['openai', 'anthropic', 'google', 'groq', 'mistral'] })
  providerAllowlist: string[];

  @Prop({ type: [String], required: true })
  modelPriority: string[]; // e.g. ['gpt-4o-mini', 'gemini-1-5-flash', 'claude-3-haiku', 'gpt-4o']

  @Prop({ type: [String], required: true })
  fallbackOrder: string[]; // e.g. ['gpt-4o', 'claude-3-5-sonnet', 'gemini-1-5-pro']

  @Prop({
    required: true,
    enum: ['FAIL_CLOSED', 'MARK_UNVERIFIED', 'ALLOW'],
    default: 'FAIL_CLOSED',
  })
  qualityGateMode: 'FAIL_CLOSED' | 'MARK_UNVERIFIED' | 'ALLOW';

  @Prop({ default: 3 })
  maxRetryAttempts: number;

  @Prop({ default: 5000 })
  deadlineBudgetMs: number;

  @Prop({ default: false })
  isDefault: boolean;

  @Prop({ default: true, index: true })
  active: boolean;

  @Prop({ default: 'Optimized latency & cost autopilot policy' })
  description: string;
}

export const RoutingPolicySchema = SchemaFactory.createForClass(RoutingPolicy);
RoutingPolicySchema.index({ tenantId: 1, applicationId: 1, active: 1 });
