import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import configuration from './config/configuration';

import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { UsageModule } from './modules/usage/usage.module';
import { BudgetsModule } from './modules/budgets/budgets.module';
import { RoutingModule } from './modules/routing/routing.module';
import { QualityGatesModule } from './modules/quality-gates/quality-gates.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { SeedModule } from './modules/seed/seed.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('mongodb.uri'),
        serverSelectionTimeoutMS: 3000,
        connectTimeoutMS: 3000,
        retryWrites: true,
        autoIndex: true,
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get<number>('throttle.ttl', 60) * 1000,
          limit: configService.get<number>('throttle.limit', 100),
        },
      ],
      inject: [ConfigService],
    }),
    IntegrationsModule,
    HealthModule,
    AuthModule,
    PricingModule,
    UsageModule,
    BudgetsModule,
    RoutingModule,
    QualityGatesModule,
    SeedModule,
  ],
})
export class AppModule {}
