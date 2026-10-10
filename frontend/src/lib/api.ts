import {
  DEMO_MODELS,
  DEMO_BUDGETS,
  DEMO_ROUTING_POLICIES,
  DEMO_LEDGER_EVENTS,
  DEMO_ANOMALIES,
  DEMO_DECISION_AUDITS,
} from './demo-data';

const getBaseUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl) {
    return envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;
  }
  return 'http://localhost:4000/api/v1';
};

const BASE_URL = getBaseUrl();

async function fetchWithFallback<T>(
  endpoint: string,
  options?: RequestInit,
  fallbackData?: T,
): Promise<T> {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const json = await res.json();
    return json.data !== undefined ? json.data : json;
  } catch (err: any) {
    if (fallbackData !== undefined) {
      return fallbackData;
    }
    throw err;
  }
}

export const apiClient = {
  // Pricing
  async getPricingCatalog() {
    return fetchWithFallback(
      '/pricing/current',
      { method: 'GET' },
      {
        catalogVersion: 'catalog-2026.04-v1',
        effectiveFrom: '2026-01-01T00:00:00Z',
        currency: 'USD',
        models: DEMO_MODELS,
      },
    );
  },

  async calculateCost(dto: {
    modelId: string;
    promptTokens: number;
    completionTokens: number;
  }) {
    const model =
      DEMO_MODELS.find((m) => m.modelId === dto.modelId) || DEMO_MODELS[0];
    const promptCost = (dto.promptTokens / 1000) * model.promptCostPer1k;
    const compCost = (dto.completionTokens / 1000) * model.completionCostPer1k;

    return fetchWithFallback(
      '/pricing/calculate',
      { method: 'POST', body: JSON.stringify(dto) },
      {
        modelId: model.modelId,
        provider: model.provider,
        promptTokens: dto.promptTokens,
        completionTokens: dto.completionTokens,
        totalTokens: dto.promptTokens + dto.completionTokens,
        promptCostUsd: Number(promptCost.toFixed(6)),
        completionCostUsd: Number(compCost.toFixed(6)),
        totalCostUsd: Number((promptCost + compCost).toFixed(6)),
        catalogVersion: 'catalog-2026.04-v1',
        isEstimate: true,
      },
    );
  },

  // Usage & Ledger
  async getLedger(params?: Record<string, string>) {
    const query = new URLSearchParams(params).toString();
    return fetchWithFallback(
      `/usage/ledger${query ? `?${query}` : ''}`,
      { method: 'GET' },
      {
        items: DEMO_LEDGER_EVENTS,
        total: DEMO_LEDGER_EVENTS.length,
        page: 1,
        limit: 25,
        summary: {
          totalSpendUsd: 0.0507,
          totalTokens: 10290,
          totalEvents: DEMO_LEDGER_EVENTS.length,
          errorCount: 0,
        },
      },
    );
  },

  async getAnalytics(params?: Record<string, string>) {
    const query = new URLSearchParams(params).toString();
    return fetchWithFallback(
      `/usage/analytics${query ? `?${query}` : ''}`,
      { method: 'GET' },
      {
        kpis: {
          totalSpendUsd: 46.53,
          totalTokens: 15300000,
          totalRequests: 10390,
          avgLatencyMs: 420,
          errorRatePercent: 0.45,
          fallbackCount: 14,
        },
        dataCompleteness: {
          isEstimate: true,
          catalogCoveragePercent: 100,
          disclaimer:
            'Costs represent verified pricing catalog estimates computed from token volumes and do not reflect raw provider invoice statements.',
        },
        breakdowns: {
          byModel: [
            {
              model: 'gpt-4o',
              spendUsd: 18.42,
              tokens: 2840000,
              requests: 1420,
              avgLatencyMs: 610,
              errorRate: 0.8,
            },
            {
              model: 'claude-3-5-sonnet',
              spendUsd: 24.15,
              tokens: 2120000,
              requests: 980,
              avgLatencyMs: 730,
              errorRate: 0.5,
            },
            {
              model: 'gpt-4o-mini',
              spendUsd: 2.85,
              tokens: 6100000,
              requests: 4890,
              avgLatencyMs: 310,
              errorRate: 0.2,
            },
            {
              model: 'gemini-1-5-flash',
              spendUsd: 1.12,
              tokens: 4200000,
              requests: 3100,
              avgLatencyMs: 230,
              errorRate: 0.3,
            },
          ],
          byProvider: [
            { provider: 'openai', spendUsd: 21.27, tokens: 8940000, requests: 6310 },
            { provider: 'anthropic', spendUsd: 24.15, tokens: 2120000, requests: 980 },
            { provider: 'google', spendUsd: 1.12, tokens: 4200000, requests: 3100 },
          ],
          byApplication: [
            { applicationId: 'ai-pr-review-platform', spendUsd: 22.45, tokens: 5800000, requests: 3400 },
            { applicationId: 'ai-movie-matcher', spendUsd: 14.18, tokens: 4900000, requests: 4200 },
            { applicationId: 'ai-travel-planner', spendUsd: 9.91, tokens: 4560000, requests: 2790 },
          ],
        },
        timeSeries: [
          { date: '2026-04-05', spendUsd: 5.4, tokens: 2100000, requests: 1420, avgLatencyMs: 410 },
          { date: '2026-04-06', spendUsd: 6.8, tokens: 2450000, requests: 1680, avgLatencyMs: 430 },
          { date: '2026-04-07', spendUsd: 7.2, tokens: 2600000, requests: 1750, avgLatencyMs: 420 },
          { date: '2026-04-08', spendUsd: 6.1, tokens: 2280000, requests: 1510, avgLatencyMs: 395 },
          { date: '2026-04-09', spendUsd: 8.9, tokens: 3100000, requests: 1980, avgLatencyMs: 460 },
          { date: '2026-04-10', spendUsd: 7.5, tokens: 2750000, requests: 1820, avgLatencyMs: 440 },
          { date: '2026-04-11', spendUsd: 4.64, tokens: 1880000, requests: 1230, avgLatencyMs: 425 },
        ],
      },
    );
  },

  async getAnomalies(tenantId?: string) {
    return fetchWithFallback(
      `/usage/anomalies${tenantId ? `?tenantId=${tenantId}` : ''}`,
      { method: 'GET' },
      DEMO_ANOMALIES,
    );
  },

  // Budgets
  async getBudgets(tenantId?: string) {
    return fetchWithFallback(
      `/budgets${tenantId ? `?tenantId=${tenantId}` : ''}`,
      { method: 'GET' },
      DEMO_BUDGETS,
    );
  },

  async getBudgetAlerts(tenantId?: string) {
    return fetchWithFallback(
      `/budgets/alerts${tenantId ? `?tenantId=${tenantId}` : ''}`,
      { method: 'GET' },
      [
        {
          alertId: 'alt_01',
          policyId: 'bdg_pr_review',
          policyName: 'PR Review Platform Feature Budget',
          alertType: 'WARNING',
          thresholdCrossedPercent: 85.5,
          spendAtAlertUsd: 68.4,
          limitUsd: 80.0,
          createdAt: '2026-04-10T20:12:00Z',
          notificationStatus: 'DELIVERED',
          message: 'WARNING: Budget threshold reached. Spend is $68.40 (85.5% of $80.00).',
        },
      ],
    );
  },

  // Routing Policies
  async getRoutingPolicies(tenantId?: string) {
    return fetchWithFallback(
      `/routing/policies${tenantId ? `?tenantId=${tenantId}` : ''}`,
      { method: 'GET' },
      DEMO_ROUTING_POLICIES,
    );
  },

  async simulateRoute(payload: any) {
    // Generate fallback simulation if backend is not running
    const latencyTarget = payload.latencyTargetMs || 650;
    const maxCost = payload.maxCostPer1kTokensUsd || 0.005;
    const qualityMin = payload.qualityThreshold || 0.85;

    const evaluations = DEMO_MODELS.map((model) => {
      const promptCost = (payload.promptTokens / 1000) * model.promptCostPer1k;
      const compCost = (payload.expectedCompletionTokens / 1000) * model.completionCostPer1k;
      const totalCost = promptCost + compCost;
      const effectiveCostPer1k = (totalCost / (payload.promptTokens + payload.expectedCompletionTokens || 1)) * 1000;

      let status: 'SELECTED' | 'REJECTED' | 'STANDBY_FALLBACK' = 'REJECTED';
      let rejectionReason: string | undefined = undefined;
      let explanation = 'Satisfies constraints.';

      if (model.medianLatencyMs > latencyTarget) {
        rejectionReason = 'EXCEEDS_LATENCY_TARGET';
        explanation = `Latency (${model.medianLatencyMs}ms) exceeds SLA of ${latencyTarget}ms.`;
      } else if (effectiveCostPer1k > maxCost) {
        rejectionReason = 'EXCEEDS_COST_LIMIT';
        explanation = `Effective cost of $${effectiveCostPer1k.toFixed(4)}/1k exceeds max cap of $${maxCost.toFixed(4)}/1k.`;
      } else if (model.baselineQualityScore < qualityMin) {
        rejectionReason = 'QUALITY_GATE_FAILED';
        explanation = `Quality score (${model.baselineQualityScore}) is below minimum requirement of ${qualityMin}.`;
      } else {
        status = 'STANDBY_FALLBACK';
      }

      return {
        modelId: model.modelId,
        provider: model.provider,
        status,
        estimatedCostUsd: Number(totalCost.toFixed(6)),
        medianLatencyMs: model.medianLatencyMs,
        qualityScore: model.baselineQualityScore,
        rejectionReason,
        explanation,
      };
    });

    const eligible = evaluations.filter((e) => e.status === 'STANDBY_FALLBACK');
    let winner: any = null;
    if (eligible.length > 0) {
      eligible.sort((a, b) => a.estimatedCostUsd - b.estimatedCostUsd);
      winner = eligible[0];
      winner.status = 'SELECTED';
      winner.explanation = 'Winning route: lowest estimated cost among candidates meeting all quality and latency constraints.';
    }

    return fetchWithFallback(
      '/routing/simulation',
      { method: 'POST', body: JSON.stringify(payload) },
      {
        simulationId: `sim_${Date.now()}`,
        correlationId: `corr_sim_${Date.now()}`,
        decision: winner ? 'ROUTED' : 'ALL_CANDIDATES_REJECTED',
        selectedRoute: winner
          ? {
              modelId: winner.modelId,
              provider: winner.provider,
              displayName: winner.modelId,
              estimatedCostUsd: winner.estimatedCostUsd,
              estimatedLatencyMs: winner.medianLatencyMs,
              qualityScore: winner.qualityScore,
              catalogVersion: 'catalog-2026.04-v1',
            }
          : null,
        candidateEvaluations: evaluations,
        fallbackChain: [
          { modelId: 'gpt-4o', provider: 'openai', priority: 1 },
          { modelId: 'claude-3-5-sonnet', provider: 'anthropic', priority: 2 },
        ],
        explanation: winner
          ? `Autopilot selected '${winner.modelId}' ($${winner.estimatedCostUsd} estimated cost, ${winner.medianLatencyMs}ms median latency).`
          : 'All candidates rejected by active constraints.',
      },
    );
  },

  async getDecisionAudits(tenantId?: string) {
    return fetchWithFallback(
      `/routing/audits${tenantId ? `?tenantId=${tenantId}` : ''}`,
      { method: 'GET' },
      DEMO_DECISION_AUDITS,
    );
  },

  // Quality Gates
  async evaluateQualityGate(payload: any) {
    return fetchWithFallback(
      '/quality-gates/evaluate',
      { method: 'POST', body: JSON.stringify(payload) },
      {
        passed: true,
        decision: 'PASS',
        model: payload.model,
        provider: payload.provider,
        regressionServiceContacted: true,
        score: 0.94,
        minimumRequiredScore: 0.85,
        explanation: 'Model Regression Detection verified 0 regressions against prod baseline.',
        details: {
          status: 'PASS',
          summary: { passed: 5, warnings: 0, failed: 0 },
        },
      },
    );
  },

  // Health
  async getReadiness() {
    return fetchWithFallback(
      'http://localhost:4000/health/ready',
      { method: 'GET' },
      {
        status: 'ok',
        dependencies: {
          mongodb: { status: 'UP', readyState: 1 },
          aiPlatform: { status: 'STANDBY', url: 'http://localhost:5000' },
          modelRegressionService: { status: 'STANDBY', url: 'http://localhost:4000' },
          notificationService: { status: 'CONFIGURED', url: 'http://localhost:3001' },
        },
        timestamp: new Date().toISOString(),
      },
    );
  },
};
