import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { PricingService } from './pricing.service';
import { PricingCatalog } from './schemas/pricing-catalog.schema';
import { DEFAULT_CATALOG_VERSION } from './default-pricing';

describe('PricingService', () => {
  let service: PricingService;

  const mockCatalogModel = {
    findOne: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    }),
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    }),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PricingService,
        {
          provide: getModelToken(PricingCatalog.name),
          useValue: mockCatalogModel,
        },
      ],
    }).compile();

    service = module.get<PricingService>(PricingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should accurately calculate prompt and completion cost for gpt-4o', async () => {
    // 1000 prompt tokens @ $0.0025/1k = $0.0025
    // 500 completion tokens @ $0.01/1k = $0.0050
    // Total = $0.0075
    const result = await service.computeCost('gpt-4o', 1000, 500);

    expect(result.modelId).toBe('gpt-4o');
    expect(result.provider).toBe('openai');
    expect(result.promptCostUsd).toBe(0.0025);
    expect(result.completionCostUsd).toBe(0.005);
    expect(result.totalCostUsd).toBe(0.0075);
    expect(result.isEstimate).toBe(true);
    expect(result.catalogVersion).toBe(DEFAULT_CATALOG_VERSION);
  });

  it('should accurately calculate prompt and completion cost for claude-3-5-sonnet', async () => {
    // 2000 prompt tokens @ $0.003/1k = $0.006
    // 1000 completion tokens @ $0.015/1k = $0.015
    // Total = $0.021
    const result = await service.computeCost('claude-3-5-sonnet', 2000, 1000);

    expect(result.modelId).toBe('claude-3-5-sonnet');
    expect(result.provider).toBe('anthropic');
    expect(result.promptCostUsd).toBe(0.006);
    expect(result.completionCostUsd).toBe(0.015);
    expect(result.totalCostUsd).toBe(0.021);
  });

  it('should return fallback estimate for unknown model without failing', async () => {
    const result = await service.computeCost('custom-unknown-model', 1000, 1000);

    expect(result.modelId).toBe('custom-unknown-model');
    expect(result.isEstimate).toBe(true);
    expect(result.pricingSource).toBe('FALLBACK_DEFAULTS');
    expect(result.totalCostUsd).toBeGreaterThan(0);
  });
});
