import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RoutingService } from './routing.service';
import { SimulateRouteDto, ExecuteRouteDto } from './dto/simulate-route.dto';
import { CreateRoutingPolicyDto } from './dto/create-routing-policy.dto';
import { PublicDemoGuard } from '../../common/guards/public-demo.guard';

@ApiTags('routing')
@Controller('routing')
@UseGuards(PublicDemoGuard)
export class RoutingController {
  constructor(private readonly routingService: RoutingService) {}

  @Get('policies')
  @ApiOperation({ summary: 'List all routing policies for tenant' })
  async listPolicies(@Query('tenantId') tenantId?: string) {
    const list = await this.routingService.listPolicies(tenantId);
    return {
      success: true,
      data: list,
    };
  }

  @Post('policies')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new routing policy' })
  async createPolicy(@Body() dto: CreateRoutingPolicyDto) {
    const policy = await this.routingService.createPolicy(dto);
    return {
      success: true,
      data: policy,
    };
  }

  @Get('policies/:id')
  @ApiOperation({ summary: 'Get routing policy by ID' })
  async getPolicyById(@Param('id') id: string) {
    const policy = await this.routingService.getPolicyById(id);
    return {
      success: true,
      data: policy,
    };
  }

  @Post('simulation')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Dry-run simulate route selection across models and explain decisions',
  })
  async simulateRoute(@Body() dto: SimulateRouteDto) {
    const result = await this.routingService.simulateRoute(dto);
    return {
      success: true,
      data: result,
    };
  }

  @Post('execute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Execute prompt through selected route with safe fallback to backup provider',
  })
  async executeRoute(@Body() dto: ExecuteRouteDto) {
    const result = await this.routingService.executeRouteWithFallback(dto);
    return {
      success: true,
      data: result,
    };
  }

  @Get('audits')
  @ApiOperation({ summary: 'List routing decision audit and trace logs' })
  async listAudits(@Query('tenantId') tenantId?: string) {
    const list = await this.routingService.listAudits(tenantId);
    return {
      success: true,
      data: list,
    };
  }
}
