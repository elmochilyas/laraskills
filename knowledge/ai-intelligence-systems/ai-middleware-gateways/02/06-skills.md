# Skill: Load Balance Across AI Providers with Failover

## Purpose
Distribute LLM API requests across multiple providers and models using configurable routing strategies (weighted random, lowest latency, lowest cost) with automatic failover, circuit breakers, and shared health state for high availability.

## When To Use
- Production applications that cannot tolerate provider downtime
- Multi-region deployments requiring geo-routing to reduce latency
- Cost optimization across providers with different pricing
- A/B testing new models alongside existing ones

## When NOT To Use
- Single-provider, single-model applications (no balancing needed)
- Batch processing that can tolerate retry delays (use simple failover, not load balancing)
- When provider lock-in is acceptable and cost optimization is not a priority

## Prerequisites
- KU-01 (AI Gateway Fundamentals) — understanding of gateway routing
- Multiple provider API keys configured with quota assignments
- Redis for shared circuit breaker state
- Health check endpoint on each provider integration

## Inputs
- Provider pool configuration (providers, models, weights, regions)
- Routing strategy selection (weighted-random, latency-based, cost-based)
- Circuit breaker thresholds per provider (failure count, cooldown)
- Health check intervals and endpoints
- Failover chain per task type

## Workflow
1. **Define the provider pool**: Configure each provider with model, endpoint, API key, priority weight, rate limits, and geographic region. Include health check configuration per provider.
2. **Implement routing strategy interface**: Create a `RoutingStrategy` interface with `select(array $pool, RequestContext $context): ProviderEndpoint`. Implement strategy classes: `WeightedRandomStrategy`, `LatencyAwareStrategy`, `CostAwareStrategy`, `RoundRobinStrategy`.
3. **Configure circuit breakers per provider**: Initialize a `CircuitBreaker` for each provider with provider-specific thresholds (more lenient for 429 rate limits, stricter for 401/403 auth errors). Store state in Redis for cross-instance consistency.
4. **Implement health checks**: Set up active health checks at 30-60 second intervals using lightweight requests. Supplement with passive health detection from real request failures.
5. **Route the request**: On each request, select a provider using the configured strategy. Check circuit breaker state. If the circuit is open, skip to the next provider in the weighted pool.
6. **Handle failures**: On provider error, record the failure in the circuit breaker. If the failure count exceeds the threshold, open the circuit for the cooldown period. Retry with the next provider in the failover chain.
7. **Fall back gracefully**: Define a fallback chain (primary → secondary → tertiary). Limit to 2-3 fallback hops max. On complete failure of all fallbacks, return a graceful degradation response.
8. **Log failover events**: Every failover event must be logged with provider, error code, circuit breaker state, and fallback decision. Use these logs to tune thresholds.
9. **Test failover regularly**: Schedule monthly chaos tests that simulate provider outages and verify the failover chain works end-to-end. Use staging environments.
10. **Monitor and adjust**: Track failover frequency, circuit breaker trips, and provider health changes. Adjust thresholds based on observed provider behavior.

## Validation Checklist
- [ ] Routing strategies are interchangeable via a RoutingStrategy interface
- [ ] Circuit breaker is configured with failure threshold, cooldown, and half-open max requests
- [ ] Health checks run at configurable intervals with passive detection as supplement
- [ ] Fallback chain is defined per task type with max 2-3 fallback hops
- [ ] Failover events are logged with provider, error, and fallback decision
- [ ] Provider health status is shared across gateway instances via cache
- [ ] Failover is tested regularly (automated chaos testing, monthly minimum)

## Common Failures
- **Circuit breaker never opens**: Threshold set too high for the provider's error characteristics. Fix: set separate thresholds per error type (429 vs. 5xx) and per provider.
- **Failover cascade causes timeouts**: Trying 4 fallback providers each with 30s timeout = 120s total. Fix: limit to 2-3 fallback hops, use short timeouts for fallback attempts.
- **Health check noise triggers false failover**: Health checks against the wrong endpoint or too frequent. Fix: use passive health detection (real traffic) supplemented by occasional active checks.
- **Inconsistent health state across instances**: Circuit breaker state stored in local memory on multi-instance deployment. Fix: use Redis for shared state.
- **Failover quality mismatch**: Falling back to a cheaper model produces lower quality responses. Fix: verify semantic equivalence before enabling automatic failover.

## Decision Points
- **Weighted random vs. latency-based routing**: Weighted random for cost optimization and A/B testing. Latency-based for user-facing applications where response time is critical.
- **Active vs. passive health detection**: Active health checks at 30-60s intervals for proactive detection. Passive (real traffic failures) for zero additional cost. Use both for best coverage.
- **Failover vs. degrade**: Failover to another provider when available. Degrade to a simpler model or cached response when all providers are down.

## Performance Considerations
- Health check overhead: use lightweight requests (simple chat completion with small model)
- Circuit breaker state changes should be async (don't block requests)
- Failover adds latency equal to the original request timeout (optimize timeouts to fail fast: 5-10s for fallback)
- Weighted random routing: O(1). Latency-based routing: O(n) — requires recent metrics per provider
- Connection pooling per provider: 10-50 connections per provider

## Security Considerations
- All providers in the pool must meet the same security and compliance requirements
- Provider credentials stored separately per provider to minimize blast radius of a leak
- Log failover decisions with audit trail (why failover occurred, which provider selected)
- Ensure user data isn't routed to providers in restricted geographic regions
- Health check endpoints should not expose internal mechanisms

## Related Rules
- Test failover paths at least monthly with automated chaos testing
- Implement circuit breakers with provider-specific thresholds, not one-size-fits-all
- Share provider health status across all gateway instances via Redis

## Related Skills
- Skill: Set Up an AI Gateway with Routing, Caching, and Failover (ku-01)
- Skill: Manage API Keys Securely (ku-03)
- Skill: Monitor and Observe AI Gateway Performance (ku-05)

## Success Criteria
- Provider outage triggers failover to healthy provider within 30 seconds
- Circuit breaker opens appropriately for each provider based on its error characteristics
- Health status is consistent across all gateway instances
- Failover events are logged with full context for post-mortem analysis
- Monthly chaos tests pass without application-level impact
- Failover chain completes within 2x the normal request time limit with graceful degradation as final fallback