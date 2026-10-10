import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BudgetsService } from './budgets.service';
import { BudgetPolicy } from './schemas/budget-policy.schema';
import { BudgetAlert } from './schemas/budget-alert.schema';
import { NotificationClient } from '../integrations/notification.client';

describe('BudgetsService', () => {
  let service: BudgetsService;

  const mockBudgetModel = {
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
    updateOne: jest.fn().mockResolvedValue({ acknowledged: true }),
  };

  const mockAlertModel = {
    findOne: jest.fn().mockResolvedValue(null),
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([]),
        }),
      }),
    }),
    create: jest.fn().mockResolvedValue({}),
  };

  const mockNotificationClient = {
    sendNotification: jest.fn().mockResolvedValue({
      notificationId: 'notif_123',
      status: 'ENQUEUED',
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetsService,
        {
          provide: getModelToken(BudgetPolicy.name),
          useValue: mockBudgetModel,
        },
        {
          provide: getModelToken(BudgetAlert.name),
          useValue: mockAlertModel,
        },
        {
          provide: NotificationClient,
          useValue: mockNotificationClient,
        },
      ],
    }).compile();

    service = module.get<BudgetsService>(BudgetsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a budget policy with correct initial spend and thresholds', async () => {
    const budget = await service.createBudget({
      name: 'Engineering Monthly Cap',
      tenantId: 'tenant-acme',
      applicationId: 'ai-pr-review-platform',
      period: 'MONTHLY',
      limitUsd: 500,
      warnThresholdPercent: 80,
      hardBlockEnabled: true,
    });

    expect(budget).toBeDefined();
    expect(budget.limitUsd).toBe(500);
    expect(budget.warnThresholdPercent).toBe(80);
    expect(budget.hardBlockEnabled).toBe(true);
    expect(budget.currentSpendUsd).toBe(0);
  });

  it('should evaluate spend and not block if within budget', async () => {
    mockBudgetModel.find.mockReturnValueOnce({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          {
            policyId: 'b1',
            name: 'Dev Cap',
            tenantId: 'tenant-acme',
            applicationId: 'ai-pr-review-platform',
            limitUsd: 100,
            warnThresholdPercent: 80,
            hardBlockEnabled: true,
            currentSpendUsd: 20,
            status: 'ACTIVE',
            currentPeriodStart: new Date(),
          },
        ]),
      }),
    });

    const result = await service.evaluateAndRecordSpend(
      'tenant-acme',
      'ai-pr-review-platform',
      'pr-summary',
      5.0,
    );

    expect(result.blocked).toBe(false);
    expect(result.matchedPolicies.length).toBe(1);
    expect(result.matchedPolicies[0].percentUsed).toBe(25);
  });

  it('should trigger hard block when spend crosses 100% and hardBlockEnabled is true', async () => {
    mockBudgetModel.find.mockReturnValueOnce({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          {
            policyId: 'b2',
            name: 'Strict Hard Block',
            tenantId: 'tenant-acme',
            applicationId: 'ai-pr-review-platform',
            limitUsd: 50,
            warnThresholdPercent: 80,
            hardBlockEnabled: true,
            currentSpendUsd: 48,
            status: 'ACTIVE',
            currentPeriodStart: new Date(),
            lastAlertTier: 'NONE',
          },
        ]),
      }),
    });

    const result = await service.evaluateAndRecordSpend(
      'tenant-acme',
      'ai-pr-review-platform',
      'pr-summary',
      10.0, // 48 + 10 = 58 > 50
    );

    expect(result.blocked).toBe(true);
    expect(result.reason).toContain('Hard budget limit exceeded');
    expect(mockNotificationClient.sendNotification).toHaveBeenCalled();
  });
});
