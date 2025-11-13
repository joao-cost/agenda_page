import "dotenv/config";

function getEnv(key: string, fallback?: string) {
  const value = process.env[key];
  if (!value || value.length === 0) {
    if (fallback !== undefined) {
      return fallback;
    }
    throw new Error(`Variável de ambiente ${key} não configurada.`);
  }
  return value;
}

function getEnvOptional(key: string, fallback = "") {
  const value = process.env[key];
  if (!value || value.length === 0) {
    return fallback;
  }
  return value;
}

export const env = {
  nodeEnv: getEnv("NODE_ENV", "development"),
  port: Number(getEnv("PORT", "3000")),
  databaseUrl: getEnv("DATABASE_URL"),
  jwtSecret: getEnv("JWT_SECRET"),
  whatsappApiUrl: getEnvOptional("WHATSAPP_API_URL"),
  whatsappApiToken: getEnvOptional("WHATSAPP_API_TOKEN"),
  whatsappDefaultRecipient: getEnvOptional("WHATSAPP_DEFAULT_RECIPIENT"),
  clientBaseUrl: getEnv("CLIENT_BASE_URL", "http://localhost:5173")
};

