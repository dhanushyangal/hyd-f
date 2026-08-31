import type { ConnectorPublic } from "@/lib/api";

/** Used if GET /api/user/api-keys omits `connectors` (older API). */
export const FALLBACK_CONNECTORS: ConnectorPublic[] = [
  {
    id: "anthropic",
    name: "Anthropic",
    product: "Claude API",
    docsUrl: "https://platform.claude.com/settings/keys",
    keyPlaceholder: "sk-ant-...",
  },
  {
    id: "openai",
    name: "OpenAI",
    product: "API",
    docsUrl: "https://platform.openai.com/api-keys",
    keyPlaceholder: "sk-...",
  },
  {
    id: "google",
    name: "Google",
    product: "Gemini API",
    docsUrl: "https://aistudio.google.com/apikey",
    keyPlaceholder: "AIza...",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    product: "",
    docsUrl: "https://openrouter.ai/settings/keys",
    keyPlaceholder: "sk-or-v1-...",
  },
  {
    id: "cursor",
    name: "Cursor",
    product: "Cloud Agents API",
    docsUrl: "https://cursor.com/dashboard/api",
    keyPlaceholder: "key_...",
  },
];
