import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import {
  BudgetPolicy,
  BudgetPolicyDocument,
} from './schemas/budget-policy.schema';
import {
  BudgetAlert,
  BudgetAlertDocument,
} from './schemas/budget-alert.schema';
import { CreateBudgetDto, UpdateBudgetDto } from './dto/create-budget.dto';
import { NotificationClient } from '../integrations/notification.client';

export interface BudgetEvaluationResult {
  blocked: boolean;
  reason?: string;
  matchedPolicies: Array<{
    policyId: string;
    name: string;
    limitUsd: number;
    currentSpendUsd: number;
    percentUsed: number;
    hardBlock: boolean;
    tierCrossed: 'NONE' | 'WARNING' | 'HARD_BLOCK';
  }>;
}

@Injectable()
export class BudgetsService {
  private readonly logger = new Logger(BudgetsService.name);
  private inMemoryBudgets: BudgetPolicy[] = [];
  private inMemoryAlerts: BudgetAlert[] = [];

  constructor(
    @InjectModel(BudgetPolicy.name)
    private readonly budgetModel: Model<BudgetPolicyDocument>,
    @InjectModel(BudgetAlert.name)
    private readonly alertModel: Model<BudgetAlertDocument>,
    private readonly notificationClient: NotificationClient,
  ) {}

  async createBudget(dto: CreateBudgetDto): Promise<BudgetPolicy> {
    const policyId = `bdg_${uuidv4().substring(0, 8)}`;
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const record: BudgetPolicy = {
      policyId,
      name: dto.name,
      tenantId: dto.tenantId,
      applicationId: dto.applicationId,
      featureId: dto.featureId || null,
      period: dto.period,
      limitUsd: dto.limitUsd,
      warnThresholdPercent: dto.warnThresholdPercent || 80,
      hardBlockEnabled: dto.hardBlockEnabled || false,
      currentSpendUsd: 0,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      lastAlertSentAt: null,
      lastAlertTier: 'NONE',
      status: 'ACTIVE',
      description: dto.description || 'Standard team budget policy',
    };

    try {
      const created = await this.budgetModel.create(record);
      return created.toObject() as BudgetPolicy;
    } catch (err: any) {
      this.logger.warn(`Failed to save budget in Mongo (${err.message}), using in-memory store`);
      this.inMemoryBudgets.push(record);
      return record;
    }
  }

  async listBudgets(tenantId?: string): Promise<BudgetPolicy[]> {
    const filter = tenantId ? { tenantId } : {};
    try {
      const list = await this.budgetModel.find(filter).sort({ createdAt: -1 }).lean();
      if (list && list.length > 0) return list as unknown as BudgetPolicy[];
    } catch (err: any) {
      this.logger.debug(`Error listing budgets from Mongo: ${err.message}`);
    }

    if (tenantId) {
      return this.inMemoryBudgets.filter((b) => b.tenantId === tenantId);
    }
    return this.inMemoryBudgets;
  }

  async getBudgetById(policyId: string): Promise<BudgetPolicy | null> {
    try {
      const found = await this.budgetModel.findOne({ policyId }).lean();
      if (found) return found as unknown as BudgetPolicy;
    } catch (err: any) {
      this.logger.debug(`Error getting budget: ${err.message}`);
    }

    return this.inMemoryBudgets.find((b) => b.policyId === policyId) || null;
  }

  async updateBudget(policyId: string, dto: UpdateBudgetDto): Promise<BudgetPolicy | null> {
    try {
      const updated = await this.budgetModel
        .findOneAndUpdate({ policyId }, { $set: dto }, { new: true })
        .lean();
      if (updated) return updated as unknown as BudgetPolicy;
    } catch (err: any) {
      this.logger.debug(`Error updating budget in Mongo: ${err.message}`);
    }

    const idx = this.inMemoryBudgets.findIndex((b) => b.policyId === policyId);
    if (idx !== -1) {
      this.inMemoryBudgets[idx] = { ...this.inMemoryBudgets[idx], ...dto };
      return this.inMemoryBudgets[idx];
    }
    return null;
  }

  /**
   * Evaluates consumption against active policies for a given tenant, application and optional feature.
   * If a hard-limit threshold is crossed, returns { blocked: true } and triggers idempotent alerts.
   */
  async evaluateAndRecordSpend(
    tenantId: string,
    applicationId: string,
    featureId: string,
    estimatedCostUsd: number,
  ): Promise<BudgetEvaluationResult> {
    const budgets = await this.listBudgets(tenantId);
    const applicable = budgets.filter((b) => {
      if (b.status === 'DISABLED') return false;
      if (b.applicationId !== applicationId && b.applicationId !== '*') return false;
      if (b.featureId && b.featureId !== featureId && b.featureId !== '*') return false;
      return true;
    });

    let blocked = false;
    let blockReason: string | undefined;
    const matchedPolicies = [];

    for (const budget of applicable) {
      const projectedSpend = budget.currentSpendUsd + estimatedCostUsd;
      const percentUsed = Number(((projectedSpend / budget.limitUsd) * 100).toFixed(1));

      let tierCrossed: 'NONE' | 'WARNING' | 'HARD_BLOCK' = 'NONE';
      if (percentUsed >= 100) {
        tierCrossed = 'HARD_BLOCK';
      } else if (percentUsed >= budget.warnThresholdPercent) {
        tierCrossed = 'WARNING';
      }

      if (tierCrossed === 'HARD_BLOCK' && budget.hardBlockEnabled) {
        blocked = true;
        blockReason = `Hard budget limit exceeded for policy '${budget.name}' ($${projectedSpend.toFixed(2)} / $${budget.limitUsd.toFixed(2)}, ${percentUsed}% used).`;
      }

      // Check if alert needs to be sent (idempotent notification)
      if (tierCrossed !== 'NONE' && budget.lastAlertTier !== tierCrossed) {
        await this.triggerBudgetAlert(budget, projectedSpend, percentUsed, tierCrossed);
      }

      // Increment spend on policy
      await this.incrementSpend(budget.policyId, estimatedCostUsd, tierCrossed);

      matchedPolicies.push({
        policyId: budget.policyId,
        name: budget.name,
        limitUsd: budget.limitUsd,
        currentSpendUsd: Number(projectedSpend.toFixed(4)),
        percentUsed,
        hardBlock: budget.hardBlockEnabled,
        tierCrossed,
      });
    }

    return {
      blocked,
      reason: blockReason,
      matchedPolicies,
    };
  }

