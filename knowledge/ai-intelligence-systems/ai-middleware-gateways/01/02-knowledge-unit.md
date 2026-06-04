# Knowledge Unit: AI Gateway Fundamentals

## Metadata

- **ID:** ku-01
- **Subdomain:** AI Middleware & Gateways
- **Slug:** ai-gateway-fundamentals
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

An **AI Gateway** (or AI Middleware/Gateway) is a proxy layer that sits between application code and LLM providers. It handles routing, rate limiting, authentication, caching, observability, and failover â€” concerns that would otherwise be duplicated across every integration. In the Laravel AI ecosystem, the `laravel/ai` SDK itself serves as a lightweight gateway, with production deployments typically adding a dedicated gateway layer (e.g., LiteLLM, Portkey, custom middleware) for advanced routing and observability.

## Core Concepts

- **Provider Abstraction:** The gateway presents a unified API (chat completions, embeddings, tool calling) while translating to each provider's native format.
- **Request Routing:** Incoming requests are routed to the appropriate provider based on model, latency, cost, or availability.
- **Rate Limiting:** Per-user, per-key, or per-application limits enforced at the gateway before reaching the LLM provider.
- **Caching:** Semantic caching of LLM responses for identical or similar requests, reducing cost and latency.
- **Fallback/Failover:** When the primary provider returns an error or times out, the gateway retries with a secondary provider.
- **Observability:** Every request is logged with latency, tokens, cost, and status code for monitoring and billing.
- **Key Management:** The gateway manages API keys centrally, rotating secrets and enforcing per-key quotas.

## Mental Models

- **Provider Abstraction:** The gateway presents a unified API (chat completions, embeddings, tool calling) while translating to each provider's native format.
- **Request Routing:** Incoming requests are routed to the appropriate provider based on model, latency, cost, or availability.
- **Rate Limiting:** Per-user, per-key, or per-application limits enforced at the gateway before reaching the LLM provider.


## Internal Mechanics

The internal mechanics of AI Gateway Fundamentals follow established patterns within the AI Middleware & Gateways domain. The implementation leverages the Laravel AI SDK conventions and ecosystem best practices.

- **Route by task type, not by model name.** Define routing rules (e.g., "chat": gpt-4o, "embed": text-embedding-3-small, "summarize": claude-3-haiku).
- **Implement semantic caching** with configurable similarity thresholds (default 0.95 for exact, 0.85 for semantic).
- **Set per-provider rate limits** that match your subscription tier. The gateway should queue or fail before hitting provider rate limits.
- **Log every request and response** (with PII redaction) for debugging and cost allocation.
- **Use health checks** to detect provider outages and automatically switch to fallback providers.

## Patterns

- **Route by task type, not by model name.** Define routing rules (e.g., "chat": gpt-4o, "embed": text-embedding-3-small, "summarize": claude-3-haiku).
- **Implement semantic caching** with configurable similarity thresholds (default 0.95 for exact, 0.85 for semantic).
- **Set per-provider rate limits** that match your subscription tier. The gateway should queue or fail before hitting provider rate limits.
- **Log every request and response** (with PII redaction) for debugging and cost allocation.
- **Use health checks** to detect provider outages and automatically switch to fallback providers.

## Architectural Decisions

- Deploy the gateway as a **separate service** (microservice or sidecar) to enforce consistency across all applications.
- Use a **plugin/middleware architecture** where features (caching, rate limiting, logging) are composable middleware layers.
- The gateway should be **stateless** for horizontal scaling; state (rate limit counters, cache) lives in Redis.
- Implement a **circuit breaker** pattern: after N consecutive failures, stop routing to that provider for a cooldown period.
- For Laravel, the gateway can be a middleware on the HTTP client or a dedicated service class injected into the AI SDK.

## Tradeoffs

Standard approach vs Custom implementation is the primary tradeoff in this KU. Standard implementations offer faster development and community support but may have overhead. Custom implementations provide tailored solutions at the cost of maintenance burden.

## Performance Considerations

- Gateway overhead should be <50ms (typically 5-20ms). Profile and optimize hot paths (serialization, routing logic).
- Caching reduces median latency by 40-80% for cached requests. Hit rates of 20-40% are common for production traffic.
- Rate limiting with Redis is ~1ms per check. For high-throughput systems, use local counters with periodic sync.
- Batching: the gateway can batch multiple embedding requests into a single provider call for efficiency.
- Connection pooling: reuse HTTP connections to providers to reduce TLS handshake overhead.

## Production Considerations

- **API key storage:** Never log or expose API keys. Store in secrets manager (Vault, AWS Secrets Manager) with rotation.
- **Request/response logging:** Redact sensitive fields (API keys, PII) before writing logs.
- **Authentication:** Require API tokens or mTLS for applications connecting to the gateway.
- **Data residency:** Route requests to provider endpoints in the appropriate geographic region for compliance.
- **Rate limit bypass:** Ensure rate limiting is enforced server-side, not just client-side.

## Common Mistakes

- Not implementing provider failover â€” a provider outage takes down the entire application.
- Building custom gateway logic that duplicates what `laravel/ai` already provides.
- Caching LLM responses without considering PII â€” cached responses may leak user data to other users.
- Using the gateway as a single point of failure â€” deploy with redundancy and health checks.
- Over-caching: caching dynamic or time-sensitive requests produces stale responses.

## Failure Modes

- **Gateway as Monolith:** The gateway handles routing, caching, logging, billing, and user management. Split into focused services.
- **Tight Coupling to Provider SDKs:** The gateway should use raw HTTP or a provider-agnostic interface, not provider SDKs.
- **Blind Failover:** Switching providers without considering model behavior differences â€” the backup model may produce different quality outputs.
- **Infinite Retries:** The gateway retries failed requests forever. Implement max retry count with dead-letter queue.
- **Logging Everything:** Storing full request/response bodies for every call creates data retention and cost issues. Sample or truncate.

## Ecosystem Usage

### Gateway Routing Rule
```php
$rules = [
    'chat' => ['provider' => 'openai', 'model' => 'gpt-4o', 'fallback' => 'anthropic/claude-3-opus'],
    'embed' => ['provider' => 'openai', 'model' => 'text-embedding-3-small'],
    'summarize' => ['provider' => 'anthropic', 'model' => 'claude-3-haiku'],
];
```

### Middleware Pipeline
```php
$gateway = new AIGateway();
$gateway->pipe(new AuthenticationMiddleware($apiKeys));
$gateway->pipe(new RateLimitMiddleware($redis, 100, 60));
$gateway->pipe(new CacheMiddleware($redis, similarityThreshold: 0.85));
$gateway->pipe(new LoggingMiddleware($logger, redactFields: ['api_key', 'user.email']));
$gateway->pipe(new FailoverMiddleware($fallbackProviders, maxRetries: 2));
```

## Related Knowledge Units

- ku-02 (Load Balancing & Failover): Advanced routing strategies.
- ku-03 (API Key Management): Secure key storage and rotation.
- ku-04 (Request/Response Transformation): Modifying requests and responses at the gateway.
- ku-05 (Observability & Monitoring): Metrics and logging for the gateway.
- llm-provider-abstraction/ku-01: Provider-level abstractions the gateway builds on.

## Research Notes

Source: Domain analysis for AI and Intelligence Systems (Laravel/PHP ecosystem)
Source: Laravel AI SDK documentation and ecosystem package references

