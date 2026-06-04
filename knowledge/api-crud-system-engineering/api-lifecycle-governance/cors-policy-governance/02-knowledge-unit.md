# CORS Policy Governance

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Lifecycle & Governance
- **Last Updated:** 2026-06-02

## Executive Summary
CORS (Cross-Origin Resource Sharing) policy governance defines how API origins are managed, how CORS headers are configured per environment, and what security reviews are required for origin additions. A well-governed CORS policy prevents unauthorized cross-origin access while enabling legitimate browser-based consumers.

## Core Concepts
- **CORS (Cross-Origin Resource Sharing):** A browser security mechanism that controls which origins can access API resources.
- **Origin:** The scheme + host + port combination (e.g., `https://app.example.com`).
- **Preflight Request:** An `OPTIONS` request sent by the browser to check CORS permissions before the actual request.
- **Allowed Origins:** The list of origins permitted to make cross-origin requests to the API.
- **Wildcard Origin (`*`):** Allows all origins — appropriate for public APIs but not for authenticated endpoints.
- **Credentials Flag:** When `withCredentials` is true, the server must specify explicit origins (not `*`).
- **CORS Middleware:** Server-side component that validates origins and injects appropriate headers.

## Mental Models
- **Nightclub Door Policy:** The bouncer (CORS middleware) checks IDs at the door. Approved guests (allowed origins) get in; unknown guests are denied. VIP areas (authenticated endpoints) require explicit name-check (no wildcards).
- **Embassy Visa:** Each origin must apply for a visa (be added to the allowlist). Visas are environment-specific — the production visa is harder to get than the staging visa.

## Internal Mechanics
1. **Preflight Handling:** The API gateway or middleware intercepts `OPTIONS` requests and returns CORS headers without invoking the application logic.
2. **Origin Validation:** On actual requests, the `Origin` header is checked against the allowed origins list.
3. **Header Injection:** If the origin is allowed, the response includes `Access-Control-Allow-Origin`, `Allow-Methods`, `Allow-Headers`, and `Max-Age`.
4. **Credential Handling:** If credentials are required, the specific origin is echoed (not `*`) and `Access-Control-Allow-Credentials: true` is set.
5. **Exposed Headers:** Custom headers (e.g., `X-Request-Id`, `Deprecation`) are listed in `Access-Control-Expose-Headers`.
6. **Environment Configuration:** Each environment (dev, staging, production) has its own allowlist.

## Patterns
- **Environment-Specific Origin Lists:** Dev allows `http://localhost:*`; staging allows internal domains; production has a curated allowlist.
- **Origin Change Request Process:** Adding a production origin requires a ticket with security review and business justification.
- **Explicit Origin Echoing:** Never use `Access-Control-Allow-Origin: *` for authenticated endpoints — always echo the specific origin.
- **Dynamic Origin Validation:** For multi-tenant SaaS APIs, validate origins against a tenant-specific allowlist.
- **CORS Health Check Endpoint:** A `GET /cors-check` endpoint that tells developers what origins are currently allowed.

## Architectural Decisions
| Decision | Option | Chosen | Rationale |
|---|---|---|---|
| CORS implementation | Application middleware / Gateway / CDN | API Gateway (nginx) + application override | Gateway handles preflight; application handles dynamic validation |
| Origin storage | Config file / Database / Environment vars | Environment variables for static; database for dynamic | Env vars for infrastructure; DB for consumer-managed origins |
| Wildcard usage | Allowed for public / Never | Allowed for public read-only endpoints | Public APIs need flexibility; authenticated endpoints need precision |
| Preflight cache TTL | 0 / 3600 / 86400 | 86400 seconds (24 hours) | Reduces preflight overhead; sufficient for most origins |

## Tradeoffs
| Tradeoff | Consideration |
|---|---|
| Restrictive vs permissive CORS | Restrictive is secure but causes consumer friction; permissive is easy but risky for authenticated endpoints |
| Gateway vs app-level CORS | Gateway is faster and centralized; app-level allows dynamic origin resolution |
| Long vs short preflight cache | Long cache reduces latency; short cache allows faster origin changes |

## Performance Considerations
- Preflight requests add one extra round-trip for cross-origin requests — caching minimizes this.
- Origin validation is O(n) against the allowlist — keep lists under 100 entries for performance.
- Dynamic origin resolution (database-backed) adds ~5ms per request — cache the allowlist in memory.

## Production Considerations
- **Monitoring:** Track CORS rejection rates; alert on unusual patterns (mass rejections = misconfiguration).
- **Logging:** Log every CORS rejection with origin, endpoint, and user agent for security audits.
- **Backup:** Origin configuration is in infrastructure-as-code — no separate backup.
- **Rollback:** Revert an origin change by reverting the config change (env vars or IaC).
- **Testing:** Integration tests verify CORS headers for each environment; test both allowed and disallowed origins.

## Common Mistakes
- Using `Access-Control-Allow-Origin: *` with `Access-Control-Allow-Credentials: true` (browsers reject this).
- Forgetting to include custom headers in `Access-Control-Expose-Headers` (browser hides them from JS).
- Setting preflight `Max-Age` too low (many preflight requests) or too high (stale permissions).
- Allowing `http://localhost:*` in production (security risk).
- Not handling CORS for error responses (errors also need CORS headers for browser to read them).

## Failure Modes
- **Misconfigured Origin:** A legitimate consumer's origin is rejected. Mitigation: CORS debugging endpoint and clear error messages.
- **Preflight Cache Poisoning:** A stale preflight cache allows a removed origin temporarily. Mitigation: short `Max-Age` and clear documentation about cache duration.
- **Credential Leak:** Using `*` for authenticated endpoints → credentials exposed to any origin. Mitigation: strict no-wildcard policy for authenticated endpoints.
- **CORS Bypass:** CORS is a browser-only mechanism — non-browser clients ignore it entirely. Mitigation: CORS is not a security boundary; authenticate all requests.

## Ecosystem Usage
- **Stripe:** CORS configured per environment; production allows specific dashboard and API consumer origins.
- **GitHub API:** Uses CORS with explicit origin validation; provides a `/meta` endpoint with CORS info.
- **Twilio:** CORS policies vary by product; developer docs include CORS troubleshooting guides.

## Related Knowledge Units

### Prerequisites
- [Request Size Limits](ku-14-request-size-limits)
- [API Monitoring and Alerting](ku-18-api-monitoring-alerting)

### Related Topics
- [Team API Consistency Rules](ku-06-team-api-consistency-rules)
- [API Audit Review Process](ku-08-api-audit-review-process)

### Advanced Follow-up Topics
- Dynamic CORS for multi-tenant APIs
- CORS debugging tools and middleware
- CORS vs CSP (Content Security Policy) for API protection

## Research Notes

### Source Analysis
The MDN CORS documentation is the definitive reference. The MDN recommendation to avoid wildcard origins with credentials and to expose custom headers explicitly is universally adopted.

### Key Insight
CORS is frequently misunderstood as a security mechanism — it is actually a **browser-enforced permission system**. It does not protect the API from direct server-to-server requests. The real security boundary is authentication and authorization, not CORS.

### Version-Specific Notes
- Laravel 11.x: Use `fruitcake/laravel-cors` package or configure CORS in `config/cors.php`; Sanctum handles CORS for SPA authentication.
- PHP 8.4: No built-in CORS support — use framework middleware or manually set headers.
