# Knowledge Unit: Multi-Provider Text Generation

## Metadata

- **ID:** KU-002
- **Subdomain:** LLM Provider Abstraction & Integration
- **Slug:** multi-provider-text-generation
- **Version:** 1.0.0
- **Maturity:** Production-ready
- **Status:** Published

## Executive Summary

The Laravel AI SDK provides `Ai::call()` for stateless text generation and `Agent::prompt()` for stateful agent-style generation. Both are provider-agnostic — the same code works with OpenAI, Anthropic, Gemini, Groq, Mistral, DeepSeek, xAI, Ollama, or OpenRouter. Provider switching is a config change, not a code change.

## Core Concepts

- `Ai::call()`: Facade method for single-turn text generation. Accepts messages array, provider override, and model override
- `Ai::chat()`: Multi-turn chat interface with history support
- `#[Provider]` attribute: Binds agent class to specific provider driver
- `#[Model]` attribute: Specifies model string per provider
- Provider drivers: Each provider has a driver implementing `AiDriver` contract
- Request/response normalization: SDK maps provider-specific schemas to unified PHP objects
- Provider-specific features: Extended thinking (Anthropic), JSON mode (OpenAI), safety settings (Gemini)

## Mental Models

- **Database driver for AI**: Just as Laravel swaps MySQL for PostgreSQL via config, swap GPT-4 for Claude 3.5 via `.env` change.
- **HTTP client abstraction**: Feels like `Http::post()` but handles request signing, retry logic, error normalization, and streaming transparently.

## Internal Mechanics

`Ai::call()` resolves the configured provider driver from the service container. Each driver:
1. Builds provider-specific request payload from the unified message format
2. Signs the request with provider API key
3. Sends HTTP request to provider endpoint
4. Parses response into unified `AiResponse` object
5. Handles provider-specific error codes and retry logic

Custom base URLs are supported for OpenAI, Anthropic, Gemini, Groq, Cohere, DeepSeek, xAI, and OpenRouter via `config/ai.php` `url` parameter.

## Patterns

- **Provider override per call**: `Ai::call(messages: [...], provider: 'anthropic', model: 'claude-sonnet-4-20250514')`
- **Env-based routing**: `AI_PROVIDER=mistral` in `.env` switches all agents to Mistral
- **Agent-level binding**: `#[Provider('openai')]` on an agent class locks that agent to OpenAI regardless of default provider

## Architectural Decisions

- **Decision**: Unified message format vs. pass-through → Normalized PHP array format mapped to each provider's schema. Reason: Swap providers without changing prompt structure.
- **Decision**: Driver-per-provider vs. single HTTP client with routing → Each provider has a dedicated driver class. Reason: Provider APIs differ fundamentally in auth, streaming format, error codes, and capabilities.
- **Decision**: Config-first provider selection vs. code-first → Config file + env vars, with attribute overrides. Reason: 12-factor app principles; same code deploys to dev (Ollama) and prod (Anthropic).

## Tradeoffs

- **Unified abstraction vs. provider-specific features**: SDK exposes common denominator — advanced features (Anthropic extended thinking, Gemini grounding) require provider-specific config
- **Normalized errors vs. provider-specific error details**: Standard exceptions lose provider-specific error payload — inspect raw response via `$response->raw()` if needed

## Performance Considerations

- First call to each provider driver resolves and caches the driver instance
- HTTP connection pooling via Guzzle — concurrent calls reuse connections
- Response times vary 2-10x across providers for equivalent models — benchmark for latency-sensitive paths
- Token limits vary per provider — `MaxTokens` attribute caps output length

## Production Considerations

- Set retry logic at the HTTP client level (Guzzle middleware) — provider 429/503 errors are common
- Configure timeouts per provider — some providers are slower than others
- Respect provider rate limits — implement queue-based throttling for high-throughput paths
- Monitor per-provider latency and error rates — switch default provider if degradation detected
- Use custom base URLs for proxy/gateway routing (LiteLLM, Azure OpenAI Gateway)

## Common Mistakes

- Assuming all providers support the same features (e.g., tool calling, JSON mode) — check the support matrix in `config/ai.php`
- Not handling provider-specific 400 errors — malformed request for one provider works on another
- Hardcoding provider credentials in config — always use env vars
- Ignoring token limits across models — switching models without checking context window breaks prompts

## Failure Modes

- **Provider outage**: HTTP 5xx or timeout — implement failover chain in application code
- **Model rotation**: Provider deprecates a model (e.g., GPT-4 Turbo retirement) — monitor provider changelogs
- **Credential rotation**: API keys expire — use key rotation strategy (multiple keys per provider)
- **Rate limit exhaustion**: 429 responses — implement exponential backoff with jitter via queue middleware

## Ecosystem Usage

- `Ai::call()` is used for simple completions, classification, extraction, summarization
- `Agent::prompt()` used for conversational, tool-using, stateful agents
- OpenRouter as single-endpoint multi-model router — set `AI_PROVIDER=openrouter`

## Related Knowledge Units

- KU-001: Laravel AI SDK Architecture
- KU-003: OpenRouter Multi-Model Gateway
- KU-004: Provider Failover & Circuit Breaker
- KU-005: Structured Output with JSON Schema

## Research Notes

- Provider support matrix from docs: Text gen on OpenAI/Anthropic/Gemini/Azure/Bedrock/Groq/xAI/DeepSeek/Mistral/Ollama/OpenRouter
- v0.4.2+ added Cohere, Jina, VoyageAI support
- Custom base URL support critical for enterprise proxy/gateway deployments
- No first-party circuit breaker exists — community packages (llm-router) fill this gap
