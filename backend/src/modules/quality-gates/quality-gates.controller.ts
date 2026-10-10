import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  QualityGatesService,
  EvaluateQualityGateDto,
} from './quality-gates.service';
import { PublicDemoGuard } from '../../common/guards/public-demo.guard';

@ApiTags('quality-gates')
@Controller('quality-gates')
@UseGuards(PublicDemoGuard)
export class QualityGatesController {
  constructor(private readonly qualityGatesService: QualityGatesService) {}

  @Post('evaluate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Evaluate model quality against Model Regression Detection service',
  })
  async evaluateGate(@Body() dto: EvaluateQualityGateDto) {
    const result = await this.qualityGatesService.evaluateGate(dto);
    return {
      success: true,
      data: result,
    };
  }
}
