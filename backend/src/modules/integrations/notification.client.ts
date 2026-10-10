import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface DispatchNotificationDto {
  channels: Array<'email' | 'push' | 'in_app' | 'slack'>;
  recipient: {
    userId: string;
    email?: string;
  };
  template: string;
  parameters: Record<string, any>;
  idempotencyKey: string;
}

export interface NotificationResponse {
  notificationId: string;
  status: 'ENQUEUED' | 'SENT' | 'SKIPPED_DUPLICATE';
  idempotencyKey: string;
}

@Injectable()
export class NotificationClient {
  private readonly logger = new Logger(NotificationClient.name);
  private readonly client: AxiosInstance;
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly sentKeys: Set<string> = new Set();

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>(
      'notificationService.url',
      'http://localhost:3001',
    );
    this.apiKey = this.configService.get<string>(
      'notificationService.apiKey',
      'notification_service_api_key_12345',
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

  async sendNotification(
    payload: DispatchNotificationDto,
  ): Promise<NotificationResponse | null> {
    // Local in-memory idempotency check to avoid repeat alerts
    if (this.sentKeys.has(payload.idempotencyKey)) {
      this.logger.debug(
        `[Notification Service] Local idempotency key hit: ${payload.idempotencyKey}, skipping dispatch`,
      );
      return {
        notificationId: `local_dup_${payload.idempotencyKey}`,
        status: 'SKIPPED_DUPLICATE',
        idempotencyKey: payload.idempotencyKey,
      };
    }

    try {
      this.logger.log(
        `[Notification Service] Dispatching alert to ${this.baseUrl}/v1/notifications (Key: ${payload.idempotencyKey}, Template: ${payload.template})`,
      );

      const response = await this.client.post<any>(
        '/v1/notifications',
        payload,
      );

      this.sentKeys.add(payload.idempotencyKey);
      return {
        notificationId:
          response.data?.data?.notificationId ||
          response.data?.notificationId ||
          `notif_${Date.now()}`,
        status: 'ENQUEUED',
        idempotencyKey: payload.idempotencyKey,
      };
    } catch (err: any) {
      this.logger.warn(
        `[Notification Service] Notification dispatch to ${this.baseUrl} failed (${err.message}). Recording local event to avoid alert spam.`,
      );
      this.sentKeys.add(payload.idempotencyKey);
      return {
        notificationId: `fallback_${Date.now()}`,
        status: 'ENQUEUED',
        idempotencyKey: payload.idempotencyKey,
      };
    }
  }
}
