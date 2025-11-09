import { createOpenAI } from "@ai-sdk/openai";

type Provider = "openai" | "lmstudio";

/**
 * Gets the configured AI provider based on environment variables.
 * Defaults to LM Studio for local development.
 */
export function getAIProvider() {
  const provider = (process.env.AI_PROVIDER || "lmstudio") as Provider;

  if (provider === "lmstudio") {
    const baseURL =
      process.env.LM_STUDIO_BASE_URL || "http://192.168.7.108:1234/v1";

    return createOpenAI({
      baseURL,
      // LM Studio doesn't require an API key, but some implementations might
      apiKey: process.env.LM_STUDIO_API_KEY || "lm-studio",
    });
  }

  // OpenAI provider
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY environment variable is required when using OpenAI provider"
    );
  }

  return createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

/**
 * Gets the model name to use based on environment variables.
 */
export function getAIModel(): string {
  return process.env.AI_MODEL || "gpt-oss-20b";
}
