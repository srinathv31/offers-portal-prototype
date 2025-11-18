import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

/**
 * Get the AI model based on the AI_PROVIDER environment variable.
 * Supports hot-swapping between OpenAI and Anthropic providers.
 *
 * @returns AI SDK model instance
 */
export function getAIModel() {
  const provider = process.env.AI_PROVIDER?.toLowerCase() || "lmstudio";

  switch (provider) {
    case "openai":
      // Use GPT-4o for structured output generation
      return openai("gpt-4o");

    case "anthropic":
      // Use Claude 3.5 Sonnet for structured output generation
      return anthropic("claude-3-5-sonnet-20241022");

    case "lmstudio":
    case "local":
      // Use local LM Studio instance
      const lmstudio = createOpenAICompatible({
        name: "lmstudio",
        baseURL: "http://192.168.7.108:1234/v1",
        apiKey: "lm-studio", // Dummy API key for local LLM
      });
      return lmstudio("gpt-oss-20b");

    default:
      console.warn(`Unknown AI_PROVIDER: ${provider}, defaulting to LM Studio`);
      const defaultLms = createOpenAICompatible({
        name: "lmstudio",
        baseURL: "http://192.168.7.108:1234/v1",
        apiKey: "lm-studio", // Dummy API key for local LLM
      });
      return defaultLms("gpt-oss-20b");
  }
}

/**
 * Get the current provider name for logging/debugging
 */
export function getProviderName(): string {
  return process.env.AI_PROVIDER?.toLowerCase() || "lmstudio";
}
