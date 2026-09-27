# Water agents stay in-process AI SDK; Cloud stays non-agent

Water generate already calls Vercel AI SDK `generateText` with customer keys. We keep that as the only LLM loop for Water, wrap the frozen 12 Create tool ids as AI SDK `tool()`, and add hidden Director / Scene / QA modules next to `runStudioPipeline`. eve `create-water` stays frozen off Generate. Google ADK is not installed.

Cloud (`/api/3d/*`, credits, Trellis, `engine = trilles`) is not an agent product. No Director, Scene IR, or Water chat is imported into Cloud routes. `agent/agents/create-cloud` is left on disk and unwired.

**Status:** accepted
