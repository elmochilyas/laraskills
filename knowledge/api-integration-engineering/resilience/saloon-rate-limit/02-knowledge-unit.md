# Metadata
Domain: API Integration Engineering
Subdomain: Resilience & Reliability Patterns
Knowledge Unit: Rate Limit Plugin for SaloonPHP
Difficulty Level: Advanced
Last Updated: 2026-06-02

## Executive Summary
SaloonPHP's rate limit plugin provides a declarative, configurable rate limiting layer for API connectors. It implements the token bucket algorithm using configurable limit stores (Cache, Redis, in-memory) and supports backpressure through automatic request queuing when limits are exceeded. The plugin integrates natively with Saloon's middleware pipeline, enabling per-connector rate limit configuration that respects upstream API constraints.

## Core Concepts
- **RateLimitStore**: Persistence layer for tracking rate limit state (Cache, Redis, Array, custom)
- **Token Bucket Implementation**: Configurable `$maxAttempts` (bucket capacity) and `$interval` (refill period)
- **Backpressure**: When limit exceeded, requests are queued and sent when tokens become available
- **Response-Aware Limiting**: Extract rate limit headers from upstream responses to synchronize local state
- **Connector-Level Configuration**: Rate limits configured per connector, not globally
- **ThrottleSleeper**: Strategy for waiting when rate limited (sleep vs release, configurable)

## Mental Models
- **Traffic Cop**: The rate limit plugin acts as a traffic cop, only allowing requests through at the permitted rate
- **Token Vending Machine**: Tokens are dispensed at a fixed interval; if machine is empty, wait for next token
- **Rate Limit Buffer**: The plugin buffers requests and smooths them to match upstream capacity

## Internal Mechanics
- The plugin intercepts requests in Saloon's middleware pipeline before they reach Guzzle
- On each request, it checks the `LimitStore` for available capacity
- If capacity exists, it decrements the counter and allows the request through
- If capacity is exhausted, it uses the `ThrottleSleeper` to wait until a token is available
- Responses are inspected for rate limit headers (`X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After`)
- Response headers can update the local rate limit state to stay in sync with the upstream server
- The limit store persists state across requests (using Laravel Cache or Redis for distributed scenarios)

## Patterns
- **Per-Connector Configuration**: Configure rate limits in the connector's `defaultConfig()` method
- **Response Sync**: Enable response header sync to keep local state aligned with upstream limits
- **Backpressure with Queue Integration**: Use the plugin with queued jobs; jobs release back when rate limited
- **Custom Limit Stores**: Implement `RateLimitStore` interface for custom persistence (database, DynamoDB)
- **Conservative Budget**: Set connector limit to 70-80% of upstream limit to buffer against traffic variability
- **Graceful Degradation**: When rate limited, queue the request for later processing instead of failing

## Architectural Decisions
- Configure rate limits per connector, not globally, to match each API's specific limits
- Enable response header synchronization for accurate real-time limit tracking
- Use `CacheRateLimitStore` in production for distributed state across workers
- Use `ArrayRateLimitStore` in tests for fast, isolated rate limit simulation
- Set limits conservatively (80% of published upstream limit) to avoid 429 responses
- Combine rate limit plugin with retry plugin: retry handles the rare 429 that slips through

## Tradeoffs
- Plugin adds latency per request (check rate limit state); typically 1-5ms with Redis
- Backpressure (waiting for tokens) increases per-request latency but improves reliability
- Response header sync adds accuracy but depends on server returning consistent headers
- Conservative limits reduce 429 risk but may underutilize available capacity
- Custom limit stores increase complexity but provide flexibility for specialized requirements

## Performance Considerations
- Rate limit store lookup: ~1-5ms for Redis, sub-millisecond for in-memory
- Backpressure waiting: adds delay equal to time until next token (up to interval period)
- Response header parsing: negligible overhead (~0.1ms)
- The plugin executes before the HTTP call; Open state overhead is a single cache read
- Rate limit state persistence adds minimal write load (one write per request for some stores)

## Production Considerations
- Use `CacheRateLimitStore` with Redis driver for distributed rate limit state across workers
- Monitor rate limit headroom per connector via `X-RateLimit-Remaining` tracking
- Set up alerts when headroom drops below 20% of limit (indicates approaching capacity)
- Log rate limit state changes to identify usage patterns and plan capacity increases
- Test rate limit behavior under load to validate configuration
- Update rate limit configuration when upstream API limits change

## Common Mistakes
- Setting a single global rate limit when multiple connectors have different limits
- Not enabling response header sync, causing local state to drift from upstream reality
- Using `ArrayRateLimitStore` in production (state is lost between requests)
- Setting limits too aggressively (close to upstream cap), causing frequent 429 responses
- Forgetting to install the plugin on the connector, leaving requests without rate protection
- Configuring the plugin without testing upstream behavior first (limits may differ from documentation)

## Failure Modes
- Cache outage: rate limit store unavailable; plugin may allow all requests or fail closed
- Limit store race condition: concurrent requests may slightly exceed the configured limit
- Upstream changes rate limits without notice; plugin configuration becomes stale
- Header sync failure: upstream doesn't return consistent `X-RateLimit-*` headers
- Backpressure timeout: waiting for tokens exceeds the request timeout
- Memory leak with `ArrayRateLimitStore` in long-running processes (state accumulates)

## Ecosystem Usage
- SaloonPHP rate limit plugin is one of the official plugins maintained alongside the core library
- Compatible with Guzzle and all Saloon connectors; works with Laravel and framework-agnostic setups
- Used alongside cache, pagination, OAuth2, and DTO plugins for comprehensive API integration
- The plugin's `LimitStore` abstraction allows swapping between cache, Redis, and custom backends
- Community extends the plugin with specialized stores (database-backed, Redis-backed with Lua scripts)

## Related Knowledge Units
- K008: Rate Limiting Algorithms (token bucket, sliding window, fixed window)
- K010: SaloonPHP Connector/Request/Response Pattern (plugin host)
- K005: Retry Strategies (rate-limited requests should be retried with appropriate delay)
- K007: Circuit Breaker Pattern (complementary; rate limits should not trip circuit breaker)
- K017: Concurrency Pools (rate limits constrain concurrency)

## Research Notes
- Saloon documentation provides rate limit plugin configuration examples for common scenarios
- The plugin uses the token bucket algorithm internally for smooth rate enforcement
- Response-aware limiting is a key feature: it adjusts the local limit store based on upstream headers
- The plugin supports both proactive (local token bucket) and reactive (429 response handling) rate limiting
- Saloon's plugin architecture enables combination with other plugins in the middleware pipeline
