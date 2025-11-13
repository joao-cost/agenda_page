import { prisma } from "../lib/prisma";

interface EvolutionSettings {
  domain: string;
  token: string;
  session?: string | null;
}

const EVOLUTION_KEYS = {
  domain: "evolution:domain",
  token: "evolution:token",
  session: "evolution:session"
};

const CACHE_TTL = 1000 * 60 * 5; // 5 minutos

let cachedSettings: EvolutionSettings | null = null;
let cacheExpiresAt = 0;

export async function getEvolutionSettings(forceRefresh = false): Promise<EvolutionSettings | null> {
  const now = Date.now();
  if (!forceRefresh && cachedSettings && cacheExpiresAt > now) {
    return cachedSettings;
  }

  const rows = await prisma.integrationSetting.findMany({
    where: {
      key: {
        in: Object.values(EVOLUTION_KEYS)
      }
    }
  });

  const settings: EvolutionSettings = {
    domain: rows.find((row) => row.key === EVOLUTION_KEYS.domain)?.value ?? "",
    token: rows.find((row) => row.key === EVOLUTION_KEYS.token)?.value ?? "",
    session: rows.find((row) => row.key === EVOLUTION_KEYS.session)?.value ?? ""
  };

  cachedSettings = settings;
  cacheExpiresAt = Date.now() + CACHE_TTL;

  if (!settings.domain || !settings.token) {
    return null;
  }

  return settings;
}

export function clearEvolutionSettingsCache() {
  cachedSettings = null;
  cacheExpiresAt = 0;
}

export { EVOLUTION_KEYS };



