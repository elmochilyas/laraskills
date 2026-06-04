# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-authentication-authorization
**Knowledge Unit:** IP-Based Rate Limiting
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] IP-Based Rate Limiting implementation follows api-authentication-authorization patterns
- [ ] All edge cases handled for IP-Based Rate Limiting
- [ ] Full test coverage for IP-Based Rate Limiting
- [ ] Security review completed for IP-Based Rate Limiting
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for IP-Based Rate Limiting

---

# Architecture Checklist

- [ ] IP-based limiting runs early in the middleware stack, before controllers and authentication.
- [ ] Cache (Redis) is required for rate limit counters. File-based caching is unreliable with concurrent requests.
- [ ] For high-traffic APIs, use Redis with INCR + EXPIRE atomic operations.
- [ ] Compound keys prevent collisions: prefix keys with type (`ip:`, `user:`).
- [ ] Evaluate: Rate Limit Key Strategy â€” IP-Only vs Compound User/IP
- [ ] Evaluate: IPv6 Handling for Rate Limit Keys
- [ ] Evaluate: IP-Based Limiting for Unauthenticated vs Authenticated Routes

---

# Implementation Checklist

- [ ] IP-based limiters defined with `$request->ip()`
- [ ] Trusted proxies configured for correct IP detection
- [ ] IP limiters applied to guest/unauthenticated routes
- [ ] Separated from authenticated user limits
- [ ] Lower limits for sensitive endpoints
- [ ] 429 with Retry-After header
- [ ] IP rate limit events logged
- [ ] Tests simulate different IPs
- [ ] Blocked IP patterns monitored for false positives
- [ ] IP detection works behind load balancers (X-Forwarded-For)
- [ ] Implement IP-Based Rate Limiting following api-authentication-authorization patterns
- [ ] Configure all required settings for IP-Based Rate Limiting
- [ ] Register route/middleware/service for IP-Based Rate Limiting
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] One cache INCR lookup per request â€” sub-millisecond with Redis.
- [ ] CIDR matching is O(1) per rule. With <100 rules, overhead is irrelevant.
- [ ] IPv4/IPv6 branching cost is negligible.
- [ ] For very high traffic, use Redis pipelining for rate limit counter operations.
- [ ] IP whitelist checks should use pre-loaded config, not database queries.

---

# Security Checklist

- [ ] `X-Forwarded-For` can be spoofed. Only trust from known proxies. Configure load balancer to strip incoming headers.
- [ ] IP-based limiting is trivially bypassed with VPNs, proxies, and IPv6 rotation.
- [ ] A single NAT gateway can block an entire office if one user hits the limit.
- [ ] Forwarded IP spoofing: attacker sends `X-Forwarded-For: 127.0.0.1` to bypass limits.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Write feature tests for happy path of IP-Based Rate Limiting
- [ ] Write feature tests for validation failure of IP-Based Rate Limiting
- [ ] Write feature tests for authentication failure of IP-Based Rate Limiting
- [ ] Write unit tests for service/action/DTO classes
- [ ] Test edge cases: empty results, boundary values, null inputs

---

# Maintainability Checklist

- [ ] Follow PSR-12 coding standards
- [ ] Use type hints on all methods and properties
- [ ] Keep methods under 15 lines
- [ ] Use meaningful class and method names
- [ ] Add PHPDoc for public API methods

---

# Anti-Pattern Prevention Checklist

- [ ] Avoid tight coupling between layers
- [ ] Avoid business logic in controllers
- [ ] Avoid skipping validation layers

---

# Production Readiness Checklist

- [ ] Add structured logging for all operations
- [ ] Configure monitoring alerts for error rate spikes
- [ ] Implement health check endpoint
- [ ] Document rollback procedure
- [ ] Set up error tracking integration
- [ ] Configure proper CORS for production

---

# Final Approval Checklist

- [ ] Architecture checklist complete
- [ ] Security checklist complete
- [ ] Performance checklist complete
- [ ] Testing checklist complete
- [ ] Anti-pattern prevention checklist complete
- [ ] Production readiness checklist complete
- [ ] All items resolved before merge

---

# Related Knowledge

### Rules
- Always Configure TrustProxies Behind Load Balancers
- Use Compound Keys: User ID for Authenticated, IP for Guests
- Normalize IPv6 to /64 Prefix
- Prefix Rate Limit Keys by Type
- Whitelist Monitoring Endpoints and Monitor Them
- Apply IP-Based Limits Early in Middleware Stack
- Never Use $_SERVER['REMOTE_ADDR'] Directly
- Use Stricter Limits for Login Endpoints
- Validate X-Forwarded-For from Trusted Proxies Only

### Decisions
- Rate Limit Key Strategy â€” IP-Only vs Compound User/IP
- IPv6 Handling for Rate Limit Keys
- IP-Based Limiting for Unauthenticated vs Authenticated Routes

## Related Knowledge
- Prerequisites
- Closely Related
- Advanced
- Cross-Domain



