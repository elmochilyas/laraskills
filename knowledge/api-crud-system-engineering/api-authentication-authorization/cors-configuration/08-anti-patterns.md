# ECC Anti-Patterns — CORS Configuration

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | API & CRUD System Engineering |
| **Subdomain** | API Authentication & Authorization |
| **Knowledge Unit** | CORS Configuration |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Wildcard Origin with Credentials Enabled
2. Dynamic Origin Resolution from Database Per Request
3. CORS Handled in Both Laravel and Reverse Proxy
4. Missing Required Headers in Allowed Headers
5. No Preflight Caching (Missing Access-Control-Max-Age)

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries

---

## Anti-Pattern 1: Wildcard Origin with Credentials Enabled

### Category
Security

### Description
Setting `allowed_origins: ['*']` while `supports_credentials: true`, which the CORS specification explicitly forbids and browsers reject.

### Why It Happens
Developers use the default `*` configuration without considering credential implications. The convenience of allowing any origin overrides understanding of the credentialed CORS interaction.

### Warning Signs
- `config/cors.php` has `'*'` in `allowed_origins` and `true` in `supports_credentials`
- All browser requests with cookies fail with CORS errors
- Stack Overflow answers suggesting `*` with credentials
- Browser console shows CORS errors for credentialed requests

### Why It Is Harmful
All credentialed cross-origin requests fail, breaking Sanctum SPA auth, cookie-based sessions, and any authentication that relies on browser credentials. The API appears broken to all browser-based clients.

### Real-World Consequences
Users cannot log in from the SPA. Every authenticated request fails at the browser level with opaque CORS errors. Developers waste hours debugging before realizing the `*` + credentials conflict.

### Preferred Alternative
Use explicit origins matching your frontend domains. `allowed_origins: ['https://app.example.com']` with `supports_credentials: true`.

### Refactoring Strategy
1. Replace `'*'` with explicit origin list in `config/cors.php`
2. Set `supports_credentials: true` only when cookie-based auth is used
3. Test preflight OPTIONS response for each allowed origin
4. Verify credentialed requests succeed from browser clients

### Detection Checklist
- [ ] Check `config/cors.php` for wildcard + credentials combination
- [ ] Verify browser CORS errors for authenticated requests

### Related Rules
- Never Use Wildcard Origin with Credentials (05-rules.md)

### Related Skills
- Configure CORS for API Access (06-skills.md)

### Related Decision Trees
- Credentialed vs Non-Credentialed CORS Mode (07-decision-trees.md)

---

## Anti-Pattern 2: Dynamic Origin Resolution from Database Per Request

### Category
Performance

### Description
Reading allowed origins from the database on every request to dynamically match the `Origin` header, adding latency to every API call and creating a database dependency for CORS resolution.

### Why It Happens
Multi-tenant architectures with custom domains lead developers to implement dynamic origin matching. The database query is added directly in the CORS configuration closure without caching.

### Warning Signs
- `allowed_origins` uses a closure that queries the database
- CORS middleware makes database queries visible in query log
- API latency spikes correlated with CORS resolution
- Cache miss on allowed origins causes DB query per request

### Why It Is Harmful
Every API request, including OPTIONS preflight, executes a database query just to validate the origin. This adds latency, increases database load, and makes CORS resolution a potential bottleneck.

### Real-World Consequences
At 1000 req/s, dynamic origin resolution generates 1000 DB queries per second just for CORS checking. Database connection pool usage increases unnecessarily, impacting actual data queries.

### Preferred Alternative
Use explicit origin whitelists for known domains. For multi-tenant platforms, cache the allowed origins list in Redis with a background refresh job.

### Refactoring Strategy
1. Replace closure with static origin list for fixed domains
2. For multi-tenant, implement cached origin resolution using Redis
3. Create a tenant-domain-to-origin cache refreshed on tenant creation/update
4. Add monitoring for cache miss rates on origin resolution

### Detection Checklist
- [ ] Check `config/cors.php` `allowed_origins` for closures
- [ ] Check query log for CORS-related SELECT queries

### Related Rules
- Whitelist Explicit Origins in Production (05-rules.md)

### Related Skills
- Configure CORS for API Access (06-skills.md)

### Related Decision Trees
- Origin Strategy — Explicit Whitelist vs Dynamic Origin Matching (07-decision-trees.md)

---

## Anti-Pattern 3: CORS Handled in Both Laravel and Reverse Proxy

### Category
Architecture

### Description
Configuring CORS in both Laravel's `config/cors.php` and the reverse proxy (Nginx, Cloudflare), causing duplicated or conflicting `Access-Control-Allow-Origin` headers that browsers reject.

### Why It Happens
CORS is configured at the Laravel level during development. When a reverse proxy is added in production, the ops team adds CORS there too without disabling Laravel's CORS. Neither team knows the other layer is handling it.

### Warning Signs
- Response inspection shows multiple `Access-Control-Allow-Origin` headers
- CORS works intermittently in different environments
- Browser reports "Multiple CORS header values not allowed"
- Both `config/cors.php` and Nginx config have CORS directives

