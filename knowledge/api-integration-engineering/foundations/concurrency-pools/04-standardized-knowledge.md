# ECC Standardized Knowledge — Concurrency Control with Pools and Async Requests

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | http-client-api-consumption |
| Knowledge Unit ID | ku-07 |
| Knowledge Unit | Concurrency Control with Pools and Async Requests |
| Difficulty | Advanced |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K017, K001, K002, K008, K005 |

## Overview (Engineering Value)
Concurrent HTTP requests reduce total wall-clock time for multiple independent API calls by executing them in parallel. Laravel's Http facade provides `pool()` for concurrent requests using Guzzle's curl multi-handle, and SaloonPHP extends this with its own pool API. Proper concurrency control prevents resource exhaustion, respects upstream rate limits, and handles partial failures gracefully.

## Core Concepts
- **Connection Pooling**: Reusing TCP connections across requests to the same host reduces handshake overhead
- **Concurrent Requests**: Multiple HTTP requests in-flight simultaneously via curl multi-handle
- **Response Aggregation**: Collecting and correlating responses from parallel requests back to their originating request
- **Partial Failure Handling**: Individual request failures in a pool don't affect other concurrent requests
- **Concurrency Limits**: Maximum simultaneous connections per host (default 6 in cURL, configurable)
- **Request Promise**: Each request returns a promise that resolves when its response arrives

## When To Use
- Multiple independent API calls that can execute concurrently
- High-throughput integrations where latency matters
- Dashboard/composite endpoints aggregating data from multiple services

## When NOT To Use
- Sequential-dependent requests (each depends on previous response)
- Single requests per operation (no pooling benefit)
- Rate-limited APIs where concurrency would trigger limits

## Best Practices
- Reuse the same Guzzle client instance (or Saloon connector) for all requests to a host
- Set conservative concurrency (5-10) for rate-limited APIs, higher (25-50) for internal services
- Use `Http::pool()` with named keys for response correlation
- Implement timeout for the entire pool to bound execution time
- Separate pools per upstream service to isolate failure domains

## Architecture Guidelines
- Single connector instance per service (singleton binding in container)
- Pool configuration in connector or service class, not per-call
- Named pool results for deterministic response mapping
- Circuit breaker around pools for upstream service degradation

## Performance Considerations
- Wall-clock time for N independent requests with concurrency C: ~ceil(N/C) × avg_latency
- Connection reuse saves 1-2 RTT per subsequent request to same host
- Each concurrent connection uses a file descriptor; monitor for EMFILE limits
- Response buffering: all in-flight response bodies held in memory until consumed

## Common Mistakes
- Using concurrency for requests that have data dependencies (indeterminate ordering bugs)
- Setting concurrency too high for rate-limited upstream APIs causing 429 errors
- Not handling individual pool request errors (uncaught promise rejections)
- Assuming pool response order matches request order (use named keys)
- Concurrency on sequential-dependent requests (Amdahl's law: limited benefit)

## Related Topics
- **Prerequisites**: Laravel Http facade, Guzzle basics, rate limiting algorithms
- **Closely Related**: Connection pooling, circuit breaker, rate limit avoidance
- **Advanced**: Guzzle Pool internals, cURL multi-handle optimization, HTTP/2 multiplexing
- **Cross-Domain**: Network optimization, socket management

## Verification
- [ ] Same connector instance reused across requests to a host
- [ ] Pool concurrency configured based on upstream capacity
- [ ] Pool timeout configured for bounded execution
- [ ] Named keys used for response correlation
- [ ] Individual pool request errors handled gracefully
- [ ] Separate pools per upstream service for failure isolation
