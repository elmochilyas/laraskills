# ECC Standardized Knowledge — IP-Based Rate Limiting

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Authentication & Authorization |
| Knowledge Unit | IP-Based Rate Limiting |
| Difficulty | Intermediate |
| Category | Rate Limiting |
| Last Updated | 2026-06-02 |

## Overview

IP-based rate limiting restricts requests from a single IP address within a time window. It serves as the first defense layer against DDoS attacks, web scrapers, and brute-force login attempts. Because it requires no authentication, it applies to all requests including unauthenticated ones. However, IP addresses are unreliable identifiers due to NAT, VPNs, and IPv6 range rotation, making this a coarse filter rather than a precise control.

## Core Concepts

- **`$request->ip()`**: Client IP from `X-Forwarded-For` when behind a trusted proxy; `REMOTE_ADDR` otherwise.
- **TrustProxies middleware**: Required when behind load balancers. Without it, IP-based limiting blocks the proxy IP.
- **IPv6 /64 normalization**: A single user can rotate through billions of IPv6 addresses. Normalize to /64 for meaningful limits.
- **CIDR matching**: Network prefix-based matching for whitelists and blocklists.
- **Whitelist**: IPs or CIDR ranges exempt from rate limiting (monitoring, internal services).

## When To Use

- Guest/unauthenticated endpoint protection
- Login form brute-force prevention
- Web scraper mitigation
- First line of defense before authentication-based rate limiting
- API endpoints consumed by server-side applications with static IPs

## When NOT To Use

- Authenticated user endpoints (use user-ID-based limits instead — IP limits penalize NAT users unfairly)
- Mobile app APIs (IPv6 addresses rotate constantly — use token-based limits)
- Office/enterprise APIs where all employees share a single public IP
- Premium user endpoints (may access from multiple IPs)
- When combined with user-based limits without fallback logic (double rate limiting)

## Best Practices

- **Authenticated users key by user ID**: Fall back to IP only for guest requests. Compound key: `$request->user() ? 'user:'.$request->user()->id : 'ip:'.$request->ip()`.
- **Always configure TrustProxies**: Without it behind a load balancer, the rate limiter blocks the proxy IP, not the client.
- **Normalize IPv6 to /64**: Take the first 64 bits of the IPv6 address as the rate limit key.
- **Whitelist monitoring**: Log every whitelisted request. A compromised internal IP bypassing rate limits must be detected.
- **CIDR blocklisting**: Maintain a dynamic blocklist of known abusive IP ranges.

## Architecture Guidelines

- IP-based limiting runs early in the middleware stack, before controllers and authentication.
- Cache (Redis) is required for rate limit counters. File-based caching is unreliable with concurrent requests.
- For high-traffic APIs, use Redis with INCR + EXPIRE atomic operations.
- Compound keys prevent collisions: prefix keys with type (`ip:`, `user:`).

## Performance Considerations

- One cache INCR lookup per request — sub-millisecond with Redis.
- CIDR matching is O(1) per rule. With <100 rules, overhead is irrelevant.
- IPv4/IPv6 branching cost is negligible.
- For very high traffic, use Redis pipelining for rate limit counter operations.
- IP whitelist checks should use pre-loaded config, not database queries.

## Security Considerations

- `X-Forwarded-For` can be spoofed. Only trust from known proxies. Configure load balancer to strip incoming headers.
- IP-based limiting is trivially bypassed with VPNs, proxies, and IPv6 rotation.
- A single NAT gateway can block an entire office if one user hits the limit.
- Forwarded IP spoofing: attacker sends `X-Forwarded-For: 127.0.0.1` to bypass limits.

## Common Mistakes

- **Using `$_SERVER['REMOTE_ADDR']` behind a load balancer**: Rate limiter blocks the proxy IP.
- **Not configuring TrustProxies**: All IPs appear as the load balancer IP.
- **No IPv6 handling**: IPv6 allows billion-address rotation, trivially bypassing /128-based limits.
- **IP limits for authenticated users**: NAT users unfairly penalized.
- **Whitelisted IPs not monitored**: A compromised whitelisted IP has no rate limit protection.

## Anti-Patterns

- **Using IP as the sole rate limit identifier**: IP addresses are unreliable. Combine with other signals (user ID, token, device fingerprint).
- **Same limit for all endpoints**: Login endpoints need stricter limits (5/min) than public data endpoints (30/min).
- **Applying IP limits after resource-intensive operations**: Check early in middleware to reject before DB queries.

## Examples

- Guest limiter: `RateLimiter::for('guest', fn($request) => Limit::perMinute(30)->by('ip:'.$request->ip()))`.
- Login limiter: `RateLimiter::for('login', fn($request) => Limit::perMinute(5)->by('login:'.$request->ip()))`.
- IPv6 normalization: Extract `/64` prefix from IPv6 address for rate limit key.

## Related Topics

- **Prerequisites**: IP networking (IPv4, IPv6, CIDR), Laravel TrustProxies middleware
- **Closely Related**: Rate Limiting by Auth Tier, Rate Limiter Definition, Rate Limit Headers
- **Advanced**: IP reputation services (MaxMind), GeoIP-based rate limiting, behavioral rate limiting
- **Cross-Domain**: Security & Identity Engineering

## AI Agent Notes

When generating IP-based rate limiting: use compound keys (user ID for authenticated, IP for guests), normalize IPv6 to /64, always configure TrustProxies behind load balancers, prefix keys with type, whitelist monitoring endpoints.

## Verification

Sources: Laravel `TrustProxies` middleware, Symfony `Request::getClientIp()`, domain-analysis.md (authentication section).
