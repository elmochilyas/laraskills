---
id: KU-002
title: "Multi-Provider Text Generation"
subdomain: "llm-provider-abstraction"
ku-type: "implementation"
date-created: "2026-06-02"
domain-maturity: "stable"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/01-provider-integration/multi-provider-text-generation/04-standardized-knowledge.md"
---

# Multi-Provider Text Generation

## Overview

The Laravel AI SDK provides `Ai::call()` for stateless text generation and `Agent::prompt()` for stateful agent-style generation. Both are provider-agnostic â€” the same code works with OpenAI, Anthropic, Gemini, Groq, Mistral, DeepSeek, xAI, Ollama, or OpenRouter. Provider switching is a config change, not a code change.

## Core Concepts

- `Ai::call()`: Facade method for single-turn text generation. Accepts messages array, provider override, and model override
- `Ai::chat()`: Multi-turn chat interface with history support
- `#[Provider]` attribute: Binds agent class to specific provider driver
- `#[Model]` attribute: Specifies model string per provider
- Provider drivers: Each provider has a driver implementing `AiDriver` contract
- Request/response normalization: SDK maps provider-specific schemas to unified PHP objects
- Provider-specific features: Extended thinking (Anthropic), JSON mode (OpenAI), safety settings (Gemini)

## When To Use

- Production applications requiring Multi-Provider Text Generation functionality.
- Teams building AI-powered features within Laravel applications.
- Scenarios where structured AI interactions benefit from this pattern.

## When NOT To Use

- Simple applications that can rely on direct provider calls without abstraction.
- Prototypes or experiments where this KU's overhead isn't justified.
- Use cases that don't require the specific capabilities this KU provides.

## Best Practices

- **Provider override per call**: `Ai::call(messages: [...], provider: 'anthropic', model: 'claude-sonnet-4-20250514')`
- **Env-based routing**: `AI_PROVIDER=mistral` in `.env` switches all agents to Mistral
- **Agent-level binding**: `#[Provider('openai')]` on an agent class locks that agent to OpenAI regardless of default provider

- **Database driver for AI**: Just as Laravel swaps MySQL for PostgreSQL via config, swap GPT-4 for Claude 3.5 via `.env` change.
- **HTTP client abstraction**: Feels like `Http::post()` but handles request signing, retry logic, error normalization, and streaming transparently.

## Architecture Guidelines

- **Decision**: Unified message format vs. pass-through â†’ Normalized PHP array format mapped to each provider's schema. Reason: Swap providers without changing prompt structure.
- **Decision**: Driver-per-provider vs. single HTTP client with routing â†’ Each provider has a dedicated driver class. Reason: Provider APIs differ fundamentally in auth, streaming format, error codes, and capabilities.
- **Decision**: Config-first provider selection vs. code-first â†’ Config file + env vars, with attribute overrides. Reason: 12-factor app principles; same code deploys to dev (Ollama) and prod (Anthropic).

## Performance Considerations

- First call to each provider driver resolves and caches the driver instance
- HTTP connection pooling via Guzzle â€” concurrent calls reuse connections
- Response times vary 2-10x across providers for equivalent models â€” benchmark for latency-sensitive paths
- Token limits vary per provider â€” `MaxTokens` attribute caps output length

- **Unified abstraction vs. provider-specific features**: SDK exposes common denominator â€” advanced features (Anthropic extended thinking, Gemini grounding) require provider-specific config
- **Normalized errors vs. provider-specific error details**: Standard exceptions lose provider-specific error payload â€” inspect raw response via `$response->raw()` if needed

## Security Considerations

- Set retry logic at the HTTP client level (Guzzle middleware) â€” provider 429/503 errors are common
- Configure timeouts per provider â€” some providers are slower than others
- Respect provider rate limits â€” implement queue-based throttling for high-throughput paths
- Monitor per-provider latency and error rates â€” switch default provider if degradation detected
- Use custom base URLs for proxy/gateway routing (LiteLLM, Azure OpenAI Gateway)

## Common Mistakes

- Assuming all providers support the same features (e.g., tool calling, JSON mode) â€” check the support matrix in `config/ai.php`
- Not handling provider-specific 400 errors â€” malformed request for one provider works on another
- Hardcoding provider credentials in config â€” always use env vars
- Ignoring token limits across models â€” switching models without checking context window breaks prompts

## Anti-Patterns

- **Provider outage**: HTTP 5xx or timeout â€” implement failover chain in application code
- **Model rotation**: Provider deprecates a model (e.g., GPT-4 Turbo retirement) â€” monitor provider changelogs
- **Credential rotation**: API keys expire â€” use key rotation strategy (multiple keys per provider)
- **Rate limit exhaustion**: 429 responses â€” implement exponential backoff with jitter via queue middleware

## Examples

The following ecosystem packages provide reference implementations:

- `Ai::call()` is used for simple completions, classification, extraction, summarization
- `Agent::prompt()` used for conversational, tool-using, stateful agents
- OpenRouter as single-endpoint multi-model router â€” set `AI_PROVIDER=openrouter`

## Related Topics

- KU-001: Laravel AI SDK Architecture
- KU-003: OpenRouter Multi-Model Gateway
- KU-004: Provider Failover & Circuit Breaker
- KU-005: Structured Output with JSON Schema

## AI Agent Notes

- When asked about Multi-Provider Text Generation, first determine the specific use case and requirements.
- Reference the core concepts as foundational understanding before diving into implementation.
- Consider the architecture guidelines when designing the solution.
- Review common mistakes and anti-patterns to avoid pitfalls.
- Check related topics for complementary knowledge units.

## Verification

- [ ] Core concepts are understood and applied correctly.
- [ ] Best practices from the patterns section are followed.
- [ ] Architecture guidelines are implemented.
- [ ] Performance implications are accounted for in the design.
- [ ] Security considerations are addressed.
- [ ] Production deployment follows recommended practices.
- [ ] Related KUs are consulted for additional guidance.

