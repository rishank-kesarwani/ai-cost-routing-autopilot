import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { BudgetPeriod } from '../schemas/budget-policy.schema';

export class CreateBudgetDto {
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

  @IsEnum(['DAILY', 'MONTHLY', 'FEATURE'])
  period: BudgetPeriod;

  @IsNumber()
  @Min(1)
  limitUsd: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  warnThresholdPercent?: number = 80;

  @IsOptional()
  @IsBoolean()
  hardBlockEnabled?: boolean = false;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateBudgetDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limitUsd?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  warnThresholdPercent?: number;

  @IsOptional()
  @IsBoolean()
  hardBlockEnabled?: boolean;

  @IsOptional()
  @IsEnum(['ACTIVE', 'DISABLED'])
  status?: 'ACTIVE' | 'DISABLED';

  @IsOptional()
  @IsString()
  description?: string;
}
