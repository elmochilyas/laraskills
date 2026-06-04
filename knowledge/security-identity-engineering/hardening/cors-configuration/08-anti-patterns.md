# Anti-Patterns: CORS Configuration

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Security Hardening |
| Knowledge Unit | CORS Configuration |
| Audience | Developers, Architects |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|---------------|
| AP-CR-01 | Wildcard Origins with Credentials | Critical | High | Low |
| AP-CR-02 | Origin Header Reflection | Critical | Low | High |
| AP-CR-03 | Missing Sanctum Stateful Domains | High | Medium | Low |
| AP-CR-04 | Allowed Methods Wildcard | Medium | High | Low |
| AP-CR-05 | No Preflight Caching | Low | Medium | Low |

---

## Repository-Wide Anti-Patterns

- **CORS on All Routes**: CORS middleware applied to internal-only routes
- **No CORS at All for Public API**: Public APIs block all cross-origin browser requests
- **Mixed CORS Config**: Some endpoints use credentials, others don't — inconsistent

---

## 1. Wildcard Origins with Credentials

### Category
Security · Critical

### Description
Setting `allowed_origins: ['*']` together with `supports_credentials: true`, which browsers reject (and if they didn't, would allow any site to make authenticated requests).

### Why It Happens
Development environments use `*` for convenience. Developers forget to change it for production, where credentials are enabled. The config seems valid — no errors on the server side. Only the browser rejects the combination.

### Warning Signs
- `allowed_origins: ['*']` with `supports_credentials: true`
- Sanctum SPA giving CORS errors despite configuration
- Server logs show no errors, browser console shows CORS errors
- Development works (no HTTPS or relaxed browser) but production fails

### Why Harmful
The browser blocks the CORS preflight response, so no cross-origin request works. The application is broken for all legitimate cross-origin clients. If a browser doesn't enforce the `*` + credentials restriction, any website can make authenticated requests to your API.

### Real-World Consequences
- SPA can't authenticate: all API calls return CORS errors
- Production deployment broken for 2 days while tracing CORS issue
- Browser rejects all cross-origin requests silently
- No user-facing error — just "something isn't loading"

### Preferred Alternative
Use specific origins in production when credentials are enabled.

### Refactoring Strategy
1. Change `allowed_origins` from `['*']` to `[env('APP_FRONTEND_URL')]`
2. Set `APP_FRONTEND_URL` in `.env`
3. Verify preflight OPTIONS response includes `Access-Control-Allow-Origin: <specific_origin>`

### Detection Checklist
- [ ] Is `allowed_origins: ['*']` with `supports_credentials: true`?
- [ ] Does CORS config use `*` in production?
- [ ] Is `APP_FRONTEND_URL` set in `.env`?
- [ ] Does the preflight response return a specific origin?
- [ ] Are all allowed origins known and controlled?

### Related Rules/Skills/Trees
- Restrict allowed_origins to Specific Domains in Production (05-rules.md)
- Configure CORS for Cross-Origin API Access (06-skills.md)
- Specific Origins vs Wildcard decision tree (07-decision-trees.md)

---

## 2. Origin Header Reflection

### Category
Security · Critical

### Description
Dynamically setting `allowed_origins` to the value of the incoming `Origin` header, allowing any attacker's website to make cross-origin requests.

### Why It Happens
Developers see the Origin header and think "I'll just reflect it — dynamic whitelisting!" This seems flexible and works perfectly during testing. Any origin works. The security implication is that ANY origin works, including `evil.com`.

### Warning Signs
- `request()->header('Origin')` in CORS configuration
- `allowed_origins` set dynamically based on request
- No static origin whitelist in CORS config
- CORS works for any domain during testing

### Why Harmful
Origin reflection completely defeats CORS. An attacker's website sets `Origin: https://evil.com`, and your server echoes it back as allowed. The browser sees the matching origin and allows the cross-origin response, including authentication cookies if credentials are enabled.

### Real-World Consequences
- Any website can make authenticated requests to your API
- Users visiting `evil.com` trigger requests to your app with their cookies
- CSRF-like attack without needing to forge anything
- Data exfiltration

### Preferred Alternative
Use a static whitelist of known origins.

### Refactoring Strategy
1. Remove `request()->header('Origin')` from `allowed_origins`
2. Replace with explicit origins from environment config
3. Never accept dynamic origins

### Detection Checklist
- [ ] Is `request()->header('Origin')` referenced in CORS config?
- [ ] Are origins dynamically generated from request data?
- [ ] Is there a static origin whitelist?
- [ ] Can any domain make cross-origin requests?
- [ ] Does the reflected origin match the allowed origin?

### Related Rules/Skills/Trees
- Never Reflect the Origin Header Back as Allowed (05-rules.md)
- Configure CORS for Cross-Origin API Access (06-skills.md)

---

## 3. Missing Sanctum Stateful Domains

### Category
Architecture · High

### Description
Configuring CORS for Sanctum SPA auth but forgetting to set `SANCTUM_STATEFUL_DOMAINS`, causing all SPA requests to return 401.

### Why It Happens
Developers configure CORS (the visible part) but miss Sanctum's separate stateful domains config. The CORS headers look correct in the response, but Sanctum doesn't recognize the SPA origin and treats session requests as external.

### Warning Signs
- Sanctum SPA returns 401 on every request despite correct CORS
- Preflight passes but authentication fails
- `Access-Control-Allow-Credentials: true` present but no session
- `SANCTUM_STATEFUL_DOMAINS` not in `.env`
- SPA works with token auth but not cookie auth

### Why Harmful
The SPA cannot authenticate. All session-based requests fail. The application appears broken, and the CORS configuration looks correct, making debugging difficult.

### Real-World Consequences
- SPA login returns 401 even with valid credentials
- Hours of debugging CORS when the issue is Sanctum stateful domains
- Production SPA cannot authenticate users

### Preferred Alternative
Set both `SANCTUM_STATEFUL_DOMAINS` and CORS `allowed_origins` to the SPA domain.

### Refactoring Strategy
1. Add `SANCTUM_STATEFUL_DOMAINS=app.example.com` to `.env`
2. Set `CORS allowed_origins` to the same domain
3. Verify SPA authentication works

### Detection Checklist
- [ ] Is `SANCTUM_STATEFUL_DOMAINS` set in `.env`?
- [ ] Does it match CORS `allowed_origins`?
- [ ] Is CORS `supports_credentials` set to `true`?
- [ ] Does SPA authentication work consistently?

### Related Rules/Skills/Trees
- Configure Sanctum Stateful Domains for SPA Cookie Auth (05-rules.md)
- Configure CORS for Cross-Origin API Access (06-skills.md)
- Credentials Support Enablement decision tree (07-decision-trees.md)

---

## 4. Allowed Methods Wildcard

### Category
Security · Medium

### Description
Setting `allowed_methods: ['*']` instead of restricting to the HTTP methods the application actually uses.

### Why It Happens
`'*'` is the simplest value — it requires no thought about which methods are needed. The application works for all HTTP methods. Developers defer the decision indefinitely.

### Warning Signs
- `allowed_methods: ['*']` in production
- API is read-only but `DELETE` is allowed
- No documented method restrictions
- Methods allowed that are not implemented by any endpoint

### Why Harmful
Exposing methods the application doesn't implement is unnecessary attack surface. A read-only API allowing `DELETE`, `PUT`, or `PATCH` gives attackers more flexibility to probe for vulnerabilities.

### Real-World Consequences
- Attacker probes `DELETE` on a read-only endpoint — finds custom logic that responds
- Security audit flags excessive allowed methods
- API client accidentally uses wrong method — succeeds but causes unexpected behavior

### Preferred Alternative
Restrict `allowed_methods` to only the HTTP methods used by the API endpoints.

### Refactoring Strategy
1. Audit which HTTP methods endpoints actually use
2. Set `allowed_methods` to only those methods
3. Review periodically as the API evolves

### Detection Checklist
- [ ] Is `allowed_methods: ['*']` in production?
- [ ] Are only necessary HTTP methods allowed?
- [ ] Can `DELETE` be sent to read-only endpoints?
- [ ] Is there a method audit process?

### Related Rules/Skills/Trees
- Restrict allowed_methods to What the Application Actually Uses (05-rules.md)
- Configure CORS for Cross-Origin API Access (06-skills.md)

---

## 5. No Preflight Caching

### Category
Performance · Low

### Description
Not setting `Access-Control-Max-Age`, causing the browser to send a preflight OPTIONS request before every cross-origin request instead of caching the preflight response.

### Why It Happens
The `max_age` setting is often left at `0` (no cache) because preflight caching seems like an optimization that can be deferred. In development and low-traffic environments, the extra OPTIONS request is not noticeable.

### Warning Signs
- `max_age: 0` or `max_age` not configured
- Every cross-origin request is preceded by an OPTIONS request
- Network tab shows OPTIONS + actual request for every API call
- API endpoint called twice for every user action

### Why Harmful
Every cross-origin API call requires two HTTP round trips. For an SPA making 50 API calls on page load, that's 50+50 = 100 requests instead of 50. This doubles network latency and server load.

### Real-World Consequences
- SPA load time doubled due to 50 extra OPTIONS requests
- Server handles 2x request volume for CORS routes
- Mobile users experience slower app due to extra round trips
- API rate limits consumed by preflight requests

### Preferred Alternative
Set `max_age` to at least 86400 (24 hours) to cache preflight responses.

### Refactoring Strategy
1. Set `'max_age' => 86400` in `config/cors.php`
2. Verify preflight responses include `Access-Control-Max-Age: 86400`
3. Monitor that OPTIONS requests decrease after caching

### Detection Checklist
- [ ] Is `max_age` set to a value > 0?
- [ ] Are preflight OPTIONS requests cached?
- [ ] Does every API call require two HTTP requests?
- [ ] What is the preflight cache hit ratio?
- [ ] Has site performance been degraded by excessive OPTIONS?

### Related Rules/Skills/Trees
- Set Access-Control-Max-Age to Cache Preflight Responses (05-rules.md)
- Configure CORS for Cross-Origin API Access (06-skills.md)
