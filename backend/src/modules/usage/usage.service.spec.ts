import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { UsageService } from './usage.service';
import { UsageEvent } from './schemas/usage-event.schema';
import { PricingService } from '../pricing/pricing.service';

describe('UsageService', () => {
  let service: UsageService;

  const mockUsageModel = {
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockImplementation((doc) => ({
      toObject: () => doc,
    })),
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([]),
          }),
        }),
      }),
    }),
    countDocuments: jest.fn().mockResolvedValue(0),
    aggregate: jest.fn().mockResolvedValue([]),
  };

  const mockPricingService = {
    computeCost: jest.fn().mockResolvedValue({
      modelId: 'gpt-4o',
      provider: 'openai',
      promptTokens: 1000,
      completionTokens: 500,
      totalTokens: 1500,
      promptCostUsd: 0.0025,
      completionCostUsd: 0.005,
      totalCostUsd: 0.0075,
      catalogVersion: 'catalog-2026.04-v1',
      isEstimate: true,
      pricingSource: 'CONFIGURED_CATALOG',
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsageService,
        {
          provide: getModelToken(UsageEvent.name),
          useValue: mockUsageModel,
        },
        {
          provide: PricingService,
          useValue: mockPricingService,
        },
      ],
    }).compile();

    service = module.get<UsageService>(UsageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should record an event and compute estimated cost using PricingService', async () => {
    const result = await service.recordEvent({
      tenantId: 'tenant-acme',
      applicationId: 'ai-pr-review-platform',
      featureId: 'pr-summary',
      model: 'gpt-4o',
      latencyMs: 420,
      promptTokens: 1000,
      completionTokens: 500,
    });

    expect(result).toBeDefined();
    expect(result.estimatedCostUsd).toBe(0.0075);
    expect(result.pricingCatalogVersion).toBe('catalog-2026.04-v1');
    expect(result.costSource).toBe('ESTIMATED_CATALOG');
    expect(result.status).toBe('SUCCESS');
  });

  it('should distinguish provider-reported cost when provided', async () => {
    const result = await service.recordEvent({
      tenantId: 'tenant-acme',
      applicationId: 'ai-pr-review-platform',
      featureId: 'pr-summary',
      model: 'gpt-4o',
      latencyMs: 420,
      promptTokens: 1000,
      completionTokens: 500,
      providerReportedCostUsd: 0.0072,
    });

    expect(result.providerReportedCostUsd).toBe(0.0072);
    expect(result.costSource).toBe('PROVIDER_REPORTED');
  });
});