### Why It Happens
Two teams (dev and ops) independently configure CORS. Neither removes the other's configuration. The browser receives two different origins and rejects the response.

### Preferred Alternative
Choose one layer — either Laravel middleware OR the reverse proxy — and disable CORS in the other. Laravel middleware is simpler for most setups.

### Refactoring Strategy
1. Decide which layer handles CORS (prefer Laravel middleware)
2. Disable CORS in the other layer (set empty paths in Laravel, remove headers in Nginx)
3. Verify response has exactly one `Access-Control-Allow-Origin` header
4. Test in all environments

### Detection Checklist
- [ ] Inspect response headers for duplicate `Access-Control-Allow-Origin`
- [ ] Check Nginx config for `add_header Access-Control-Allow-Origin`
- [ ] Check `config/cors.php` `paths` configuration

### Related Rules
- Handle CORS in One Layer Only (05-rules.md)

### Related Skills
- Configure CORS for API Access (06-skills.md)

### Related Decision Trees
- CORS Layer — Laravel Middleware vs Reverse Proxy (07-decision-trees.md)

---

## Anti-Pattern 4: Missing Required Headers in Allowed Headers

### Category
Framework Usage

### Description
Omitting `Authorization` and `Content-Type` from the `allowed_headers` CORS configuration, causing all authenticated or mutating requests to fail at the preflight check.

### Why It Happens
The default CORS configuration includes only basic headers. Developers don't update `allowed_headers` when adding authentication, and the error manifests as a cryptic CORS failure in the browser.

### Warning Signs
- `allowed_headers` only contains `X-CSRF-TOKEN` or `X-Requested-With`
- All authenticated API calls from browsers fail
- `PUT`/`POST`/`DELETE` requests fail at preflight
- Browser says "Request header field Authorization is not allowed by Access-Control-Allow-Headers"

### Why It Is Harmful
The API is unusable from browser clients. Every authenticated or mutating request fails before reaching the server. The error message in the browser is opaque and easily misattributed to authentication issues.

### Real-World Consequences
Frontend developers cannot make authenticated API calls from the SPA. Every POST, PUT, or DELETE fails. The CORS preflight never reaches the controller, making server-side debugging futile.

### Preferred Alternative
Include `Authorization`, `Content-Type`, `X-CSRF-TOKEN`, and `X-Requested-With` in `allowed_headers`.

### Refactoring Strategy
1. Update `config/cors.php` `allowed_headers` with all required headers
2. Test OPTIONS preflight with `curl` to verify headers are allowed
3. Verify authenticated browser requests succeed

### Detection Checklist
- [ ] Check `config/cors.php` for `Authorization` in `allowed_headers`
- [ ] Check `config/cors.php` for `Content-Type` in `allowed_headers`

### Related Rules
- Include Authorization and Content-Type in Allowed Headers (05-rules.md)

### Related Skills
- Configure CORS for API Access (06-skills.md)

### Related Decision Trees
- (Embedded in credentialed vs non-credentialed decision tree)

---

## Anti-Pattern 5: No Preflight Caching (Missing Access-Control-Max-Age)

### Category
Performance

### Description
Not setting `Access-Control-Max-Age` or setting it to `0`, causing every non-simple cross-origin request to trigger an OPTIONS preflight instead of caching the CORS policy.

### Why It Happens
Laravel's default CORS configuration does not set `Max-Age`. Developers don't notice the doubled request count because OPTIONS requests are cheap and invisible in browser dev tools' "requests" view.

### Warning Signs
- Every API call from the browser triggers two requests (OPTIONS + actual)
- Server logs show as many OPTIONS as actual requests
- API latency perception is doubled due to preflight round-trip
- `Access-Control-Max-Age` header missing from OPTIONS responses

### Why It Is Harmful
Every cross-origin request requires a preflight round-trip before the actual request can execute. This doubles the number of HTTP requests to the server and doubles perceived latency for each API call.

### Real-World Consequences
A mobile SPA making 100 API calls per page load generates 200 HTTP requests. Latency doubles from 200ms to 400ms perceived. Server handles twice the request volume for the same functionality.

### Preferred Alternative
Set `Access-Control-Max-Age: 86400` (24 hours) in production to cache preflight responses, reducing OPTIONS requests to 1 per origin per day.

### Refactoring Strategy
1. Configure `Access-Control-Max-Age: 86400` in CORS middleware
2. Use shorter values (600) during development for faster feedback
3. Verify OPTIONS responses include the Max-Age header
4. Monitor OPTIONS request volume before and after

### Detection Checklist
- [ ] Check OPTIONS response for `Access-Control-Max-Age` header
- [ ] Count OPTIONS vs actual request ratio in server logs

### Related Rules
- Set Access-Control-Max-Age to 86400 in Production (05-rules.md)

### Related Skills
- Configure CORS for API Access (06-skills.md)

### Related Decision Trees
- Preflight Max-Age Duration (07-decision-trees.md)

---
