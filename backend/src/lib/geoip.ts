type CountryInfo = {
  country: string;
  code: string | null;
  flag: string;
};

const GEO_CACHE_TTL_MS = 1000 * 60 * 30;
const geoCache = new Map<string, { expiresAt: number; value: CountryInfo }>();

function normalizeIp(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("::ffff:")) return trimmed.slice(7);
  return trimmed;
}

function isPrivateIp(ip: string): boolean {
  return (
    ip === "::1" ||
    ip === "127.0.0.1" ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip) ||
    ip.startsWith("fc") ||
    ip.startsWith("fd") ||
    ip.startsWith("fe80:")
  );
}

function flagFromCountryCode(code: string | null): string {
  if (!code || code.length !== 2) return "🌐";
  return code
    .toUpperCase()
    .split("")
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join("");
}

export async function resolveCountryFromIp(ip: string | null | undefined): Promise<CountryInfo> {
  const normalized = normalizeIp(ip);
  if (!normalized) {
    return { country: "Unknown", code: null, flag: "🌐" };
  }
  if (isPrivateIp(normalized)) {
    return { country: "Private network", code: null, flag: "🏠" };
  }

  const cached = geoCache.get(normalized);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1500);
  try {
    const res = await fetch(`https://ipwho.is/${encodeURIComponent(normalized)}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    const data = (await res.json()) as {
      success?: boolean;
      country?: string;
      country_code?: string;
    };
    const value: CountryInfo = data.success
      ? {
          country: data.country || "Unknown",
          code: data.country_code || null,
          flag: flagFromCountryCode(data.country_code || null),
        }
      : { country: "Unknown", code: null, flag: "🌐" };
    geoCache.set(normalized, { value, expiresAt: Date.now() + GEO_CACHE_TTL_MS });
    return value;
  } catch {
    return { country: "Unknown", code: null, flag: "🌐" };
  } finally {
    clearTimeout(timeout);
  }
}
