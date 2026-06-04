# IP-Based Rate Limiting

## Metadata (Domain: API & CRUD System Engineering, Subdomain: API Authentication & Authorization, Last Updated: 2026-06-02)

## Executive Summary
IP-based rate limiting restricts the number of requests from a single IP address within a given time window. It is the most basic form of rate limiting, serving as a first line of defense against DDoS attacks, web scrapers, and brute-force login attempts. Because IP addresses are readily available (from `$request->ip()` or `$_SERVER['REMOTE_ADDR']`), IP-based limiting requires no authentication and applies to all requests — including unauthenticated ones. However, IP addresses are unreliable identifiers due to NAT, VPNs, and IPv6 address ranges.

## Core Concepts
- **`$request->ip()`**: Laravel's method to get the client IP. Returns the IP from the `X-Forwarded-For` header when behind a trusted proxy.
- **REMOTE_ADDR**: The TCP connection's source IP. Always available but may be a proxy IP, not the client IP.
- **X-Forwarded-For**: Header set by proxies/reverse proxies containing the original client IP. Must be trusted via `TrustProxies` middleware.
- **IP ranges (CIDR)**: IPv4 `/32` (single IP), `/24` (256 IPs), `/16` (65536 IPs). IPv6 `/64` is typical for a single network.
- **IPv6 complications**: A single user can have an entire `/64` subnet (18 quintillion IPs). Naive `/64`-based limiting can be bypassed trivially.
- **Whitelist**: IP addresses or ranges that are exempt from rate limiting (e.g., internal services, monitoring tools).

## Mental Models
- **IP-based limiting as neighborhood watch**: You limit activity from a specific street address (IP). If a neighbor causes trouble, the entire street is affected (collateral damage).
- **IP as house address**: The IP is like a house address. Multiple people can live in the same house (NAT). Limiting per address affects everyone inside.
- **Whitelist as VIP list**: Specific addresses that are never turned away. Like a nightclub's VIP list — they skip the line regardless of crowd size.

## Internal Mechanics
- The rate limiter key for IP-based limiting: `'ip:'.$request->ip()` or `'api:'.$request->ip()`.
- The proxy chain: `$request->ip()` returns the IP from `X-Forwarded-For` only if the proxy is listed in `$proxies` in `TrustProxies` middleware.
- Without `TrustProxies`, `$request->ip()` returns `$_SERVER['REMOTE_ADDR']` — the immediate proxy IP, not the client.
- Rate limit counter is stored in cache: `Cache::put('ip:192.168.1.1:api', 0, 60)` → `Cache::increment('ip:192.168.1.1:api')`.
- For CIDR-based limiting, extract the network prefix from the IP: `inet_pton($ip) & inet_pton($mask) === inet_pton($network)`.
- IPv6 /64-based limiting: Take the first 64 bits of the IPv6 address as the rate limit key.

## Patterns
- **Per-IP guest limiter** (most common):
  ```php
  RateLimiter::for('guest', fn ($request) =>
      Limit::perMinute(30)->by('ip:'.$request->ip())
  );
  ```
- **Per-IP login limiter** (brute-force protection):
  ```php
  RateLimiter::for('login', fn ($request) =>
      Limit::perMinute(5)->by('login:'.$request->ip())
  );
  ```
- **Per-IP with IPv6 /64 normalization**:
  ```php
  $ip = $request->ip();
  if (str_contains($ip, ':')) {
      $ip = inet_ntop(inet_pton($ip) & inet_pton('ffff:ffff:ffff:ffff::'));
  }
  ```
- **IP whitelist middleware**: Middleware that checks the request IP against a whitelist and skips rate limiting:
  ```php
  if (in_array($request->ip(), config('rate-limiting.whitelist'))) {
      return $next($request);
  }
  ```
- **CIDR whitelist check**:
  ```php
  function ipInCidr($ip, $cidr): bool {
      [$subnet, $mask] = explode('/', $cidr);
      $ipBin = inet_pton($ip);
      $subnetBin = inet_pton($subnet);
      $maskBits = -1 << (32 - (int)$mask);
      return ($ipBin & $maskBits) === ($subnetBin & $maskBits);
  }
  ```
- **Compound key (IP + User ID)**: When the user is authenticated, use a compound key to avoid user + IP conflict:
  ```php
  $key = $request->user() ? 'user:'.$request->user()->id : 'ip:'.$request->ip();
  ```

## Architectural Decisions
1. **IP vs User ID for authenticated users**: Once authenticated, prefer user ID over IP. IP should only be used for unauthenticated/guest requests.
2. **IPv6 handling**: Always normalize IPv6 to /64 for rate limiting. Without normalization, an attacker with an IPv6 /64 block has effectively unlimited IPs.
3. **Proxy trust**: Always configure `TrustProxies` when behind a load balancer or reverse proxy. Without it, IP-based limiting blocks the proxy IP, not the client IP.
4. **Whitelist granularity**: Decide between single IPs, CIDR ranges, or both. CIDR is more flexible for cloud infrastructure (e.g., `10.0.0.0/8` for internal traffic).

## Tradeoffs (table)
| Aspect | IP-based | User ID-based | Token-based |
|--------|----------|---------------|-------------|
| Covers unauthenticated | Yes | No | No |
| Circumvention difficulty | Low (VPN, proxy) | High (needs credentials) | Medium (needs token) |
| NAT collateral damage | High | None | None |
| IPv6 management | Complex (range normalization) | Simple | Simple |
| Guest protection | Yes | No | No |
| Accuracy | Low | High | High |

