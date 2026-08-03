import dotenv from "dotenv";

dotenv.config();

export const env = {
  PORT: Number(process.env.PORT) || 3000,

  NODE_ENV: process.env.NODE_ENV || "development",

  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  GEMINI_MODEL: process.env.GEMINI_MODEL || "gemini-2.5-flash",

  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || "",
  OPENROUTER_MODEL:
    process.env.OPENROUTER_MODEL || "openai/gpt-4.1-mini",

  // BYOK Encryption Secret
  BYOK_ENCRYPTION_SECRET:
    process.env.BYOK_ENCRYPTION_SECRET ||
    "helix-development-encryption-secret-change-in-production",
};

// Minimal runtime validation for production-like environments
const isProductionLike =
  env.NODE_ENV === "production" ||
  process.env.ENV_STRICT === "1";

function isNonEmptyKey(k: string | undefined): boolean {
  if (!k) return false;

  const v = String(k).trim();

  return v.length >= 15;
}

if (isProductionLike) {
  let ok = true;

  const errors: string[] = [];

  if (!isNonEmptyKey(env.GEMINI_API_KEY)) {
    ok = false;

    errors.push(
      "[CONFIG] GEMINI_API_KEY missing or too short in production-like environment; must be a real API key (~15+ chars)."
    );
  }

  if (!isNonEmptyKey(env.OPENROUTER_API_KEY)) {
    ok = false;

    errors.push(
      "[CONFIG] OPENROUTER_API_KEY missing or too short in production-like environment; must be a real API key (~15+ chars)."
    );
  }

  if (!isNonEmptyKey(env.BYOK_ENCRYPTION_SECRET)) {
    ok = false;

    errors.push(
      "[CONFIG] BYOK_ENCRYPTION_SECRET missing or too short in production-like environment."
    );
  }

  if (!ok) {
    console.error(...errors);
    process.exit(1);
  }
}