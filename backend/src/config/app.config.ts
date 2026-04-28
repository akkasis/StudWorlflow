const DEFAULT_DEV_JWT_SECRET = 'dev_jwt_secret_change_me';

function normalizeOrigin(origin: string) {
  return origin.trim().replace(/\/$/, '');
}

function parseOrigins(value?: string) {
  if (!value) {
    return ['http://localhost:3000', 'http://127.0.0.1:3000'];
  }

  return value
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean);
}

export const appConfig = {
  nodeEnv: process.env.NODE_ENV || 'development',
  host: process.env.HOST || '0.0.0.0',
  port: Number(process.env.PORT || 3001),
  appBaseUrl: (process.env.APP_BASE_URL || 'http://localhost:3000').trim().replace(/\/$/, ''),
  jwtSecret: process.env.JWT_SECRET || DEFAULT_DEV_JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigins: parseOrigins(process.env.CORS_ORIGIN),
  resendApiKey: process.env.RESEND_API_KEY || '',
  emailFrom:
    process.env.EMAIL_FROM ||
    process.env.SMTP_FROM ||
    'Skillent <no-reply@skillent.local>',
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpUser: process.env.SMTP_USER || '',
  smtpPassword: process.env.SMTP_PASSWORD || '',
  smtpFrom: process.env.SMTP_FROM || 'no-reply@skillent.local',
  s3Endpoint: (process.env.S3_ENDPOINT || '').trim().replace(/\/$/, ''),
  s3Region: (process.env.S3_REGION || '').trim(),
  s3Bucket: (process.env.S3_BUCKET || '').trim(),
  s3AccessKeyId: (process.env.S3_ACCESS_KEY_ID || '').trim(),
  s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
  s3PublicBaseUrl: (
    process.env.S3_PUBLIC_BASE_URL ||
    ''
  ).trim().replace(/\/$/, ''),
  rootAdminEmail:
    process.env.ROOT_ADMIN_EMAIL || 'admin@skillent.local',
  rootAdminPassword:
    process.env.ROOT_ADMIN_PASSWORD || 'skillent-admin',
};

export function getJwtModuleOptions() {
  return {
    global: true,
    secret: appConfig.jwtSecret,
    signOptions: {
      expiresIn: appConfig.jwtExpiresIn as unknown as number,
    },
  };
}
