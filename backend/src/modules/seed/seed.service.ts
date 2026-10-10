import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  UsageEvent,
  UsageEventDocument,
} from '../usage/schemas/usage-event.schema';
import {
  BudgetPolicy,
  BudgetPolicyDocument,
} from '../budgets/schemas/budget-policy.schema';
import {
  BudgetAlert,
  BudgetAlertDocument,
} from '../budgets/schemas/budget-alert.schema';
import {
  RoutingPolicy,
  RoutingPolicyDocument,
} from '../routing/schemas/routing-policy.schema';
import {
  DecisionAudit,
  DecisionAuditDocument,
} from '../routing/schemas/decision-audit.schema';
import { PricingService } from '../pricing/pricing.service';
import { DEFAULT_CATALOG_VERSION } from '../pricing/default-pricing';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectModel(UsageEvent.name)
    private readonly usageModel: Model<UsageEventDocument>,
    @InjectModel(BudgetPolicy.name)
    private readonly budgetModel: Model<BudgetPolicyDocument>,
    @InjectModel(BudgetAlert.name)
    private readonly alertModel: Model<BudgetAlertDocument>,
    @InjectModel(RoutingPolicy.name)
    private readonly routingPolicyModel: Model<RoutingPolicyDocument>,
    @InjectModel(DecisionAudit.name)
    private readonly auditModel: Model<DecisionAuditDocument>,
    private readonly pricingService: PricingService,
  ) {}

  async onApplicationBootstrap() {
    try {
      await this.seedInitialDataIfEmpty();
    } catch (err: any) {
      this.logger.warn(`Auto-seeding skipped: ${err.message}`);
    }
  }

  async seedInitialDataIfEmpty(force = false): Promise<{ message: string; count: number }> {
    let eventCount = 0;
    try {
      eventCount = await this.usageModel.countDocuments();
    } catch {
      // Mongo might be unavailable
    }

    if (eventCount > 0 && !force) {
      return { message: 'Database already contains usage data. Skipping auto-seed.', count: eventCount };
    }

    this.logger.log('Seeding production-grade realistic demo datasets...');

    // 1. Seed Budgets
    await this.seedBudgets();

    // 2. Seed Routing Policies
    await this.seedRoutingPolicies();

    // 3. Seed Usage Events & Decision Audits
    const seededEvents = await this.seedUsageEvents();

    return {
      message: 'Demo datasets seeded successfully across budgets, policies, and ledger.',
      count: seededEvents,
    };
  }

  private async seedBudgets(): Promise<void> {
    try {
      const existing = await this.budgetModel.countDocuments();
      if (existing > 0) return;

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      const budgets: BudgetPolicy[] = [
        {
          policyId: 'bdg_eng_monthly',
          name: 'AI Engineering Monthly Global Cap',
          tenantId: 'tenant-acme',
          applicationId: '*',
          period: 'MONTHLY',
          limitUsd: 250.0,
          warnThresholdPercent: 80,
          hardBlockEnabled: true,
          currentSpendUsd: 184.25,
          currentPeriodStart: monthStart,
          currentPeriodEnd: monthEnd,
          lastAlertSentAt: new Date(Date.now() - 86400000 * 2),
          lastAlertTier: 'NONE',
          status: 'ACTIVE',
          description: 'Hard budget limit covering all AI features for tenant Acme Corp.',
        },
        {
          policyId: 'bdg_pr_review',
          name: 'PR Review Platform Feature Budget',
          tenantId: 'tenant-acme',
          applicationId: 'ai-pr-review-platform',
          featureId: 'code-analysis',
          period: 'MONTHLY',
          limitUsd: 80.0,
          warnThresholdPercent: 75,
          hardBlockEnabled: false,
          currentSpendUsd: 68.4,
          currentPeriodStart: monthStart,
          currentPeriodEnd: monthEnd,
          lastAlertSentAt: new Date(Date.now() - 86400000 * 1),
          lastAlertTier: 'WARNING',
          status: 'WARNING',
          description: 'Soft warning budget for heavy automated PR AST syntax analysis.',
        },
        {
          policyId: 'bdg_movie_matcher',
          name: 'Movie Matcher Conversational Daily Cap',
          tenantId: 'tenant-globex',
          applicationId: 'ai-movie-matcher',
          featureId: 'cinematch-ai',
          period: 'DAILY',
          limitUsd: 15.0,
          warnThresholdPercent: 85,
          hardBlockEnabled: true,
          currentSpendUsd: 6.8,
          currentPeriodStart: new Date(now.setHours(0, 0, 0, 0)),
          currentPeriodEnd: new Date(now.setHours(23, 59, 59, 999)),
          lastAlertSentAt: null,
          lastAlertTier: 'NONE',
          status: 'ACTIVE',
          description: 'Daily rate-capped budget for conversational film assistant.',
        },
      ];

      await this.budgetModel.insertMany(budgets);

      // Seed an alert record
      await this.alertModel.create({
        alertId: 'alt_seed_01',
        policyId: 'bdg_pr_review',
        tenantId: 'tenant-acme',
        policyName: 'PR Review Platform Feature Budget',
        alertType: 'WARNING',
        thresholdCrossedPercent: 85.5,
        spendAtAlertUsd: 68.4,
        limitUsd: 80.0,
        idempotencyKey: `budget-bdg_pr_review-${new Date().toISOString().slice(0, 7)}-WARNING`,
        notificationStatus: 'DELIVERED',
        message: 'WARNING: Spend reached $68.40 (85.5% of $80.00 soft limit).',
      });
    } catch (err: any) {
      this.logger.debug(`Budgets seeding notice: ${err.message}`);
    }
  }

  private async seedRoutingPolicies(): Promise<void> {
    try {
      const existing = await this.routingPolicyModel.countDocuments();
      if (existing > 0) return;

      const policies: RoutingPolicy[] = [
        {
          policyId: 'pol_balanced_default',
          name: 'Balanced Cost & Quality Autopilot (Default)',
          tenantId: 'tenant-acme',
          applicationId: '*',
          latencyTargetMs: 650,
          maxCostPer1kTokensUsd: 0.005,
          qualityThreshold: 0.86,
          providerAllowlist: ['openai', 'anthropic', 'google', 'groq', 'mistral'],
          modelPriority: [
            'gpt-4o-mini',
            'gemini-1-5-flash',
            'claude-3-haiku',
            'llama-3.3-70b-versatile',
            'gpt-4o',
            'claude-3-5-sonnet',
          ],
          fallbackOrder: ['gpt-4o', 'claude-3-5-sonnet', 'gemini-1-5-pro'],
          qualityGateMode: 'FAIL_CLOSED',
          maxRetryAttempts: 3,
          deadlineBudgetMs: 5000,
          isDefault: true,
          active: true,
          description: 'Primary routing engine balancing low token spend with robust quality gates.',
        },
        {
          policyId: 'pol_sub_200ms_realtime',
          name: 'Real-Time Interactive (<250ms SLA)',
          tenantId: 'tenant-acme',
          applicationId: 'ai-movie-matcher',
          featureId: 'semantic-search',
          latencyTargetMs: 250,
          maxCostPer1kTokensUsd: 0.002,
          qualityThreshold: 0.82,
          providerAllowlist: ['google', 'groq', 'openai'],
          modelPriority: ['gemini-1-5-flash', 'llama-3.3-70b-versatile', 'gpt-4o-mini'],
          fallbackOrder: ['gpt-4o-mini', 'gemini-1-5-pro'],
          qualityGateMode: 'FAIL_CLOSED',
          maxRetryAttempts: 2,
          deadlineBudgetMs: 3000,
          isDefault: false,
          active: true,
          description: 'High-speed latency optimized route for interactive search auto-suggest.',
        },
        {
          policyId: 'pol_critical_audit',
          name: 'Zero-Compromise Deep Reasoning & Code Audit',
          tenantId: 'tenant-acme',
          applicationId: 'ai-pr-review-platform',
          featureId: 'code-analysis',
          latencyTargetMs: 1500,
          maxCostPer1kTokensUsd: 0.02,
          qualityThreshold: 0.94,
          providerAllowlist: ['anthropic', 'openai'],
          modelPriority: ['claude-3-5-sonnet', 'gpt-4o', 'gemini-1-5-pro'],
          fallbackOrder: ['gpt-4o', 'claude-3-5-sonnet'],
          qualityGateMode: 'FAIL_CLOSED',
          maxRetryAttempts: 3,
          deadlineBudgetMs: 8000,
          isDefault: false,
          active: true,
          description: 'High-tier route prioritizing code reasoning depth and security synthesis.',
        },
      ];

      await this.routingPolicyModel.insertMany(policies);
    } catch (err: any) {
      this.logger.debug(`Policies seeding notice: ${err.message}`);
    }
  }

  private async seedUsageEvents(): Promise<number> {
    try {
      const events: UsageEvent[] = [];
      const apps = [
        { appId: 'ai-pr-review-platform', features: ['pr-summary', 'code-analysis', 'diff-explanation'] },
        { appId: 'ai-movie-matcher', features: ['cinematch-ai', 'semantic-search', 'recommendations'] },
        { appId: 'ai-travel-planner', features: ['itinerary-gen', 'hotel-recs', 'budget-calc'] },
      ];

      const modelPool = [
        { model: 'gpt-4o-mini', provider: 'openai', cost: 0.0003, lat: 290 },
        { model: 'gemini-1-5-flash', provider: 'google', cost: 0.00015, lat: 220 },
        { model: 'gpt-4o', provider: 'openai', cost: 0.0075, lat: 610 },
        { model: 'claude-3-5-sonnet', provider: 'anthropic', cost: 0.018, lat: 730 },
        { model: 'llama-3.3-70b-versatile', provider: 'groq', cost: 0.0007, lat: 140 },
      ];

      const now = Date.now();

      // Generate 120 realistic events over the past 14 days
      for (let i = 0; i < 120; i++) {
        const daysAgo = Math.floor(Math.random() * 14);
        const hoursAgo = Math.floor(Math.random() * 24);
        const eventTime = new Date(now - daysAgo * 86400000 - hoursAgo * 3600000);

        const appChoice = apps[Math.floor(Math.random() * apps.length)];
        const featChoice = appChoice.features[Math.floor(Math.random() * appChoice.features.length)];
        const modelChoice = modelPool[Math.floor(Math.random() * modelPool.length)];

        const promptTokens = Math.floor(Math.random() * 1800) + 200;
        const completionTokens = Math.floor(Math.random() * 800) + 100;

        const isError = Math.random() < 0.03;
        const isFallback = !isError && Math.random() < 0.06;

        const eventId = `evt_seed_${i + 1}`;
        const correlationId = `corr_seed_${i + 1}`;

        const eventRecord: UsageEvent = {
          eventId,
          correlationId,
          tenantId: i % 4 === 0 ? 'tenant-globex' : 'tenant-acme',
          applicationId: appChoice.appId,
          featureId: featChoice,
          model: modelChoice.model,
          provider: modelChoice.provider,
          requestTimestamp: eventTime,
          latencyMs: modelChoice.lat + Math.floor(Math.random() * 80 - 40),
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
          estimatedCostUsd: Number(((promptTokens / 1000) * 0.002 + (completionTokens / 1000) * 0.006).toFixed(5)),
          providerReportedCostUsd: i % 3 === 0 ? Number(((promptTokens / 1000) * 0.0019 + (completionTokens / 1000) * 0.0058).toFixed(5)) : null,
          costSource: i % 3 === 0 ? 'PROVIDER_REPORTED' : 'ESTIMATED_CATALOG',
          pricingCatalogVersion: DEFAULT_CATALOG_VERSION,
          status: isError ? 'ERROR' : isFallback ? 'FALLBACK_SUCCESS' : 'SUCCESS',
          errorType: isError ? (i % 2 === 0 ? 'RATE_LIMIT' : 'TIMEOUT') : undefined,
          fallbackActivated: isFallback,
          fallbackFromModel: isFallback ? 'gpt-4o' : undefined,
          measurementSource: 'PLATFORM_GATEWAY',
          metadata: { seeded: true },
        };

        events.push(eventRecord);
      }

      await this.usageModel.insertMany(events);
      this.logger.log(`Successfully seeded ${events.length} realistic usage records.`);
      return events.length;
    } catch (err: any) {
      this.logger.debug(`Usage seeding notice: ${err.message}`);
      return 0;
    }
  }
}
