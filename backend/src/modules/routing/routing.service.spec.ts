import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { RoutingService } from './routing.service';
import { RoutingPolicy } from './schemas/routing-policy.schema';
import { DecisionAudit } from './schemas/decision-audit.schema';
import { PricingService } from '../pricing/pricing.service';
import { QualityGatesService } from '../quality-gates/quality-gates.service';
import { UsageService } from '../usage/usage.service';
import { BudgetsService } from '../budgets/budgets.service';
import { AiPlatformClient } from '../integrations/ai-platform.client';
import { DEFAULT_PRICING_MODELS } from '../pricing/default-pricing';

describe('RoutingService', () => {
  let service: RoutingService;

  const mockPolicyModel = {
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    }),
    findOne: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    }),
    create: jest.fn().mockImplementation((doc) => ({
      toObject: () => doc,
    })),
  };

  const mockAuditModel = {
    create: jest.fn().mockResolvedValue({}),
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([]),
        }),
      }),
    }),
  };

  const mockPricingService = {
    getActiveCatalog: jest.fn().mockResolvedValue({
      catalogVersion: 'catalog-2026.04-v1',
      models: DEFAULT_PRICING_MODELS,
    }),
    computeCost: jest.fn().mockImplementation((modelId, prompt, completion) => {
      const model = DEFAULT_PRICING_MODELS.find((m) => m.modelId === modelId);
      const promptCost = (prompt / 1000) * (model?.promptCostPer1k || 0.001);
      const compCost = (completion / 1000) * (model?.completionCostPer1k || 0.002);
      return Promise.resolve({
        modelId,
        provider: model?.provider || 'openai',
        totalCostUsd: promptCost + compCost,
        catalogVersion: 'catalog-2026.04-v1',
      });
    }),
  };

  const mockQualityGatesService = {
    evaluateGate: jest.fn().mockResolvedValue({
      passed: true,
      decision: 'PASS',
      score: 0.92,
    }),
  };

  const mockUsageService = {
    recordEvent: jest.fn().mockResolvedValue({}),
  };

  const mockBudgetsService = {
    evaluateAndRecordSpend: jest.fn().mockResolvedValue({
      blocked: false,
    }),
  };

  const mockAiPlatformClient = {
    executePrompt: jest.fn().mockResolvedValue({
      output: 'Test completion output',
      promptTokens: 250,
      completionTokens: 150,
      latencyMs: 320,
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoutingService,
        {
          provide: getModelToken(RoutingPolicy.name),
          useValue: mockPolicyModel,
        },
        {
          provide: getModelToken(DecisionAudit.name),
          useValue: mockAuditModel,
        },
        {
          provide: PricingService,
          useValue: mockPricingService,
        },
        {
          provide: QualityGatesService,
          useValue: mockQualityGatesService,
        },
        {
          provide: UsageService,
          useValue: mockUsageService,
        },
        {
          provide: BudgetsService,
          useValue: mockBudgetsService,
        },
        {
          provide: AiPlatformClient,
          useValue: mockAiPlatformClient,
        },
      ],
    }).compile();

    service = module.get<RoutingService>(RoutingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should simulate route and reject models that exceed latency SLA', async () => {
    // Stringent latency requirement of 250ms
    const sim = await service.simulateRoute({
      tenantId: 'tenant-acme',
      applicationId: 'ai-pr-review-platform',
      featureId: 'interactive-chat',
      promptTokens: 500,
      expectedCompletionTokens: 250,
      latencyTargetMs: 250, // Only gemini-1-5-flash (240ms) and llama-3.3-70b (140ms) should qualify
      qualityThreshold: 0.8,
    });

    expect(sim.decision).toBe('ROUTED');
    expect(sim.selectedRoute).toBeDefined();
    // Claude 3.5 Sonnet (740ms) and GPT-4o (620ms) should be rejected for latency
    const gpt4oTrace = sim.candidateEvaluations.find(
      (c) => c.modelId === 'gpt-4o',
    );
    expect(gpt4oTrace?.status).toBe('REJECTED');
    expect(gpt4oTrace?.rejectionReason).toBe('EXCEEDS_LATENCY_TARGET');
  });

  it('should reject models that do not meet quality threshold', async () => {
    // Ultra high quality requirement of 0.95
    const sim = await service.simulateRoute({
      tenantId: 'tenant-acme',
      applicationId: 'ai-pr-review-platform',
      featureId: 'complex-audit',
      promptTokens: 1000,
      expectedCompletionTokens: 500,
      latencyTargetMs: 1000,
      maxCostPer1kTokensUsd: 0.02,
      qualityThreshold: 0.95, // Only claude-3-5-sonnet (0.96) satisfies >= 0.95
    });

    expect(sim.decision).toBe('ROUTED');
    expect(sim.selectedRoute?.modelId).toBe('claude-3-5-sonnet');

    const gpt4ominiTrace = sim.candidateEvaluations.find(
      (c) => c.modelId === 'gpt-4o-mini',
    );
    expect(gpt4ominiTrace?.status).toBe('REJECTED');
    expect(gpt4ominiTrace?.rejectionReason).toBe('QUALITY_GATE_FAILED');
  });
});