  private async triggerBudgetAlert(
    budget: BudgetPolicy,
    projectedSpend: number,
    percentUsed: number,
    tier: 'WARNING' | 'HARD_BLOCK',
  ): Promise<void> {
    const periodMonth = new Date(budget.currentPeriodStart).toISOString().slice(0, 7);
    const idempotencyKey = `budget-${budget.policyId}-${periodMonth}-${tier}`;

    // Check if alert already exists
    try {
      const existing = await this.alertModel.findOne({ idempotencyKey });
      if (existing) {
        this.logger.debug(`Idempotent budget alert already recorded: ${idempotencyKey}`);
        return;
      }
    } catch {
      if (this.inMemoryAlerts.some((a) => a.idempotencyKey === idempotencyKey)) return;
    }

    const alertRecord: BudgetAlert = {
      alertId: `alt_${uuidv4().substring(0, 8)}`,
      policyId: budget.policyId,
      tenantId: budget.tenantId,
      policyName: budget.name,
      alertType: tier,
      thresholdCrossedPercent: percentUsed,
      spendAtAlertUsd: Number(projectedSpend.toFixed(2)),
      limitUsd: budget.limitUsd,
      idempotencyKey,
      notificationStatus: 'DELIVERED',
      message:
        tier === 'HARD_BLOCK'
          ? `CRITICAL: Budget limit crossed for ${budget.name}. Spend $${projectedSpend.toFixed(2)} exceeded limit $${budget.limitUsd.toFixed(2)} (${percentUsed}%).`
          : `WARNING: Budget threshold reached for ${budget.name}. Spend is now $${projectedSpend.toFixed(2)} (${percentUsed}% of $${budget.limitUsd.toFixed(2)}).`,
    };

    try {
      await this.alertModel.create(alertRecord);
    } catch {
      this.inMemoryAlerts.unshift(alertRecord);
    }

    // Dispatch to Notification Service
    await this.notificationClient.sendNotification({
      channels: ['email', 'in_app', 'slack'],
      recipient: {
        userId: `tenant-admin-${budget.tenantId}`,
        email: `ops+${budget.tenantId}@example.com`,
      },
      template: tier === 'HARD_BLOCK' ? 'BUDGET_HARD_LIMIT_BREACHED' : 'BUDGET_THRESHOLD_WARNING',
      parameters: {
        policyName: budget.name,
        tenantId: budget.tenantId,
        limitUsd: budget.limitUsd,
        spendUsd: projectedSpend,
        percentUsed,
        hardBlocked: budget.hardBlockEnabled,
      },
      idempotencyKey,
    });
  }

  private async incrementSpend(
    policyId: string,
    spendToAdd: number,
    tierCrossed: 'NONE' | 'WARNING' | 'HARD_BLOCK',
  ): Promise<void> {
    const updateObj: Record<string, any> = {
      $inc: { currentSpendUsd: spendToAdd },
    };

    if (tierCrossed !== 'NONE') {
      updateObj.$set = {
        lastAlertTier: tierCrossed,
        lastAlertSentAt: new Date(),
        status: tierCrossed === 'HARD_BLOCK' ? 'EXCEEDED' : 'WARNING',
      };
    }

    try {
      await this.budgetModel.updateOne({ policyId }, updateObj);
    } catch {
      const b = this.inMemoryBudgets.find((p) => p.policyId === policyId);
      if (b) {
        b.currentSpendUsd += spendToAdd;
        if (tierCrossed !== 'NONE') {
          b.lastAlertTier = tierCrossed;
          b.lastAlertSentAt = new Date();
          b.status = tierCrossed === 'HARD_BLOCK' ? 'EXCEEDED' : 'WARNING';
        }
      }
    }
  }

  async listAlerts(tenantId?: string): Promise<BudgetAlert[]> {
    const filter = tenantId ? { tenantId } : {};
    try {
      const alerts = await this.alertModel.find(filter).sort({ createdAt: -1 }).limit(50).lean();
      if (alerts && alerts.length > 0) return alerts as unknown as BudgetAlert[];
    } catch (err: any) {
      this.logger.debug(`Error querying alerts: ${err.message}`);
    }

    if (tenantId) {
      return this.inMemoryAlerts.filter((a) => a.tenantId === tenantId);
    }
    return this.inMemoryAlerts;
  }
}
