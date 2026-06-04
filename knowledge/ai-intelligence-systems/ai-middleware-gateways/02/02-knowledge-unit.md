# Knowledge Unit: Load Balancing & Failover Strategies

## Metadata

- **ID:** ku-02
- **Subdomain:** AI Middleware & Gateways
- **Slug:** load-balancing---failover-strategies
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

Load balancing distributes LLM API requests across multiple providers, models, or endpoints to optimize for cost, latency, and reliability. Failover strategies ensure that when a provider returns an error or becomes unavailable, traffic is redirected to a healthy provider without application-level impact. Together, these strategies form the reliability backbone of an AI gateway. In the Laravel AI ecosystem, load balancing is implemented in the gateway layer using configurable routing rules and health checks.

## Core Concepts

- **Provider Pool:** A set of configured providers with their models, rate limits, and priority weights.
- **Routing Strategy:** Algorithm for selecting which provider handles a request â€” round-robin, weighted random, lowest latency, or lowest cost.
- **Health Check:** Periodic probe to verify a provider is responding. Unhealthy providers are excluded from the pool.
- **Circuit Breaker:** After N consecutive failures, the provider is temporarily removed from the pool for a cooldown period.
- **Fallback Chain:** Ordered list of providers to try if the primary fails. Each fallback is tried in sequence.
- **Graceful Degradation:** When all premium providers are down, the gateway may fall back to a cheaper or less capable model.
- **Sticky Sessions:** Routing the same user's requests to the same provider for consistency (relevant for conversational models).

## Mental Models

- **Provider Pool:** A set of configured providers with their models, rate limits, and priority weights.
- **Routing Strategy:** Algorithm for selecting which provider handles a request â€” round-robin, weighted random, lowest latency, or lowest cost.
- **Health Check:** Periodic probe to verify a provider is responding. Unhealthy providers are excluded from the pool.


## Internal Mechanics

The internal mechanics of Load Balancing & Failover Strategies follow established patterns within the AI Middleware & Gateways domain. The implementation leverages the Laravel AI SDK conventions and ecosystem best practices.

- **Set health check intervals** at 30-60 seconds â€” too frequent may trigger rate limits, too infrequent delays failover.
- **Use circuit breakers with exponential backoff** for provider errors. Reset after successful request.
- **Test failover paths regularly.** A failover that has never been tested will fail in production.
- **Consider semantic equivalence.** When failing over to a different model, verify the output quality is comparable.
- **Log every failover event** â€” it indicates a reliability issue that may need investigation.

## Patterns

- **Set health check intervals** at 30-60 seconds â€” too frequent may trigger rate limits, too infrequent delays failover.
- **Use circuit breakers with exponential backoff** for provider errors. Reset after successful request.
- **Test failover paths regularly.** A failover that has never been tested will fail in production.
- **Consider semantic equivalence.** When failing over to a different model, verify the output quality is comparable.
- **Log every failover event** â€” it indicates a reliability issue that may need investigation.

## Architectural Decisions

- Implement routing strategies as **strategy classes** implementing `RoutingStrategy` interface.
- Store provider health status in a **shared cache (Redis)** so all gateway instances share the same view.
- Use **separate connection pools** per provider to avoid head-of-line blocking.
- For cost optimization, implement a **cost-aware router** that tracks per-request spend and routes cheaper tasks to cheaper models.
- Consider **latency-based routing** for user-facing requests and **cost-based routing** for batch/background requests.

## Tradeoffs

Standard approach vs Custom implementation is the primary tradeoff in this KU. Standard implementations offer faster development and community support but may have overhead. Custom implementations provide tailored solutions at the cost of maintenance burden.

## Performance Considerations

- Health checks add overhead â€” use lightweight requests (e.g., a simple chat completion with a tiny model).
- Circuit breaker state changes should be async â€” don't block requests waiting for health checks.
- Failover adds latency equal to the original request timeout (usually 10-30s). Optimize timeouts to fail fast.
- Weighted random routing is O(1); latency-based routing requires recent metrics and is O(n).
- Connection pooling per provider: ~10-50 connections per provider is typical.

## Production Considerations

- **Failover to untrusted providers:** Ensure all providers in the pool meet your security and compliance requirements.
- **Health check endpoints:** Don't expose internal health check mechanisms to providers.
- **Provider credential isolation:** Each provider's API keys should be stored and accessed separately to minimize blast radius.
- **Audit failover decisions:** Log why a failover occurred (timeout, error code, circuit open) for compliance.
- **Sticky sessions and data isolation:** Ensure user data is not routed to providers in restricted regions.

## Common Mistakes

- Not configuring a fallback â€” when the primary provider goes down, all requests fail.
- Using too short a circuit breaker cooldown â€” the provider may still be recovering, causing repeated failures.
- Assuming all models produce equivalent outputs â€” test failover quality before enabling automatic failover.
- Performing health checks against non-production endpoints (e.g., hitting the billing API instead of the chat endpoint).
- Not monitoring failover frequency â€” frequent failovers indicate a chronic issue with the primary provider.

## Failure Modes

- **Failover Cascade:** Primary â†’ Fallback1 â†’ Fallback2 â†’ ... â†’ FallbackN. Each hop adds latency. Limit to 2-3 fallbacks.
- **Health Check Noise:** Unnecessary health checks that waste provider quota. Use passive health detection (real request failures) supplemented by periodic active checks.
- **Provider Starvation:** A routing algorithm that never selects a particular provider. Ensure all providers in the pool get traffic proportional to their weight.
- **Hardcoded Fallback Order:** The fallback order should be configurable and differ by task type.

## Ecosystem Usage

### Routing Strategy Interface
```php
interface RoutingStrategy {
    public function select(array $pool, RequestContext $context): ProviderEndpoint;
}

class WeightedRandomStrategy implements RoutingStrategy {
    public function select(array $pool, RequestContext $context): ProviderEndpoint {
        // Select based on configured weights
        $total = array_sum(array_map(fn($p) => $p->weight, $pool));
        $rand = mt_rand(1, $total);
        $cumulative = 0;
        foreach ($pool as $provider) {
            $cumulative += $provider->weight;
            if ($rand <= $cumulative) return $provider;
        }
        return $pool[0];
    }
}
```

### Circuit Breaker Config
```php
$circuitBreaker = new CircuitBreaker(
    $redis,
    failureThreshold: 5,
    cooldownSeconds: 30,
    halfOpenMaxRequests: 3,
);
```

## Related Knowledge Units

- ku-01 (AI Gateway Fundamentals): Gateway architecture that uses these strategies.
- ku-05 (Observability & Monitoring): Monitoring failover events and provider health.
- llm-provider-abstraction/ku-03: Provider-specific reliability considerations.
- cost-management-observability/ku-02: Cost-aware routing strategies.

## Research Notes

Source: Domain analysis for AI and Intelligence Systems (Laravel/PHP ecosystem)
Source: Laravel AI SDK documentation and ecosystem package references

