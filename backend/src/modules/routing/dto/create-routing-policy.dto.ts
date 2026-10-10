import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  IsBoolean,
  IsEnum,
  Min,
  Max,
} from 'class-validator';

export class CreateRoutingPolicyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @IsString()
  @IsNotEmpty()
  applicationId: string;

  @IsOptional()
  @IsString()
  featureId?: string;

  @IsNumber()
  @Min(50)
  latencyTargetMs: number;

  @IsNumber()
  @Min(0.00001)
  maxCostPer1kTokensUsd: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  qualityThreshold: number;

  @IsArray()
  providerAllowlist: string[];

  @IsArray()
  modelPriority: string[];

  @IsArray()
  fallbackOrder: string[];

  @IsOptional()
  @IsEnum(['FAIL_CLOSED', 'MARK_UNVERIFIED', 'ALLOW'])
  qualityGateMode?: 'FAIL_CLOSED' | 'MARK_UNVERIFIED' | 'ALLOW' = 'FAIL_CLOSED';

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean = false;

  @IsOptional()
  @IsString()
  description?: string;
}
