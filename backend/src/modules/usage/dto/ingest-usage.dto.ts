import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
  Min,
} from 'class-validator';
import {
  MeasurementSource,
  CostSourceType,
  RequestStatus,
} from '../schemas/usage-event.schema';

export class IngestUsageDto {
  @IsOptional()
  @IsString()
  eventId?: string;

  @IsOptional()
  @IsString()
  correlationId?: string;

  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @IsString()
  @IsNotEmpty()
  applicationId: string;

  @IsString()
  @IsNotEmpty()
  featureId: string;

  @IsString()
  @IsNotEmpty()
  model: string;

  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  requestTimestamp?: Date | string;

  @IsNumber()
  @Min(0)
  latencyMs: number;

  @IsNumber()
  @Min(0)
  promptTokens: number;

  @IsNumber()
  @Min(0)
  completionTokens: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  providerReportedCostUsd?: number;

  @IsOptional()
  @IsEnum(['ESTIMATED_CATALOG', 'PROVIDER_REPORTED', 'HYBRID_VERIFIED'])
  costSource?: CostSourceType;

  @IsOptional()
  @IsString()
  pricingCatalogVersion?: string;

  @IsOptional()
  @IsEnum(['SUCCESS', 'ERROR', 'FALLBACK_SUCCESS', 'CIRCUIT_BLOCKED'])
  status?: RequestStatus;

  @IsOptional()
  @IsString()
  errorType?: string;

  @IsOptional()
  fallbackActivated?: boolean;

  @IsOptional()
  @IsString()
  fallbackFromModel?: string;

  @IsOptional()
  @IsEnum(['PLATFORM_GATEWAY', 'CLIENT_SDK', 'BATCH_INGEST', 'SIMULATOR_TRACE'])
  measurementSource?: MeasurementSource;

  @IsOptional()
  metadata?: Record<string, any>;
}
