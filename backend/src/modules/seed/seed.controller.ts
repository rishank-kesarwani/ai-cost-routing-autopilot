import { Controller, Post, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SeedService } from './seed.service';
import { PublicDemoGuard } from '../../common/guards/public-demo.guard';

@ApiTags('seed')
@Controller('seed')
@UseGuards(PublicDemoGuard)
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Seed or refresh realistic demo data' })
  async seedDemoData() {
    const result = await this.seedService.seedInitialDataIfEmpty(true);
    return {
      success: true,
      data: result,
    };
  }
}
