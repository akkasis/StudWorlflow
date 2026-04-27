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
  jwtSecret: process.env.JWT_SECRET || DEFAULT_DEV_JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigins: parseOrigins(process.env.CORS_ORIGIN),
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
