export default () => ({
  port: parseInt(process.env.PORT, 10) || 4000,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  publicAccessEnabled: process.env.PUBLIC_ACCESS_ENABLED === 'true' || true,
  jwt: {
    accessSecret:
      process.env.JWT_ACCESS_SECRET || 'secret_jwt_access_autopilot_2026_dev',
    refreshSecret:
      process.env.JWT_REFRESH_SECRET || 'secret_jwt_refresh_autopilot_2026_dev',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRATION || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },
  mongodb: {
    uri:
      process.env.MONGODB_URI ||
      'mongodb://localhost:27017/ai-cost-routing-autopilot',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  aiPlatform: {
    url: process.env.AI_PLATFORM_URL || 'http://localhost:5000',
    apiKey: process.env.AI_PLATFORM_API_KEY || 'platform_master_key_dev_12345',
    timeoutMs: parseInt(process.env.AI_PLATFORM_TIMEOUT_MS, 10) || 10000,
    applicationId: 'ai-cost-routing-autopilot',
  },
  notificationService: {
    url: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3001',
    apiKey:
      process.env.NOTIFICATION_SERVICE_API_KEY ||
      'notification_service_api_key_12345',
  },
  modelRegression: {
    url: process.env.MODEL_REGRESSION_SERVICE_URL || 'http://localhost:4000',
    apiKey:
      process.env.MODEL_REGRESSION_SERVICE_API_KEY ||
      'model_regression_service_api_key_12345',
  },
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL, 10) || 60,
    limit: parseInt(process.env.THROTTLE_LIMIT, 10) || 100,
  },
});
