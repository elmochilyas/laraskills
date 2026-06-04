# ECC Standardized Knowledge — Guzzle HTTP Client Internals and Configuration

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | http-client-api-consumption |
| Knowledge Unit ID | ku-02 |
| Knowledge Unit | Guzzle HTTP Client Internals and Configuration |
| Difficulty | Advanced |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K017, K001, K016 |

## Overview (Engineering Value)
Guzzle is Laravel's underlying HTTP client. Understanding its internals — handler stack, middleware chain, curl multi-handle, connection pooling, and configuration options — is critical for optimizing performance and debugging. The handler stack is a deque of middleware handlers wrapping the final curl handler, allowing custom middleware insertion.

## Core Concepts
- **Handler Stack**: The ordered list of middleware handlers wrapping the final curl handler
- **Middleware**: Functions that intercept requests/responses to add logging, retries, auth, etc.
- **cURL Multi-Handle**: Low-level libcurl handle for concurrent HTTP/1.1 requests
- **Connection Pool**: Reused TCP connections per host via `keep-alive` header
- **HandlerStack**: A deque data structure where middleware wraps the core handler
- **cURL Options**: Direct cURL constants like CURLOPT_TIMEOUT, CURLOPT_CONNECTTIMEOUT
- **Middleware Priority**: Order matters — each middleware wraps the previous one

## When To Use
- Custom behavior between sending and receiving (logging, metrics, retry)
- Performance tuning requiring fine-grained control
- Debugging obscure HTTP client issues

## When NOT To Use
- Standard HTTP calls with no custom middleware needed
- When SaloonPHP connectors suffice

## Best Practices
- Prefer Guzzle's built-in middleware over raw cURL options for composability
- Use `tap()` and `HandlerStack::create()` for clean stack creation
- Always push retry middleware after auth middleware
- Avoid mutable state inside middleware closures
- Keep middleware stateless and side-effect-free where possible

## Architecture Guidelines
- Single Guzzle client per service with shared handler stack
- Push monitoring middleware as outer layers (first pushed, last executed)
- Auth middleware as inner layer (last pushed, first executed)
- Handler stack manipulation only at client construction time, not during requests

## Performance Considerations
- cURL multi-handle overhead is negligible for concurrent requests
- Connection reuse reduces latency by 1-2 RTT per subsequent request
- Handler stack adds ~0.1ms per middleware per request
- cURL option CURLOPT_TCP_NODELAY disables Nagle's algorithm for latency-sensitive calls
- CURLOPT_TIMEOUT bounds total request time; CURLOPT_CONNECTTIMEOUT bounds TCP handshake

## Common Mistakes
- Pushing middleware in wrong order (auth after retry causes auth on each retry)
- Using global handler stack mutation affecting other services
- Not using `tap()` for clean stack composition
- Mutable state in middleware causing race conditions
- Overwriting default cURL options instead of merging

## Related Topics
- **Prerequisites**: PHP cURL extension, HTTP protocol basics
- **Closely Related**: Laravel Http facade, connection pooling, concurrency pools
- **Advanced**: cURL Multi API, HTTP/2 multiplexing, TCP socket tuning
- **Cross-Domain**: Network optimization, performance monitoring

## Verification
- [ ] Handler stack created per service, not globally mutated
- [ ] Middleware order correct (auth inside retry, monitoring outside)
- [ ] Guzzle client configured with appropriate timeouts
- [ ] Connection pool configured with max connections per host
- [ ] TCP_NODELAY enabled for latency-sensitive calls
