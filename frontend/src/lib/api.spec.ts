import { apiClient } from './api';

describe('Frontend apiClient', () => {
  it('should return default pricing catalog with models', async () => {
    const catalog = await apiClient.getPricingCatalog();
    expect(catalog).toBeDefined();
    expect(catalog.models.length).toBeGreaterThan(0);
    const gpt4o = catalog.models.find((m: any) => m.modelId === 'gpt-4o');
    expect(gpt4o).toBeDefined();
    expect(gpt4o.promptCostPer1k).toBe(0.0025);
  });

  it('should accurately calculate token costs for simulation', async () => {
    const cost = await apiClient.calculateCost({
      modelId: 'gpt-4o',
      promptTokens: 1000,
      completionTokens: 500,
    });
    expect(cost.totalCostUsd).toBe(0.0075);
    expect(cost.isEstimate).toBe(true);
  });
});
