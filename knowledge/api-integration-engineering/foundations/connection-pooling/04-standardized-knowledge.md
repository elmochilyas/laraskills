# ECC Standardized Knowledge — Connection Pooling

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | http-client-api-consumption |
| Knowledge Unit ID | ku-07 |
| Knowledge Unit | Connection Pooling |
| Difficulty | Advanced |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K017, K002, K001 |

## Overview (Engineering Value)
Connection pooling reduces HTTP call latency by reusing TCP connections across multiple requests to the same host, eliminating the TCP handshake (1-2 RTT) and TLS negotiation overhead for each request after the first. Guzzle's `CurlMultiHandler` manages connection reuse automatically when the same client instance is reused. Laravel's `Http::pool()` enables concurrent requests with connection reuse, reducing total wall-clock time for multiple independent API calls. Proper pool management prevents socket exhaustion and respects upstream connection limits.

## Core Concepts
- **TCP Connection Reuse**: Keep-alive connections reused across requests to the same host
- **Connection Pool**: Set of persistent TCP connections managed per Guzzle client instance
- **Concurrent Requests**: Multiple simultaneous HTTP requests via `curl_multi_exec()`
- **Concurrency Limit**: Maximum simultaneous connections per host (default 6 in cURL)
- **Response Aggregation**: Correlating concurrent responses back to their originating requests
- **Partial Failure Handling**: Individual failures in a pool don't affect other concurrent requests

## When To Use
- Multiple requests to the same API host (connection reuse saves handshake overhead)
- Independent parallel requests that can execute concurrently
- High-throughput integrations where latency matters

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
- Connection reuse saves 1-2 RTT (50-200ms) per subsequent request to same host
- Each concurrent connection uses a file descriptor; monitor for EMFILE limits
- Response buffering: all in-flight response bodies held in memory until consumed

## Common Mistakes
- Creating new connector instance per request (loses connection pooling benefit)
- Using concurrency for sequential-dependent requests (wasteful)
- Concurrency too high for rate-limited APIs (causing 429 errors)
- Not handling individual pool request errors (uncaught promise rejections)
- Assuming pool response order matches request order (use named keys)

## Related Topics
- **Prerequisites**: TCP/HTTP fundamentals, Guzzle basics
- **Closely Related**: HTTP client wrapper (ku-01), rate limit avoidance (ku-04)
- **Advanced**: cURL multi-handle optimization, HTTP/2 multiplexing
- **Cross-Domain**: Network optimization, socket management

## Verification
- [ ] Same connector instance reused across requests to a host
- [ ] Pool concurrency configured based on upstream capacity
- [ ] Pool timeout configured for bounded execution
- [ ] Named keys used for response correlation
- [ ] Individual pool request errors handled gracefully
