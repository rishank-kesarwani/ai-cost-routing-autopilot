import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  IsEnum,
  Min,
} from 'class-validator';

export class SimulateRouteDto {
  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @IsString()
  @IsNotEmpty()
  applicationId: string;

  @IsString()
  @IsNotEmpty()
  featureId: string;

  @IsNumber()
  @Min(0)
  promptTokens: number;

  @IsNumber()
  @Min(0)
  expectedCompletionTokens: number;

  @IsOptional()
  @IsNumber()
  latencyTargetMs?: number;

  @IsOptional()
  @IsNumber()
  maxCostPer1kTokensUsd?: number;

  @IsOptional()
  @IsNumber()
  qualityThreshold?: number;

  @IsOptional()
  @IsArray()
  providerAllowlist?: string[];

  @IsOptional()
  @IsString()
  policyId?: string;

  @IsOptional()
  @IsEnum(['FAIL_CLOSED', 'MARK_UNVERIFIED', 'ALLOW'])
  qualityGateMode?: 'FAIL_CLOSED' | 'MARK_UNVERIFIED' | 'ALLOW';

  @IsOptional()
  @IsString()
  correlationId?: string;
}

export class ExecuteRouteDto {
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
  prompt: string;

  @IsOptional()
  @IsNumber()
  maxTokens?: number;

  @IsOptional()
  @IsString()
  policyId?: string;

  @IsOptional()
  @IsString()
  correlationId?: string;
}