## Performance Considerations
- IP-based rate limiting requires one cache lookup per request — negligible.
- CIDR matching for whitelists is O(1) per CIDR rule. With fewer than 100 whitelist entries, the overhead is irrelevant.
- IPv4 vs IPv6 handling adds a small branching cost. Cache the IP version check result.
- For very high traffic APIs, use Redis pipelining for rate limit counter operations.
- IP whitelist checks in middleware should use a pre-loaded config array (not a database query per request).

## Production Considerations
- **VPN detection**: Some services (Stripe, GitHub) apply stricter limits to known VPN/datacenter IPs. Use an IP reputation service (e.g., MaxMind, IP2Location) to identify and rate-limit datacenter IPs more aggressively.
- **Forwarded IP validation**: `X-Forwarded-For` can be spoofed. Only trust the header from known proxies. Validate at the load balancer level.
- **Regional rate limiting**: Apply different limits per geographic region. Use IP geolocation to implement region-based rate limiting for compliance (e.g., GDPR) or business reasons.
- **Whitelist monitoring**: Log every whitelisted request. A compromised internal IP using the whitelist bypass should be detected quickly.
- **Rate limit by IP subnet for APIs**: For public APIs used by enterprises, consider limiting by /24 subnet instead of /32 to handle NAT gateways.
- **IP blocklist**: Maintain a dynamic blocklist of known abusive IPs. Check the blocklist before the rate limiter.

## Common Mistakes
- Using `$_SERVER['REMOTE_ADDR']` directly behind a load balancer — the rate limiter blocks the load balancer IP.
- Not configuring `TrustProxies` — all IPs appear as the proxy IP.
- Applying IP-based limits to authenticated users alongside user-based limits — double rate limiting.
- Using IP-based limiting for premium users — premium users may share a corporate IP; IP limits penalize them.
- Not handling IPv6 — IPv6 addresses are 128-bit, and a single user can rapidly rotate through billions of addresses.
- Whitelisting IPs but not monitoring them — a whitelisted IP that is compromised has no rate limit protection.
- Setting the rate limit too low for a shared IP (e.g., office NAT) — legitimate users are blocked.

## Failure Modes
1. **NAT gateway blocks entire office**: All employees share one public IP. If one employee's automated script hits the rate limit, everyone is blocked. Solution: Authenticate users; use user-based limits for authenticated traffic.
2. **IPv6 address rotation**: A mobile app rotates IPv6 addresses on each request, bypassing IP-based limits. Solution: Use API tokens or device IDs for rate limiting on mobile.
3. **Cloudflare/WAF IP change**: Cloudflare's IP range changes without notice. The whitelist becomes stale, and Cloudflare's IPs are blocked. Solution: Use Cloudflare's published IP list API to dynamically update whitelist.
4. **Forwarded IP spoofing**: An attacker sends `X-Forwarded-For: 127.0.0.1` to bypass IP-based limits. Solution: Configure your load balancer to strip incoming `X-Forwarded-For` headers and set the correct one.
5. **False positive on shared hosting**: Multiple clients on a shared hosting platform share the same IP. A busy client causes rate limit for others. Solution: Encourage authentication; use user-based limits for all authenticated traffic.

## Ecosystem Usage
- **Cloudflare Rate Limiting**: Cloudflare offers IP-based rate limiting at the edge. Configured per URL pattern, with options for "simulate" mode (log only) before enforcement.
- **Fail2Ban**: Linux tool that monitors logs and blocks IPs at the firewall level. Often used alongside application-level rate limiting for defense in depth.
- **AWS WAF**: IP-based rate limiting rules can be configured at the AWS WAF level, before requests reach the application server.
- **Redis + iptables**: High-traffic APIs may use Redis to track IP hit rates and dynamically add iptables rules to drop traffic from abusive IPs.

## Related Knowledge Units
### Prerequisites
- IP networking basics (IPv4, IPv6, CIDR)
- Laravel TrustProxies middleware

### Related Topics
- [rate-limiting-by-auth-tier](./phase-2/09-rate-limiting-by-auth-tier.md)
- [rate-limiter-definition](./phase-2/10-rate-limiter-definition.md)
- [rate-limit-headers](./phase-2/11-rate-limit-headers.md)

### Advanced Follow-up Topics
- IP reputation services integration (MaxMind, AbuseIPDB)
- GeoIP-based rate limiting
- Behavioral rate limiting (per-endpoint, per-user-agent)

## Research Notes
### Source Analysis
Laravel's `TrustProxies` middleware (`vendor/laravel/framework/src/Illuminate/Http/Middleware/TrustProxies.php`) controls how `$request->ip()` is resolved. The Symfony `Request::getClientIp()` method handles the `X-Forwarded-For` chain.

### Key Insight
IP-based rate limiting is essential for unauthenticated traffic but should be treated as a coarse filter, not a precise one. For APIs with authenticated users, IP-based limiting should be supplemented (or replaced) by user-based or token-based limiting. The combination of IP-based (guest) + user-based (authenticated) provides defense in depth.

### Version-Specific Notes
- **Laravel 9+**: `TrustProxies` continues to use `$request->setTrustedProxies()`. No changes to IP resolution.
- **Cloudflare + Laravel**: Use the `laravel-cloudflare` package or manually list Cloudflare's IP ranges in `TrustProxies`.
- **PHP 8.1+**: `inet_pton()` and `inet_ntop()` are well-optimized for IP manipulation.

## Tradeoffs

**Benefit:** Centralized, consistent pattern. **Cost:** Additional abstraction layer, indirection. **Consequence:** Cleaner controllers but requires team discipline to maintain separation.