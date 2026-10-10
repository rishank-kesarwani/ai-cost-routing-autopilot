import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  PricingCatalog,
  PricingCatalogDocument,
  ModelPricingEntry,
} from './schemas/pricing-catalog.schema';
import {
  DEFAULT_CATALOG_VERSION,
  DEFAULT_PRICING_MODELS,
} from './default-pricing';

export interface CostCalculationResult {
  modelId: string;
  provider: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  promptCostUsd: number;
  completionCostUsd: number;
  totalCostUsd: number;
  catalogVersion: string;
  isEstimate: boolean;
  pricingSource: 'CONFIGURED_CATALOG' | 'FALLBACK_DEFAULTS';
}

@Injectable()
export class PricingService implements OnModuleInit {
  private readonly logger = new Logger(PricingService.name);
  private memoryCatalog: Map<string, ModelPricingEntry> = new Map();

  constructor(
    @InjectModel(PricingCatalog.name)
    private readonly catalogModel: Model<PricingCatalogDocument>,
  ) {
    // Populate in-memory catalog with defaults immediately
    for (const model of DEFAULT_PRICING_MODELS) {
      this.memoryCatalog.set(model.modelId, model);
    }
  }

  async onModuleInit() {
    await this.ensureDefaultCatalog();
  }

  async ensureDefaultCatalog(): Promise<void> {
    try {
      const existing = await this.catalogModel.findOne({
        catalogVersion: DEFAULT_CATALOG_VERSION,
      });

      if (!existing) {
        this.logger.log(
          `Initializing default pricing catalog version: ${DEFAULT_CATALOG_VERSION}`,
        );
        await this.catalogModel.create({
          catalogVersion: DEFAULT_CATALOG_VERSION,
          effectiveFrom: new Date('2026-01-01T00:00:00Z'),
          effectiveTo: null,
          currency: 'USD',
          isCurrent: true,
          models: DEFAULT_PRICING_MODELS,
          notes: 'Standard production pricing catalog for 2026 models',
        });
      }
    } catch (err: any) {
      this.logger.warn(
        `Failed to query or create default pricing catalog in Mongo (${err.message}). Using resilient in-memory pricing defaults.`,
      );
    }
  }

  async getActiveCatalog(): Promise<{
    catalogVersion: string;
    effectiveFrom: Date;
    effectiveTo: Date | null;
    currency: string;
    models: ModelPricingEntry[];
  }> {
    try {
      const current = await this.catalogModel.findOne({ isCurrent: true }).lean();
      if (current) {
        return {
          catalogVersion: current.catalogVersion,
          effectiveFrom: current.effectiveFrom,
          effectiveTo: current.effectiveTo,
          currency: current.currency,
          models: current.models,
        };
      }
    } catch (err) {
      this.logger.debug(
        `Using fallback catalog in getActiveCatalog: ${err.message}`,
      );
    }

    return {
      catalogVersion: DEFAULT_CATALOG_VERSION,
      effectiveFrom: new Date('2026-01-01T00:00:00Z'),
      effectiveTo: null,
      currency: 'USD',
      models: DEFAULT_PRICING_MODELS,
    };
  }

  async getCatalogByVersion(version: string): Promise<PricingCatalog | null> {
    try {
      const found = await this.catalogModel
        .findOne({ catalogVersion: version })
        .lean();
      if (found) return found as unknown as PricingCatalog;
    } catch (err) {
      this.logger.debug(`Error getting catalog by version: ${err.message}`);
    }

    if (version === DEFAULT_CATALOG_VERSION) {
      return {
        catalogVersion: DEFAULT_CATALOG_VERSION,
        effectiveFrom: new Date('2026-01-01T00:00:00Z'),
        effectiveTo: null,
        currency: 'USD',
        isCurrent: true,
        models: DEFAULT_PRICING_MODELS,
        notes: 'In-memory default',
      };
    }

    return null;
  }

  async listCatalogVersions(): Promise<
    Array<{
      catalogVersion: string;
      effectiveFrom: Date;
      effectiveTo: Date | null;
      isCurrent: boolean;
      modelCount: number;
    }>
  > {
    try {
      const list = await this.catalogModel
        .find()
        .sort({ effectiveFrom: -1 })
        .lean();
      if (list && list.length > 0) {
        return list.map((c) => ({
          catalogVersion: c.catalogVersion,
          effectiveFrom: c.effectiveFrom,
          effectiveTo: c.effectiveTo,
          isCurrent: c.isCurrent,
          modelCount: c.models.length,
        }));
      }
    } catch (err) {
      this.logger.debug(`Error listing catalog versions: ${err.message}`);
    }

    return [
      {
        catalogVersion: DEFAULT_CATALOG_VERSION,
        effectiveFrom: new Date('2026-01-01T00:00:00Z'),
        effectiveTo: null,
        isCurrent: true,
        modelCount: DEFAULT_PRICING_MODELS.length,
      },
    ];
  }

  async getModel(
    modelId: string,
    catalogVersion?: string,
  ): Promise<ModelPricingEntry | undefined> {
    if (catalogVersion) {
      const catalog = await this.getCatalogByVersion(catalogVersion);
      if (catalog) {
        const found = catalog.models.find((m) => m.modelId === modelId);
        if (found) return found;
      }
    }

    // Check memory catalog
    if (this.memoryCatalog.has(modelId)) {
      return this.memoryCatalog.get(modelId);
    }

    // Case-insensitive or normalized check
    const normalized = modelId.toLowerCase().trim();
    for (const [key, value] of this.memoryCatalog.entries()) {
      if (
        key.toLowerCase() === normalized ||
        normalized.includes(key.toLowerCase()) ||
        key.toLowerCase().includes(normalized)
      ) {
        return value;
      }
    }

    return undefined;
  }

  async computeCost(
    modelId: string,
    promptTokens: number,
    completionTokens: number,
    catalogVersion?: string,
  ): Promise<CostCalculationResult> {
    const version = catalogVersion || DEFAULT_CATALOG_VERSION;
    const model = await this.getModel(modelId, version);

    if (!model) {
      // Conservative estimate if unknown model
      const promptCost = (promptTokens / 1000) * 0.001;
      const completionCost = (completionTokens / 1000) * 0.002;
      return {
        modelId,
        provider: 'unknown',
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        promptCostUsd: Number(promptCost.toFixed(6)),
        completionCostUsd: Number(completionCost.toFixed(6)),
        totalCostUsd: Number((promptCost + completionCost).toFixed(6)),
        catalogVersion: version,
        isEstimate: true,
        pricingSource: 'FALLBACK_DEFAULTS',
      };
    }

    const promptCost = (promptTokens / 1000) * model.promptCostPer1k;
    const completionCost = (completionTokens / 1000) * model.completionCostPer1k;
    const totalCost = promptCost + completionCost;

    return {
      modelId: model.modelId,
      provider: model.provider,
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      promptCostUsd: Number(promptCost.toFixed(6)),
      completionCostUsd: Number(completionCost.toFixed(6)),
      totalCostUsd: Number(totalCost.toFixed(6)),
      catalogVersion: version,
      isEstimate: true,
      pricingSource: 'CONFIGURED_CATALOG',
    };
  }
}
