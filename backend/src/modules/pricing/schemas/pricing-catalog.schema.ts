import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PricingCatalogDocument = PricingCatalog & Document;

export interface ModelPricingEntry {
  modelId: string;
  provider: 'openai' | 'anthropic' | 'google' | 'mistral' | 'groq' | 'meta';
  displayName: string;
  promptCostPer1k: number;
  completionCostPer1k: number;
  inputCostPer1M: number;
  outputCostPer1M: number;
  contextWindow: number;
  maxOutputTokens: number;
  medianLatencyMs: number;
  baselineQualityScore: number; // 0.00 to 1.00
  qualityTier: 'PREMIUM' | 'BALANCED' | 'ECONOMY';
  capabilities: {
    streaming: boolean;
    jsonMode: boolean;
    toolCalling: boolean;
    vision: boolean;
  };
  description: string;
}

@Schema({ timestamps: true, collection: 'pricing_catalogs' })
export class PricingCatalog {
  @Prop({ required: true, unique: true, index: true })
  catalogVersion: string;

  @Prop({ required: true })
  effectiveFrom: Date;

  @Prop({ default: null })
  effectiveTo: Date;

  @Prop({ default: 'USD' })
  currency: string;

  @Prop({ default: false, index: true })
  isCurrent: boolean;

  @Prop({ type: Array, required: true })
  models: ModelPricingEntry[];

  @Prop({ default: 'System Default Catalog' })
  notes: string;
}

export const PricingCatalogSchema = SchemaFactory.createForClass(PricingCatalog);
PricingCatalogSchema.index({ effectiveFrom: 1, effectiveTo: 1 });
