import dotenv from "dotenv";

dotenv.config();

export const env = {
  PORT: Number(process.env.PORT) || 3000,
  NODE_ENV: process.env.NODE_ENV || "development",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  GEMINI_MODEL: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || "",
  OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || "openai/gpt-4.1-mini",
};

// Minimal runtime validation for production-like environments
// In production, scream and exit if keys are missing, empty, or obviously bogus to avoid accidental usage/spend
const isProductionLike = env.NODE_ENV === "production" || process.env.ENV_STRICT === "1";

function isNonEmptyKey(k: string | undefined): boolean {
  if (!k) return false;
  const v = String(k).trim();
  return v.length >= 15; // simple bar for non-placeholder keys
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

  if (!ok) {
    console.error(...errors);
    process.exit(1);
  }
}