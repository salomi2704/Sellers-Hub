export interface AppEnvironment {
  apiPort: number;
  frontendOrigin: string;
  jwtSecret: string;
}

export const getRequiredEnv = (key: string, fallback: string) => process.env[key] ?? fallback;
