import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PricingService } from './pricing.service';
import { PublicDemoGuard } from '../../common/guards/public-demo.guard';

export class CalculateCostDto {
  modelId: string;
  promptTokens: number;
  completionTokens: number;
  catalogVersion?: string;
}

@ApiTags('pricing')
@Controller('pricing')
@UseGuards(PublicDemoGuard)
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Get('current')
  @ApiOperation({ summary: 'Get currently active pricing catalog' })
  async getActiveCatalog() {
    const catalog = await this.pricingService.getActiveCatalog();
    return {
      success: true,
      data: catalog,
    };
  }

  @Get('versions')
  @ApiOperation({ summary: 'List all effective-dated pricing catalog versions' })
  async listVersions() {
    const versions = await this.pricingService.listCatalogVersions();
    return {
      success: true,
      data: versions,
    };
  }

  @Get('versions/:version')
  @ApiOperation({ summary: 'Get specific pricing catalog version' })
  async getCatalogByVersion(@Param('version') version: string) {
    const catalog = await this.pricingService.getCatalogByVersion(version);
    return {
      success: true,
      data: catalog,
    };
  }

  @Post('calculate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calculate estimated cost for token volume' })
  async calculateCost(@Body() dto: CalculateCostDto) {
    const result = await this.pricingService.computeCost(
      dto.modelId,
      dto.promptTokens || 0,
      dto.completionTokens || 0,
      dto.catalogVersion,
    );
    return {
      success: true,
      data: result,
    };
  }
}
