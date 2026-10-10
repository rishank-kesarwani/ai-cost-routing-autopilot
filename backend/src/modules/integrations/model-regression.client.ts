import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface RegressionCheckRequest {
  project: string;
  version: string;
  datasetId: string;
  datasetVersion: string;
  model: string;
  provider: string;
  promptVersion: string;
  baselineId: string;
  metrics: string[];
  correlationId?: string;
}

export interface MetricRegression {
  metricName: string;
  category: string;
  direction: 'HIGHER_IS_BETTER' | 'LOWER_IS_BETTER';
  baselineValue: number;
  candidateValue: number;
  delta: number;
  relativeDeltaPercent: number;
  warnThresholdPercent: number;
  failThresholdPercent: number;
  decision: 'PASS' | 'WARN' | 'FAIL';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  unit: string;
  explanation: string;
}

export interface RegressionCheckResult {
  verified: boolean;
  status: 'PASS' | 'WARN' | 'FAIL' | 'UNVERIFIED';
  runId?: string;
  summary?: {
    passed: number;
    warnings: number;
    failed: number;
  };
  regressions?: MetricRegression[];
  error?: string;
}

@Injectable()
export class ModelRegressionClient {
  private readonly logger = new Logger(ModelRegressionClient.name);
  private readonly client: AxiosInstance;
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>(
      'modelRegression.url',
      'http://localhost:4000',
    );
    this.apiKey = this.configService.get<string>(
      'modelRegression.apiKey',
      'model_regression_service_api_key_12345',
    );

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 8000,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
      },
    });
  }

  async checkRegression(
    req: RegressionCheckRequest,
    operatorPolicy: 'FAIL_CLOSED' | 'MARK_UNVERIFIED' = 'FAIL_CLOSED',
  ): Promise<RegressionCheckResult> {
    try {
      this.logger.log(
        `[Model Regression Service] Querying ${this.baseUrl}/api/v1/regression/check for model ${req.model} (Baseline: ${req.baselineId})`,
      );

      const response = await this.client.post<any>(
        '/api/v1/regression/check',
        req,
        {
          headers: req.correlationId
            ? { 'X-Correlation-ID': req.correlationId }
            : {},
        },
      );

      const resData = response.data?.data || response.data;
      if (resData && resData.status) {
        return {
          verified: true,
          status: resData.status,
          runId: resData.runId,
          summary: resData.summary,
          regressions: resData.regressions || [],
        };
      }

      throw new Error('Malformed response payload from regression service');
    } catch (err: any) {
      this.logger.warn(
        `[Model Regression Service] Quality check unreachable (${err.message}). Enforcing operator policy: ${operatorPolicy}`,
      );

      // NEVER silently treat missing quality result as PASS!
      if (operatorPolicy === 'FAIL_CLOSED') {
        return {
          verified: false,
          status: 'FAIL',
          error: `Regression service unreachable (${err.message}). Strict quality gate failed closed.`,
          summary: { passed: 0, warnings: 0, failed: 1 },
          regressions: [
            {
              metricName: 'quality_gate_reachability',
              category: 'SAFETY_GATE',
              direction: 'HIGHER_IS_BETTER',
              baselineValue: 1.0,
              candidateValue: 0.0,
              delta: -1.0,
              relativeDeltaPercent: -100.0,
              warnThresholdPercent: -10.0,
              failThresholdPercent: -20.0,
              decision: 'FAIL',
              severity: 'CRITICAL',
              unit: 'boolean',
              explanation:
                'Operator policy is set to FAIL_CLOSED: Missing external regression verification cannot be approved.',
            },
          ],
        };
      }

      // MARK_UNVERIFIED
      return {
        verified: false,
        status: 'UNVERIFIED',
        error: `Regression service unreachable (${err.message}). Gate marked UNVERIFIED per operator policy.`,
        summary: { passed: 0, warnings: 1, failed: 0 },
        regressions: [],
      };
    }
  }

  async checkHealth(): Promise<{ status: 'HEALTHY' | 'UNAVAILABLE'; latencyMs: number }> {
    const start = Date.now();
    try {
      await this.client.get('/health', { timeout: 3000 });
      return { status: 'HEALTHY', latencyMs: Date.now() - start };
    } catch {
      return { status: 'UNAVAILABLE', latencyMs: Date.now() - start };
    }
  }
}
