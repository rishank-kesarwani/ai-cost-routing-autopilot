import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UsageEventDocument = UsageEvent & Document;

export type MeasurementSource =
  | 'PLATFORM_GATEWAY'
  | 'CLIENT_SDK'
  | 'BATCH_INGEST'
  | 'SIMULATOR_TRACE';

export type CostSourceType =
  | 'ESTIMATED_CATALOG'
  | 'PROVIDER_REPORTED'
  | 'HYBRID_VERIFIED';

export type RequestStatus =
  | 'SUCCESS'
  | 'ERROR'
  | 'FALLBACK_SUCCESS'
  | 'CIRCUIT_BLOCKED';

@Schema({ timestamps: true, collection: 'usage_events' })
export class UsageEvent {
  @Prop({ required: true, unique: true, index: true })
  eventId: string;

  @Prop({ required: true, index: true })
  correlationId: string;

  @Prop({ required: true, index: true })
  tenantId: string;

  @Prop({ required: true, index: true })
  applicationId: string;

  @Prop({ required: true, index: true })
  featureId: string;

  @Prop({ required: true, index: true })
  model: string;

  @Prop({ required: true, index: true })
  provider: string;

  @Prop({ required: true, index: true })
  requestTimestamp: Date;

  @Prop({ required: true })
  latencyMs: number;

  @Prop({ required: true })
  promptTokens: number;

  @Prop({ required: true })
  completionTokens: number;

  @Prop({ required: true })
  totalTokens: number;

  @Prop({ required: true })
  estimatedCostUsd: number;

  @Prop({ default: null })
  providerReportedCostUsd: number | null;

  @Prop({
    required: true,
    enum: ['ESTIMATED_CATALOG', 'PROVIDER_REPORTED', 'HYBRID_VERIFIED'],
    default: 'ESTIMATED_CATALOG',
  })
  costSource: CostSourceType;

  @Prop({ required: true, index: true })
  pricingCatalogVersion: string;

  @Prop({
    required: true,
    enum: ['SUCCESS', 'ERROR', 'FALLBACK_SUCCESS', 'CIRCUIT_BLOCKED'],
    default: 'SUCCESS',
    index: true,
  })
  status: RequestStatus;

  @Prop({ default: null })
  errorType?: string; // 'TIMEOUT' | 'RATE_LIMIT' | 'AUTH' | 'QUALITY_REGRESSION' | 'INTERNAL'

  @Prop({ default: false })
  fallbackActivated: boolean;

  @Prop({ default: null })
  fallbackFromModel?: string;

  @Prop({ default: 'PLATFORM_GATEWAY' })
  measurementSource: MeasurementSource;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const UsageEventSchema = SchemaFactory.createForClass(UsageEvent);
UsageEventSchema.index({ tenantId: 1, requestTimestamp: -1 });
UsageEventSchema.index({ tenantId: 1, applicationId: 1, featureId: 1 });
UsageEventSchema.index({ tenantId: 1, model: 1, status: 1 });
