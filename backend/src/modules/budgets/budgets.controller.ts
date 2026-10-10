import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto, UpdateBudgetDto } from './dto/create-budget.dto';
import { PublicDemoGuard } from '../../common/guards/public-demo.guard';

@ApiTags('budgets')
@Controller('budgets')
@UseGuards(PublicDemoGuard)
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Get()
  @ApiOperation({ summary: 'List budget policies for tenant' })
  async listBudgets(@Query('tenantId') tenantId?: string) {
    const list = await this.budgetsService.listBudgets(tenantId);
    return {
      success: true,
      data: list,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new budget policy' })
  async createBudget(@Body() dto: CreateBudgetDto) {
    const budget = await this.budgetsService.createBudget(dto);
    return {
      success: true,
      data: budget,
    };
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get budget threshold crossed alert history' })
  async listAlerts(@Query('tenantId') tenantId?: string) {
    const alerts = await this.budgetsService.listAlerts(tenantId);
    return {
      success: true,
      data: alerts,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get budget details by ID' })
  async getBudget(@Param('id') id: string) {
    const budget = await this.budgetsService.getBudgetById(id);
    return {
      success: true,
      data: budget,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update budget thresholds or limits' })
  async updateBudget(
    @Param('id') id: string,
    @Body() dto: UpdateBudgetDto,
  ) {
    const updated = await this.budgetsService.updateBudget(id, dto);
    return {
      success: true,
      data: updated,
    };
  }
}
