# Skill: Set Up an AI Gateway with Routing, Caching, and Failover

## Purpose
Deploy a production AI gateway service that routes LLM requests by task type, enforces rate limiting, caches semantically equivalent queries, fails over between providers, and provides centralized observability — all with <50ms overhead.

## When To Use
- Multi-provider setups where different models are used for different tasks
- Production systems needing rate limiting, failover, and cost tracking
- Teams wanting centralized observability across all LLM usage
- Applications with compliance requirements (audit logs, data retention)

## When NOT To Use
- Single-provider, single-model applications in early development (direct SDK calls are simpler)
- When the gateway introduces unacceptable latency overhead (>50ms per request)
- When compliance requires direct provider API calls (certain regulated industries)
- Prototypes where the gateway adds operational complexity without benefit

## Prerequisites
- KU-01 (AI Gateway Fundamentals) — understanding of gateway concepts
- Provider API keys stored in a secrets manager
- Redis (for rate limiting, caching, and shared state)
- Infrastructure for running a separate service or middleware layer

## Inputs
- Gateway routing rules (task → provider/model mappings)
- Rate limit configurations (per key, per route, global)
- Cache configuration (similarity threshold, TTL)
- Failover chain (primary → secondary → tertiary providers)
- List of providers with API endpoints and authentication

## Workflow
1. **Define routing rules**: Create a configuration mapping task types (chat, embed, summarize) to provider/model pairs. Reference by task key, not model name. Include fallback providers per task.
2. **Implement the middleware pipeline**: Build a composable middleware chain: Authentication → Rate Limiting → Cache Check → Request Routing → Provider Call → Cache Store → Logging. Each middleware implements a single concern.
3. **Configure rate limiting**: Set per-key limits (requests per minute, tokens per day) using Redis counters. Enforce server-side. Queue or reject requests that exceed limits with clear error messages.
4. **Implement semantic caching**: Configure a semantic cache middleware that generates embeddings for incoming queries, compares against cached queries using cosine similarity (>0.95 threshold for exact, >0.85 for semantic), and serves cached responses on match.
5. **Configure failover**: Define a fallback chain per task type. Implement circuit breaker per provider (failure threshold, cooldown, half-open retries). Route to fallback when primary is unhealthy.
6. **Implement provider-agnostic request/response normalization**: Convert all requests to a standard format and translate to each provider's native schema. Normalize all responses into a unified response DTO.
7. **Set up observability**: Implement a metrics middleware that emits request count, latency histogram, token usage, cost, and status code for every request. Use structured logging with correlation IDs.
8. **Health check and monitoring**: Configure health check endpoints for the gateway itself and passive health detection for upstream providers. Set up dashboards for latency, errors, cost, and cache performance.
9. **Deploy as a stateless service**: The gateway should be horizontally scalable with Redis for shared state. Deploy behind a load balancer with health checks.
10. **Test and iterate**: Run load tests to measure gateway overhead (<50ms). Test failover scenarios by simulating provider outages. Monitor cache hit rate and adjust similarity threshold.

## Validation Checklist
- [ ] Gateway routes requests to appropriate providers based on configurable task rules
- [ ] Rate limiting is enforced server-side with configurable limits per key/route
- [ ] Semantic caching is implemented with configurable similarity threshold and TTL
- [ ] Provider failover is configured with max retries and circuit breaker
- [ ] All requests are logged with latency, tokens, cost, and status (with PII redaction)
- [ ] API keys are managed centrally and never exposed in logs
- [ ] Gateway is deployable as a stateless, horizontally scalable service

## Common Failures
- **Failover silently broken**: Fallback provider keys expired or configuration drifted. Fix: test failover paths monthly with automated chaos testing.
- **Cache returning stale data**: Semantic cache TTL too long or invalidation logic missing. Fix: set appropriate TTLs, implement manual cache invalidation.
- **Gateway becomes bottleneck**: Too many middleware layers add >100ms overhead. Fix: profile each middleware, keep hot path under 5 transforms, use async logging.
- **Rate limiting bypass**: Client can exceed limits by rotating user IDs. Fix: rate limit by API key and IP, not just user ID.
- **Inconsistent provider responses**: Different providers return different response formats. Fix: implement response normalization in the gateway pipeline.

## Decision Points
- **Separate service vs. middleware within the app**: Separate service for multi-app deployments and consistent governance. Middleware within the app for simpler single-app setups.
- **Semantic cache threshold**: 0.95 for exact/canonical answers (FAQs, policies). 0.85 for broader semantic matches. Lower threshold = higher hit rate but more false positives.
- **Circuit breaker thresholds**: More lenient for transient errors (10 failures/60s for 429s). Stricter for auth errors (2 failures/30s for 401s).

## Performance Considerations
- Gateway overhead target: <50ms (typically 5-20ms with optimal configuration)
- Semantic cache: ~1-3ms for lookup (embedding comparison), saves 1000-5000ms on cache hit
- Rate limit check: ~1ms via Redis
- Logging: async (queue or UDP) to avoid blocking the request path
- Connection pooling: reuse HTTP connections to providers (saves 100-300ms TLS handshake)
- Each middleware layer adds 0.5-5ms. Keep pipeline lean for the hot path.

## Security Considerations
- Store all API keys in a secrets manager with encryption at rest
- Redact PII from all logs before writing (use PII redaction transform middleware)
- Require authentication (API tokens or mTLS) for applications connecting to the gateway
- Enforce data residency: route requests to provider endpoints in the appropriate geographic region
- Sanitize error messages: never expose internal config or keys in error responses

## Related Rules
- Route by task type, not by model name
- Always implement provider failover with max retry limit and circuit breaker
- Implement semantic caching with configurable similarity threshold before deploying to production
- Test failover paths at least monthly with automated chaos testing
- Implement circuit breakers with provider-specific thresholds
- Share provider health status across all gateway instances via Redis

## Related Skills
- Skill: Load Balance Across AI Providers (ku-02)
- Skill: Manage API Keys Securely (ku-03)
- Skill: Transform Requests and Responses at the Gateway (ku-04)
- Skill: Monitor and Observe AI Gateway Performance (ku-05)

## Success Criteria
- Gateway overhead <50ms (p95) for all request types
- Cache hit rate >20% for production traffic
- Failover activates within 30 seconds of primary provider degradation
- Rate limiting prevents any single key from exceeding configured limits
- All requests have structured logs with correlation IDs, latency breakdown, token usage, and cost
- Gateway serves 100% of request types across all configured providers
- Zero API keys exposed in logs, error messages, or responses