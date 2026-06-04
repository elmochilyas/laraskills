# Knowledge Unit: OpenRouter Multi-Model Gateway

## Metadata

- **ID:** KU-003
- **Subdomain:** LLM Provider Abstraction & Integration
- **Slug:** openrouter-multi-model-gateway
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

OpenRouter provides a single API endpoint that proxies requests to 300+ models across multiple providers. In the Laravel AI SDK, OpenRouter is configurable as a provider driver, enabling multi-model access via one API key, centralized billing, automatic failover, and price-based load balancing. Eliminates the need to manage separate API keys and client configurations per provider.

## Core Concepts

- Single endpoint: `https://openrouter.ai/api/v1/chat/completions`
- 300+ models from 20+ providers behind one API
- Automatic provider failover — if primary provider is down, OpenRouter routes to alternative provider hosting same model
- Price-based load balancing — defaults to cheapest available provider for the requested model
- BYOK (Bring Your Own Key) — use your own provider keys for discount pricing
- Per-request provider ordering via `provider.order` parameter
- `partition: "none"` for cross-provider BYOK routing

## Mental Models

- **API gateway for LLMs**: Like Kong or AWS API Gateway for microservices — single entry point, routing, auth, rate limiting, observability.
- **Multi-cloud for AI**: Abstract provider diversity behind one endpoint — avoid vendor lock-in, optimize for cost/availability.

## Internal Mechanics

OpenRouter's routing engine evaluates:
1. Provider order preference (if specified)
2. BYOK key availability (prioritizes providers with user keys)
3. Price-based load balancing (default — routes to cheapest)
4. Provider health (skips degraded providers)
5. Fallback chain (iterates until successful response)

The Laravel AI SDK's OpenRouter driver sets `Authorization: Bearer <OPENROUTER_API_KEY>` and sends standard chat completion format. OpenRouter translates to provider-specific formats server-side.

## Patterns

- **Single-key management**: One `OPENROUTER_API_KEY` env var replaces 14 separate provider keys
- **Model rotation via prefix**: `openai/gpt-4o`, `anthropic/claude-sonnet-4`, `mistral/mistral-large` — model strings include provider prefix
- **Cost optimization**: Use cheapest available provider for non-critical paths by not specifying provider order

## Architectural Decisions

- **Decision**: OpenRouter as provider vs. as middleware → First-class provider driver in Laravel AI SDK. Reason: OpenRouter supports streaming, tool calling, and structured output — full API parity.
- **Decision**: Client-side failover vs. OpenRouter server-side → Use OpenRouter's built-in failover for simple cases; add client-side circuit breaker (llm-router) for critical paths.

## Tradeoffs

- **Single point of failure**: OpenRouter outage = all models unavailable. Mitigation: Configure direct provider drivers as fallback in application code.
- **Latency overhead**: OpenRouter adds ~50-200ms proxy latency per request. Acceptable for most use cases; direct provider calls preferred for latency-critical paths.
- **Data privacy**: All prompts transit OpenRouter servers. For GDPR/HIPAA data, use direct provider integration or local LLM.

## Performance Considerations

- OpenRouter adds 50-200ms proxy overhead vs. direct provider API calls
- Caching at application layer reduces impact for repeated queries
- Streaming responses have minimal additional latency (time-to-first-token increase only)

## Production Considerations

- Set `OPENROUTER_API_KEY` in environment — OpenRouter billing is usage-based
- Configure `OPENROUTER_BASE_URL` for custom proxy/deployment scenarios
- Monitor OpenRouter dashboard for usage, cost, and error rates
- Implement application-level circuit breaker for SLA-critical paths
- Fall back to direct provider drivers if OpenRouter is degraded

## Common Mistakes

- Using OpenRouter for all traffic without fallback to direct provider — creates single point of failure
- Not setting `partition: "none"` when using BYOK across providers — router may not use your keys correctly
- Assuming all 300+ models support tool calling and streaming — check model capabilities on OpenRouter site
- Hardcoding provider ordering for cost optimization — defeats OpenRouter's price-based load balancing

## Failure Modes

- **OpenRouter API outage**: All AI features degrade — implement health checks and automatic provider fallback
- **BYOK key expiration**: OpenRouter falls back to billed routing — unexpected cost increase
- **Model deprecation**: OpenRouter removes a model — switch to alternative model string
- **Rate limiting**: OpenRouter enforces per-account limits — distribute load across multiple accounts

## Ecosystem Usage

- Development: Use OpenRouter to test across models without multiple accounts
- Production: Route non-sensitive traffic through OpenRouter; critical/private traffic through direct providers
- Multi-tenant: Use BYOK to let tenants use their own API keys while still getting OpenRouter's routing benefits

## Related Knowledge Units

- KU-002: Multi-Provider Text Generation
- KU-004: Provider Failover & Circuit Breaker
- KU-010: AI Middleware & Gateway Architecture

## Research Notes

- OpenRouter Laravel AI SDK integration documented at https://docs.laravel.com/13.x/ai-sdk
- OpenRouter provider for Vercel AI SDK also available (@openrouter/ai-sdk-provider) — reference implementation
- OpenRouter supports image inputs, tool calling, structured output (JSON mode)
- Price-based load balancing is the default routing strategy (not round-robin)
