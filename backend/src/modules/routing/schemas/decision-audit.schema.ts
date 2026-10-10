import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DecisionAuditDocument = DecisionAudit & Document;

export interface CandidateEvaluationTrace {
  modelId: string;
  provider: string;
  status: 'SELECTED' | 'REJECTED' | 'STANDBY_FALLBACK';
  estimatedCostUsd: number;
  medianLatencyMs: number;
  qualityScore: number;
  rejectionReason?:
    | 'EXCEEDS_LATENCY_TARGET'
    | 'EXCEEDS_COST_LIMIT'
    | 'PROVIDER_NOT_ALLOWED'
    | 'QUALITY_GATE_FAILED'
    | 'HARD_BUDGET_EXCEEDED'
    | 'MODEL_DEPRECATED';
  explanation: string;
}

@Schema({ timestamps: true, collection: 'decision_audits' })
export class DecisionAudit {
  @Prop({ required: true, unique: true, index: true })
  auditId: string;

  @Prop({ required: true, index: true })
  correlationId: string;

  @Prop({ required: true, index: true })
  tenantId: string;

  @Prop({ required: true, index: true })
  applicationId: string;

  @Prop({ required: true, index: true })
  featureId: string;

  @Prop({ required: true, default: false })
  dryRun: boolean;

  @Prop({ type: Object, required: true })
  policyApplied: {
    policyId: string;
    policyName: string;
    latencyTargetMs: number;
    maxCostPer1kTokensUsd: number;
    qualityThreshold: number;
  };

  @Prop({ type: Object, required: true })
  inputs: {
    promptTokens: number;
    expectedCompletionTokens: number;
    requiredCapabilities?: string[];
  };

  @Prop({ type: Array, required: true })
  candidateEvaluations: CandidateEvaluationTrace[];

  @Prop({ type: Object, required: true })
  selectedRoute: {
    modelId: string;
    provider: string;
    estimatedCostUsd: number;
    estimatedLatencyMs: number;
    qualityScore: number;
    catalogVersion: string;
  };

  @Prop({ type: [String], default: [] })
  fallbackChain: string[];

  @Prop({ default: true })
  redacted: boolean;

  @Prop({ type: Object, default: {} })
  executionOutcome?: {
    attemptCount: number;
    actualLatencyMs: number;
    fallbackUsed: boolean;
    finalStatus: 'SUCCESS' | 'ERROR' | 'FALLBACK_SUCCESS';
    errorDiagnostic?: string;
  };
}

export const DecisionAuditSchema = SchemaFactory.createForClass(DecisionAudit);
DecisionAuditSchema.index({ tenantId: 1, createdAt: -1 });
DecisionAuditSchema.index({ applicationId: 1, featureId: 1 });
