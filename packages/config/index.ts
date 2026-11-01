export interface AppEnvironment {
  apiPort: number;
  frontendOrigin: string;
  jwtSecret: string;
  databaseUrl: string;
  redisUrl: string;
  minioEndpoint: string;
  minioRootUser: string;
  minioRootPassword: string;
}

export const getRequiredEnv = (key: string, fallback: string) => process.env[key] ?? fallback;
export const getEnv = (key: string, defaultValue: string = '') => process.env[key] || defaultValue;
