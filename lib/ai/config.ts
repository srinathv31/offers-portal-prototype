import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";

/**
 * Get the AI model based on the AI_PROVIDER environment variable.
 * Supports hot-swapping between OpenAI and Anthropic providers.
 *
 * @returns AI SDK model instance
 */
export function getAIModel() {
  const provider = process.env.AI_PROVIDER?.toLowerCase() || "openai";

  switch (provider) {
    case "openai":
      // Use GPT-4o for structured output generation
      return openai("gpt-4o");

    case "anthropic":
      // Use Claude 3.5 Sonnet for structured output generation
      return anthropic("claude-3-5-sonnet-20241022");

    default:
      console.warn(`Unknown AI_PROVIDER: ${provider}, defaulting to OpenAI`);
      return openai("gpt-4o");
  }
}

/**
 * Get the current provider name for logging/debugging
 */
export function getProviderName(): string {
  return process.env.AI_PROVIDER?.toLowerCase() || "openai";
}

