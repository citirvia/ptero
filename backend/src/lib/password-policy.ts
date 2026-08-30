const COMMON_PASSWORDS = new Set([
  "12345678",
  "123456789",
  "1234567890",
  "admin123",
  "changeme123",
  "dragon123",
  "iloveyou123",
  "letmein123",
  "password",
  "password1",
  "password12",
  "password123",
  "password1234",
  "pterobot123",
  "qwerty123",
  "welcome123",
]);

export function getPasswordPolicyError(
  password: string,
  context?: {
    email?: string | null;
    name?: string | null;
    username?: string | null;
  },
) {
  const normalized = password.trim();
  const lower = normalized.toLowerCase();
  if (COMMON_PASSWORDS.has(lower)) {
    return "Choose a less common password.";
  }

  const emailLocal = context?.email?.split("@")[0]?.toLowerCase().trim();
  if (emailLocal && emailLocal.length >= 3 && lower.includes(emailLocal)) {
    return "Password must not contain your email name.";
  }

  const username = context?.username?.toLowerCase().trim();
  if (username && username.length >= 3 && lower.includes(username)) {
    return "Password must not contain your username.";
  }

  const parts = (context?.name ?? "")
    .toLowerCase()
    .split(/\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 3);

  if (parts.some((part) => lower.includes(part))) {
    return "Password must not contain your name.";
  }

  return null;
}
