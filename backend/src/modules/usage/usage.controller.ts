import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { UsageService } from './usage.service';
import { IngestUsageDto } from './dto/ingest-usage.dto';
import { QueryUsageLedgerDto, QueryAnalyticsDto } from './dto/query-usage.dto';
import { PublicDemoGuard } from '../../common/guards/public-demo.guard';

@ApiTags('usage')
@Controller('usage')
@UseGuards(PublicDemoGuard)
export class UsageController {
  constructor(private readonly usageService: UsageService) {}

  @Post('ingest')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Ingest and record a raw LLM usage measurement' })
  async ingestEvent(@Body() dto: IngestUsageDto) {
    const event = await this.usageService.recordEvent(dto);
    return {
      success: true,
      data: event,
    };
  }

  @Get('ledger')
  @ApiOperation({ summary: 'Query filterable ledger events' })
  async getLedger(@Query() query: QueryUsageLedgerDto) {
    const result = await this.usageService.queryLedger(query);
    return {
      success: true,
      ...result,
    };
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get aggregated time-series and dimension analytics' })
  async getAnalytics(@Query() query: QueryAnalyticsDto) {
    const data = await this.usageService.getAnalytics(query);
    return {
      success: true,
      data,
    };
  }

  @Get('anomalies')
  @ApiOperation({ summary: 'Detect spend anomalies and statistical outliers' })
  async getAnomalies(@Query('tenantId') tenantId?: string) {
    const anomalies = await this.usageService.detectSpendAnomalies(tenantId);
    return {
      success: true,
      data: anomalies,
    };
  }
}
