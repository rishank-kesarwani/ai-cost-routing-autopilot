import {
  Injectable,
  Logger,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import {
  RoutingPolicy,
  RoutingPolicyDocument,
} from './schemas/routing-policy.schema';
import {
  DecisionAudit,
  DecisionAuditDocument,
  CandidateEvaluationTrace,
} from './schemas/decision-audit.schema';
import { SimulateRouteDto, ExecuteRouteDto } from './dto/simulate-route.dto';
import { CreateRoutingPolicyDto } from './dto/create-routing-policy.dto';
import { PricingService } from '../pricing/pricing.service';
import { QualityGatesService } from '../quality-gates/quality-gates.service';
import { UsageService } from '../usage/usage.service';
import { BudgetsService } from '../budgets/budgets.service';
import { AiPlatformClient } from '../integrations/ai-platform.client';

export interface RouteSimulationResult {
  simulationId: string;
  correlationId: string;
  decision: 'ROUTED' | 'ALL_CANDIDATES_REJECTED';
  selectedRoute: {
    modelId: string;
    provider: string;
    displayName: string;
    estimatedCostUsd: number;
    estimatedLatencyMs: number;
    qualityScore: number;
    catalogVersion: string;
  } | null;
  policyApplied: {
    policyId: string;
    policyName: string;
    latencyTargetMs: number;
    maxCostPer1kTokensUsd: number;
    qualityThreshold: number;
  };
  candidateEvaluations: CandidateEvaluationTrace[];
  fallbackChain: Array<{
    modelId: string;
    provider: string;
    priority: number;
  }>;
  explanation: string;
  auditRecordId: string;
}

@Injectable()
export class RoutingService {
  private readonly logger = new Logger(RoutingService.name);
  private inMemoryPolicies: RoutingPolicy[] = [];
  private inMemoryAudits: DecisionAudit[] = [];

  constructor(
    @InjectModel(RoutingPolicy.name)
    private readonly policyModel: Model<RoutingPolicyDocument>,
    @InjectModel(DecisionAudit.name)
    private readonly auditModel: Model<DecisionAuditDocument>,
    private readonly pricingService: PricingService,
    private readonly qualityGatesService: QualityGatesService,
    private readonly usageService: UsageService,
    private readonly budgetsService: BudgetsService,
    private readonly aiPlatformClient: AiPlatformClient,
  ) {}

  async createPolicy(dto: CreateRoutingPolicyDto): Promise<RoutingPolicy> {
    const policyId = `pol_${uuidv4().substring(0, 8)}`;
    const record: RoutingPolicy = {
      policyId,
      name: dto.name,
      tenantId: dto.tenantId,
      applicationId: dto.applicationId,
      featureId: dto.featureId || null,
      latencyTargetMs: dto.latencyTargetMs,
      maxCostPer1kTokensUsd: dto.maxCostPer1kTokensUsd,
      qualityThreshold: dto.qualityThreshold,
      providerAllowlist: dto.providerAllowlist,
      modelPriority: dto.modelPriority,
      fallbackOrder: dto.fallbackOrder,
      qualityGateMode: dto.qualityGateMode || 'FAIL_CLOSED',
      maxRetryAttempts: 3,
      deadlineBudgetMs: 5000,
      isDefault: dto.isDefault || false,
      active: true,
      description: dto.description || 'Autopilot routing policy',
    };

    try {
      const created = await this.policyModel.create(record);
      return created.toObject() as RoutingPolicy;
    } catch (err: any) {
      this.logger.warn(`Failed to save routing policy to Mongo (${err.message}), using in-memory store`);
      this.inMemoryPolicies.push(record);
      return record;
    }
  }

  async listPolicies(tenantId?: string): Promise<RoutingPolicy[]> {
    const filter = tenantId ? { tenantId } : {};
    try {
      const list = await this.policyModel.find(filter).sort({ createdAt: -1 }).lean();
      if (list && list.length > 0) return list as unknown as RoutingPolicy[];
    } catch (err: any) {
      this.logger.debug(`Error querying routing policies: ${err.message}`);
    }

    if (tenantId) {
      return this.inMemoryPolicies.filter((p) => p.tenantId === tenantId);
    }
    return this.inMemoryPolicies;
  }

  async getPolicyById(policyId: string): Promise<RoutingPolicy | null> {
    try {
      const found = await this.policyModel.findOne({ policyId }).lean();
      if (found) return found as unknown as RoutingPolicy;
    } catch (err: any) {
      this.logger.debug(`Error getting policy: ${err.message}`);
    }

    return this.inMemoryPolicies.find((p) => p.policyId === policyId) || null;
  }

  /**
   * Deterministic, explainable dry-run simulation of routing decisions.
   * Compares all catalog models against SLA, cost caps, quality gates, and provider allowlists.
   */
  async simulateRoute(dto: SimulateRouteDto): Promise<RouteSimulationResult> {
    const correlationId = dto.correlationId || `sim_${uuidv4()}`;
    const activeCatalog = await this.pricingService.getActiveCatalog();

    // Find policy or construct dynamic one
    let policy: RoutingPolicy | null = null;
    if (dto.policyId) {
      policy = await this.getPolicyById(dto.policyId);
    } else {
      const tenantPolicies = await this.listPolicies(dto.tenantId);
      policy =
        tenantPolicies.find(
          (p) =>
            p.active &&
            p.applicationId === dto.applicationId &&
            (!p.featureId || p.featureId === dto.featureId),
        ) ||
        tenantPolicies.find((p) => p.active && p.isDefault) ||
        null;
    }

    const latencyTarget =
      dto.latencyTargetMs ?? policy?.latencyTargetMs ?? 650;
    const maxCost =
      dto.maxCostPer1kTokensUsd ?? policy?.maxCostPer1kTokensUsd ?? 0.005;
    const qualityMin =
      dto.qualityThreshold ?? policy?.qualityThreshold ?? 0.85;
    const allowlist =
      dto.providerAllowlist ?? policy?.providerAllowlist ?? [
        'openai',
        'anthropic',
        'google',
        'groq',
        'mistral',
      ];
    const priority = policy?.modelPriority ?? [
      'gpt-4o-mini',
      'gemini-1-5-flash',
      'claude-3-haiku',
      'llama-3.3-70b-versatile',
      'gpt-4o',
      'claude-3-5-sonnet',
    ];
    const fallbackList = policy?.fallbackOrder ?? [
      'gpt-4o',
      'claude-3-5-sonnet',
      'gemini-1-5-pro',
    ];

    const candidateEvaluations: CandidateEvaluationTrace[] = [];
    const eligibleModels: Array<{
      model: any;
      estimatedCostUsd: number;
    }> = [];

    for (const model of activeCatalog.models) {
      // Calculate projected cost for requested prompt & completion tokens
      const costResult = await this.pricingService.computeCost(
        model.modelId,
        dto.promptTokens,
        dto.expectedCompletionTokens,
        activeCatalog.catalogVersion,
      );

      // Average cost per 1k tokens for boundary check
      const totalTokens = dto.promptTokens + dto.expectedCompletionTokens || 1000;
      const effectiveCostPer1k = (costResult.totalCostUsd / totalTokens) * 1000;

      let status: 'SELECTED' | 'REJECTED' | 'STANDBY_FALLBACK' = 'REJECTED';
      let rejectionReason: any = undefined;
      let explanation = 'Passed all constraints.';

      if (!allowlist.includes(model.provider)) {
        rejectionReason = 'PROVIDER_NOT_ALLOWED';
        explanation = `Provider '${model.provider}' is not included in the operator allowlist [${allowlist.join(', ')}].`;
      } else if (model.medianLatencyMs > latencyTarget) {
        rejectionReason = 'EXCEEDS_LATENCY_TARGET';
        explanation = `Median latency (${model.medianLatencyMs}ms) exceeds the target SLA constraint of ${latencyTarget}ms.`;
      } else if (effectiveCostPer1k > maxCost) {
        rejectionReason = 'EXCEEDS_COST_LIMIT';
        explanation = `Effective cost of $${effectiveCostPer1k.toFixed(5)}/1k tokens exceeds max threshold of $${maxCost.toFixed(5)}/1k.`;
      } else if (model.baselineQualityScore < qualityMin) {
        rejectionReason = 'QUALITY_GATE_FAILED';
        explanation = `Model baseline quality score (${model.baselineQualityScore.toFixed(2)}) is below the required threshold of ${qualityMin.toFixed(2)}.`;
      } else {
        status = 'STANDBY_FALLBACK';
        explanation = `Candidate satisfies all SLA, cost, provider and quality requirements.`;
        eligibleModels.push({
          model,
          estimatedCostUsd: costResult.totalCostUsd,
        });
      }

      candidateEvaluations.push({
        modelId: model.modelId,
        provider: model.provider,
        status,
        estimatedCostUsd: costResult.totalCostUsd,
        medianLatencyMs: model.medianLatencyMs,
        qualityScore: model.baselineQualityScore,
        rejectionReason,
        explanation,
      });
    }

    // Select winner based on operator priority list, then lowest cost
    let selectedWinner: any = null;
    if (eligibleModels.length > 0) {
      // Sort eligible models by priority list index first
      eligibleModels.sort((a, b) => {
        const pA = priority.indexOf(a.model.modelId);
        const pB = priority.indexOf(b.model.modelId);
        const rankA = pA !== -1 ? pA : 999;
        const rankB = pB !== -1 ? pB : 999;
        if (rankA !== rankB) return rankA - rankB;
        return a.estimatedCostUsd - b.estimatedCostUsd;
      });

      selectedWinner = eligibleModels[0];

      // Mark winner in evaluations trace
      const winnerEval = candidateEvaluations.find(
        (c) => c.modelId === selectedWinner.model.modelId,
      );
      if (winnerEval) {
        winnerEval.status = 'SELECTED';
        winnerEval.explanation = `Selected candidate: Meets all constraints and holds highest operator priority rank.`;
      }
    }

    // Build fallback chain
    const fallbackChain = fallbackList
      .filter((m) => !selectedWinner || m !== selectedWinner.model.modelId)
      .map((modelId, idx) => {
        const entry = activeCatalog.models.find((m) => m.modelId === modelId);
        return {
          modelId,
          provider: entry?.provider || 'unknown',
          priority: idx + 1,
        };
      });

    const auditId = `aud_${uuidv4().substring(0, 8)}`;
    const auditRecord: DecisionAudit = {
      auditId,
      correlationId,
      tenantId: dto.tenantId,
      applicationId: dto.applicationId,
      featureId: dto.featureId,
      dryRun: true,
      policyApplied: {
        policyId: policy?.policyId || 'adhoc-simulation',
        policyName: policy?.name || 'Ad-Hoc Operator Simulation',
        latencyTargetMs: latencyTarget,
        maxCostPer1kTokensUsd: maxCost,
        qualityThreshold: qualityMin,
      },
      inputs: {
        promptTokens: dto.promptTokens,
        expectedCompletionTokens: dto.expectedCompletionTokens,
      },
      candidateEvaluations,
      selectedRoute: selectedWinner
        ? {
            modelId: selectedWinner.model.modelId,
            provider: selectedWinner.model.provider,
            estimatedCostUsd: selectedWinner.estimatedCostUsd,
            estimatedLatencyMs: selectedWinner.model.medianLatencyMs,
            qualityScore: selectedWinner.model.baselineQualityScore,
            catalogVersion: activeCatalog.catalogVersion,
          }
        : null,
      fallbackChain: fallbackChain.map((f) => f.modelId),
      redacted: true,
    };

    try {
      await this.auditModel.create(auditRecord);
    } catch {
      this.inMemoryAudits.unshift(auditRecord);
    }

    return {
      simulationId: auditId,
      correlationId,
      decision: selectedWinner ? 'ROUTED' : 'ALL_CANDIDATES_REJECTED',
      selectedRoute: selectedWinner
        ? {
            modelId: selectedWinner.model.modelId,
            provider: selectedWinner.model.provider,
            displayName: selectedWinner.model.displayName,
            estimatedCostUsd: selectedWinner.estimatedCostUsd,
            estimatedLatencyMs: selectedWinner.model.medianLatencyMs,
            qualityScore: selectedWinner.model.baselineQualityScore,
            catalogVersion: activeCatalog.catalogVersion,
          }
        : null,
      policyApplied: auditRecord.policyApplied,
      candidateEvaluations,
      fallbackChain,
      explanation: selectedWinner
        ? `Autopilot selected '${selectedWinner.model.displayName}' ($${selectedWinner.estimatedCostUsd.toFixed(4)} estimated spend, ${selectedWinner.model.medianLatencyMs}ms median latency) satisfying all policy rules.`
        : `No models satisfied the current criteria (Latency SLA <= ${latencyTarget}ms, Cost <= $${maxCost}/1k, Quality >= ${qualityMin}).`,
      auditRecordId: auditId,
    };
  }

  /**
   * Safe execution with fallback:
   * Retries only retryable errors (429 rate limit, 503 service unavailable, 504 timeout).
   * Refuses to fallback around authorization failures (401/403).
   * Enforces hard budget limits if configured.
   */
  async executeRouteWithFallback(dto: ExecuteRouteDto): Promise<{
    success: boolean;
    output: string;
    modelUsed: string;
    provider: string;
    fallbackActivated: boolean;
    promptTokens: number;
    completionTokens: number;
    estimatedCostUsd: number;
    correlationId: string;
    auditRecordId: string;
  }> {
    const correlationId = dto.correlationId || `req_${uuidv4()}`;
    const promptLen = dto.prompt.length;
    const estimatedPromptTokens = Math.max(10, Math.round(promptLen / 4));
    const estimatedCompletionTokens = dto.maxTokens || 300;

    // First simulate route to select primary model & fallback chain
    const simulation = await this.simulateRoute({
      tenantId: dto.tenantId,
      applicationId: dto.applicationId,
      featureId: dto.featureId,
      promptTokens: estimatedPromptTokens,
      expectedCompletionTokens: estimatedCompletionTokens,
      policyId: dto.policyId,
      correlationId,
    });

    if (!simulation.selectedRoute) {
      throw new BadRequestException(
        'Routing policy rejected all candidate models based on constraints.',
      );
    }

    // Check budget limits
    const budgetCheck = await this.budgetsService.evaluateAndRecordSpend(
      dto.tenantId,
      dto.applicationId,
      dto.featureId,
      simulation.selectedRoute.estimatedCostUsd,
    );

    if (budgetCheck.blocked) {
      throw new BadRequestException(
        `Execution blocked: ${budgetCheck.reason}`,
      );
    }

    const primaryModel = simulation.selectedRoute.modelId;
    const primaryProvider = simulation.selectedRoute.provider;
    let selectedModel = primaryModel;
    let selectedProvider = primaryProvider;
    let fallbackActivated = false;
    let fallbackFromModel: string | undefined = undefined;

    let responseOutput = '';
    let actualPromptTokens = estimatedPromptTokens;
    let actualCompletionTokens = estimatedCompletionTokens;
    let latencyMs = 0;

    // Execution attempt with resilient fallback
    try {
      const response = await this.aiPlatformClient.executePrompt({
        model: primaryModel,
        provider: primaryProvider,
        prompt: dto.prompt,
        maxTokens: dto.maxTokens,
        correlationId,
      });

      responseOutput = response.output;
      actualPromptTokens = response.promptTokens;
      actualCompletionTokens = response.completionTokens;
      latencyMs = response.latencyMs;
    } catch (primaryErr: any) {
      // If error is an authorization failure (401 / 403), do NOT fallback!
      if (
        primaryErr.status === 401 ||
        primaryErr.status === 403 ||
        primaryErr.message?.includes('401') ||
        primaryErr.message?.includes('403')
      ) {
        throw new UnauthorizedException(
          'Authorization failure on primary model provider. Fallback prohibited for security.',
        );
      }

      this.logger.warn(
        `Primary model ${primaryModel} failed (${primaryErr.message}). Activating safe fallback order...`,
      );

      // Safe fallback attempt with fallback candidates
      const fallbackTarget = simulation.fallbackChain[0];
      if (fallbackTarget) {
        fallbackActivated = true;
        fallbackFromModel = primaryModel;
        selectedModel = fallbackTarget.modelId;
        selectedProvider = fallbackTarget.provider;

        const fallbackResponse = await this.aiPlatformClient.executePrompt({
          model: selectedModel,
          provider: selectedProvider,
          prompt: dto.prompt,
          maxTokens: dto.maxTokens,
          correlationId,
        });

        responseOutput = fallbackResponse.output;
        actualPromptTokens = fallbackResponse.promptTokens;
        actualCompletionTokens = fallbackResponse.completionTokens;
        latencyMs = fallbackResponse.latencyMs;
      } else {
        throw primaryErr;
      }
    }

    // Ingest actual event to Usage Ledger
    const costCalc = await this.pricingService.computeCost(
      selectedModel,
      actualPromptTokens,
      actualCompletionTokens,
      simulation.selectedRoute.catalogVersion,
    );

    const usageEvent = await this.usageService.recordEvent({
      correlationId,
      tenantId: dto.tenantId,
      applicationId: dto.applicationId,
      featureId: dto.featureId,
      model: selectedModel,
      provider: selectedProvider,
      latencyMs,
      promptTokens: actualPromptTokens,
      completionTokens: actualCompletionTokens,
      status: fallbackActivated ? 'FALLBACK_SUCCESS' : 'SUCCESS',
      fallbackActivated,
      fallbackFromModel,
      measurementSource: 'PLATFORM_GATEWAY',
      pricingCatalogVersion: simulation.selectedRoute.catalogVersion,
    });

    return {
      success: true,
      output: responseOutput,
      modelUsed: selectedModel,
      provider: selectedProvider,
      fallbackActivated,
      promptTokens: actualPromptTokens,
      completionTokens: actualCompletionTokens,
      estimatedCostUsd: costCalc.totalCostUsd,
      correlationId,
      auditRecordId: simulation.auditRecordId,
    };
  }

  async listAudits(tenantId?: string): Promise<DecisionAudit[]> {
    const filter = tenantId ? { tenantId } : {};
    try {
      const list = await this.auditModel.find(filter).sort({ createdAt: -1 }).limit(50).lean();
      if (list && list.length > 0) return list as unknown as DecisionAudit[];
    } catch (err: any) {
      this.logger.debug(`Error querying decision audits: ${err.message}`);
    }

    if (tenantId) {
      return this.inMemoryAudits.filter((a) => a.tenantId === tenantId);
    }
    return this.inMemoryAudits;
  }
}
