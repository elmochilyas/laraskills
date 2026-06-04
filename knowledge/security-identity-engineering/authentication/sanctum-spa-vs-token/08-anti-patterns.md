# Anti-Patterns: Sanctum SPA Cookie Auth vs Token Auth

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Authentication Systems |
| Knowledge Unit | Sanctum SPA Cookie Auth vs Token Auth |
| Audience | Developers, Architects |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|---------------|
| AP-SSVT-01 | Token Auth for Same-Domain SPA | Critical | High | Medium |
| AP-SSVT-02 | Stateful Domains Misconfiguration | High | High | Low |
| AP-SSVT-03 | CSRF Cookie Call Omission | High | Medium | Low |
| AP-SSVT-04 | File Session Driver on Multi-Server | High | Medium | Medium |
| AP-SSVT-05 | Wildcard CORS With Credentials | High | Medium | Low |

---

## Repository-Wide Anti-Patterns

- **localStorage Token Storage**: Storing Bearer tokens in localStorage for browser apps, exposing them to XSS
- **Mixed Auth Mode Middleware**: Using the same `tokenCan()` logic for both SPA cookie and token auth routes
- **Cross-Domain Cookie Auth Attempt**: Trying to use SPA cookie auth across different root domains

---

## 1. Token Auth for Same-Domain SPA

### Category
Security · Architecture

### Description
Using Sanctum's Bearer token authentication with localStorage storage for a same-domain or subdomain browser-based SPA, instead of using Sanctum's SPA cookie-based session auth.

### Why It Happens
Developers unfamiliar with Sanctum's dual-mode architecture default to token auth because it's the most documented pattern for API authentication. Tutorials often show token creation without distinguishing client types. The convenience of `localStorage.setItem('token', ...)` makes it the path of least resistance.

### Warning Signs
- SPA stores authentication token in `localStorage` or `sessionStorage`
- Same-domain SPA uses `Authorization: Bearer` header on every request
- No session cookies present in browser dev tools after login
- SPA does not call `/sanctum/csrf-cookie` endpoint

### Why Harmful
Bearer tokens stored in `localStorage` are accessible to any JavaScript executing on the same origin. An XSS vulnerability — even a minor one in a third-party script — can exfiltrate the token, granting the attacker full API access as that user. SPA cookie auth uses `httpOnly` session cookies that JavaScript cannot read, eliminating this entire attack vector.

### Real-World Consequences
- XSS vulnerability exposes all user tokens — attacker gains persistent API access
- Security audit flags token-in-localStorage as a critical finding
- Client-side token management code (refresh, expiry, storage) adds unnecessary complexity
- Token leakage via referer headers, server logs, or error reporting services

### Preferred Alternative
Use Sanctum's SPA cookie auth for same-domain and subdomain browser applications. The session cookie is `httpOnly`, `Same-Site` protected, and not accessible to JavaScript.

### Refactoring Strategy
1. Configure `SANCTUM_STATEFUL_DOMAINS` in `.env` to include the SPA domain
2. Set `SESSION_DOMAIN` to the parent domain for subdomain setups
3. Update the SPA client: remove token storage logic, add `/sanctum/csrf-cookie` call before login
4. Configure Axios/Fetch to send cookies (`withCredentials: true`)
5. Remove `Authorization: Bearer` header logic from the SPA
6. Clear any stored tokens from client-side storage
7. Add CSRF token handling (Axios auto-sends `X-XSRF-TOKEN` from cookie)

### Detection Checklist
- [ ] Does the SPA store tokens in `localStorage` or `sessionStorage`?
- [ ] Is the SPA on the same domain or subdomain as the backend?
- [ ] Does the SPA use `Authorization: Bearer` headers?
- [ ] Are there session cookies present in the browser after login?
- [ ] Is `/sanctum/csrf-cookie` called before login requests?

### Related Rules/Skills/Trees
- Use SPA Cookie Auth for Same-Domain Browser Apps (05-rules.md)
- Store Bearer Tokens Securely, Not in localStorage (05-rules.md)
- Configure Sanctum SPA Cookie Auth vs Token Auth for Appropriate Client Types (06-skills.md)
- SPA Cookie vs Bearer Token Mode decision tree (07-decision-trees.md)

---

## 2. Stateful Domains Misconfiguration

### Category
Architecture · Reliability

### Description
Deploying an SPA with Sanctum cookie auth without configuring `SANCTUM_STATEFUL_DOMAINS`, causing the SPA to receive 401 unauthenticated responses on every request.

### Why It Happens
The `SANCTUM_STATEFUL_DOMAINS` configuration is easy to overlook. Sanctum's default configuration includes `localhost` and common development domains, so SPA auth works in development without explicit configuration. When deployed to production with a real domain, the configuration is still missing, and auth silently breaks.

### Warning Signs
- SPA works in local development but returns 401 in production
- `SANCTUM_STATEFUL_DOMAINS` is not set in the production `.env` file
- SPA uses `withCredentials: true` but still gets unauthenticated responses
- Session cookies are set but requests consistently return 401

### Why Harmful
Without stateful domains configured, Sanctum treats the SPA origin as external and refuses to set authenticated session cookies. Every API request fails with 401, making the entire application unusable. This is a silent deployment-blocking issue that often surfaces only after deployment to staging or production.

### Real-World Consequences
- Production deployment rolls back because SPA users cannot authenticate
- Developers spend hours debugging CORS, session config, and cookie settings before discovering the missing configuration
- Emergency hotfix required after deployment
- Users see a blank or error state if the SPA doesn't handle 401 gracefully

### Preferred Alternative
Always configure `SANCTUM_STATEFUL_DOMAINS` in `.env` during initial project setup, including all domains where the SPA will make requests. Validate the configuration as part of deployment checks.

### Refactoring Strategy
1. Add `SANCTUM_STATEFUL_DOMAINS` to `.env` with all SPA domains (comma-separated)
2. For subdomain setups, also set `SESSION_DOMAIN` to the parent domain
3. Clear config cache: `php artisan config:clear`
4. Verify that the SPA can authenticate via cookie auth
5. Add a deployment check that verifies stateful domains are configured
6. Document the required domains in the project README

### Detection Checklist
- [ ] Is `SANCTUM_STATEFUL_DOMAINS` set in production `.env`?
- [ ] Does the SPA work in development but fail in production?
- [ ] Are session cookies present in browser dev tools?
- [ ] Does `php artisan config:show sanctum` show the correct stateful domains?
- [ ] Is the production domain listed in the stateful domains array?

### Related Rules/Skills/Trees
- Configure SANCTUM_STATEFUL_DOMAINS for SPA Cookie Auth (05-rules.md)
- Configure Sanctum SPA Cookie Auth vs Token Auth for Appropriate Client Types (06-skills.md)
- Subdomain Cookie Configuration decision tree (07-decision-trees.md)

---

## 3. CSRF Cookie Call Omission

### Category
Framework Usage · Reliability

### Description
Sending POST, PUT, PATCH, or DELETE requests from a Sanctum SPA without first calling `GET /sanctum/csrf-cookie` to establish CSRF protection, resulting in 419 CSRF token mismatch errors.

### Why It Happens
The CSRF cookie call is an extra step that feels unnatural compared to a simple login POST. Developers expect login to work as a single request. Framework tutorials sometimes omit the CSRF cookie step, and developers port code from non-Laravel APIs where CSRF protection does not exist.

### Warning Signs
- Login form returns 419 CSRF token mismatch error
- All POST/PUT/DELETE requests fail with 419
- SPA code does not contain any reference to `/sanctum/csrf-cookie`
- Login works in Postman/Insomnia but not in the browser SPA

### Why Harmful
Without the CSRF cookie call, every state-changing request is rejected by Laravel's `VerifyCsrfToken` middleware. The application is completely non-functional for any write operations. This is particularly confusing because GET requests work fine (they are not CSRF-protected), leading developers down wrong debugging paths.

### Real-World Consequences
- Users cannot log in, register, or submit any forms
- QA cannot test any write functionality — release is blocked
- Developers waste hours debugging session config, CORS, and middleware before discovering the missing CSRF call
- Workaround: disabling CSRF protection for API routes (security regression)

### Preferred Alternative
Always call `GET /sanctum/csrf-cookie` before the first state-changing request. This should be the first request the SPA makes on page load or before login.

### Refactoring Strategy
1. Add `await axios.get('/sanctum/csrf-cookie')` before the login call
2. For existing SPAs, add the CSRF call before all mutation requests
3. Configure Axios to read the `XSRF-TOKEN` cookie and send it as `X-XSRF-TOKEN` header (Axios does this automatically)
4. Remove any code that disabled CSRF protection as a workaround
5. Verify that POST requests no longer return 419

### Detection Checklist
- [ ] Does the SPA call `/sanctum/csrf-cookie` before mutation requests?
- [ ] Are POST requests returning 419 CSRF token mismatch?
- [ ] Has CSRF protection been disabled in `VerifyCsrfToken` middleware exceptions?
- [ ] Does Axios have `xsrfCookieName` and `xsrfHeaderName` configured correctly?

### Related Rules/Skills/Trees
- Always Call /sanctum/csrf-cookie Before SPA Login (05-rules.md)
- Configure Sanctum SPA Cookie Auth vs Token Auth for Appropriate Client Types (06-skills.md)

---

## 4. File Session Driver on Multi-Server

### Category
Performance · Architecture

### Description
Using Laravel's `file` session driver with Sanctum SPA cookie auth on a multi-server or load-balanced deployment, causing intermittent authentication failures.

### Why It Happens
The `file` session driver is Laravel's default and works fine in single-server development. When scaling to multiple servers, teams often forget to update the session configuration. The issue is intermittent — user A might be authenticated on server 1 but get 401 when a load balancer routes them to server 2, making it difficult to diagnose.

### Warning Signs
- Intermittent 401 errors — refreshing the page sometimes works, sometimes doesn't
- `config/session.php` has `'driver' => env('SESSION_DRIVER', 'file')` and `SESSION_DRIVER` is not set in production
- Users are randomly logged out during normal usage
- Load-balanced environment with no shared session storage

### Why Harmful
Each server stores sessions in its local filesystem. When a load balancer routes a request to a different server, the session file doesn't exist, Sanctum cannot find the authenticated session, and the request returns 401. Users experience random logouts, failed operations, and an unreliable application.

### Real-World Consequences
- Users randomly receive 401 errors during normal usage
- Customer support tickets spike about "being logged out for no reason"
- E-commerce checkout fails intermittently — lost revenue
- Emergency switch to Redis or database sessions during production incident
- Developer trust in the application's reliability is damaged

### Preferred Alternative
Use `redis`, `memcached`, or `database` session driver in production for all multi-server deployments.

### Refactoring Strategy
1. Install Redis (or use existing infrastructure) for session storage
2. Update `.env.production`: `SESSION_DRIVER=redis`
3. Configure Redis connection in `config/database.php` or `config/session.php`
4. Test that sessions persist across server restarts and load balancer routing
5. For existing deployments, migrate active sessions if persistence is required
6. Add deployment checklist item to verify session driver configuration

### Detection Checklist
- [ ] Is `SESSION_DRIVER` explicitly set in production `.env`?
- [ ] Is the deployment multi-server or load-balanced?
- [ ] Are users experiencing intermittent 401 errors?
- [ ] Does `config/session.php` show `file` as the active driver?
- [ ] Is there a shared session storage (Redis, database) configured?

### Related Rules/Skills/Trees
- Use Production-Ready Session Driver for SPA Auth (05-rules.md)
- Configure Sanctum SPA Cookie Auth vs Token Auth for Appropriate Client Types (06-skills.md)
- Session Driver Selection decision tree (07-decision-trees.md)

---

## 5. Wildcard CORS With Credentials

### Category
Architecture · Security

### Description
Configuring CORS with `allowed_origins: ['*']` alongside `supports_credentials: true` for Sanctum SPA subdomain cookie auth, which browsers reject as invalid.

### Why It Happens
The wildcard origin `*` is the easiest CORS configuration — it accepts requests from any domain. Developers see `supports_credentials: true` as necessary for cookies and add it without understanding that the browser specification explicitly forbids wildcard origins with credentialed requests.

### Warning Signs
- `config/cors.php` has `'allowed_origins' => ['*']` and `'supports_credentials' => true`
- Browser console shows CORS errors: "The value of the 'Access-Control-Allow-Origin' header must not be the wildcard '*' when the request's credentials mode is 'include'"
- SPA works in Postman but not in the browser
- Credentialed requests fail silently with no response data

### Why Harmful
The browser blocks all credentialed requests when the server responds with a wildcard origin. The SPA cannot read any API responses, effectively breaking the entire application. This is particularly insidious because non-credentialed requests work fine, and the error message in browser console is often missed during development.

### Real-World Consequences
- SPA cannot load any authenticated data from the API
- Production deployment fails because browser SPA cannot make credentialed requests
- Developers waste time debugging session config, cookie settings, and HTTPS before discovering the CORS issue
- Workaround: removing `supports_credentials` breaks cookie auth

### Preferred Alternative
Always specify explicit allowed origins when `supports_credentials` is `true`. Never use `*` with credentialed requests.

### Refactoring Strategy
1. Replace `'allowed_origins' => ['*']` with explicit origins: `'allowed_origins' => [env('APP_FRONTEND_URL')]`
2. Keep `'supports_credentials' => true`
3. Add all valid SPA origins to the configuration (comma-separated if needed)
4. Clear config cache: `php artisan config:clear`
5. Verify that credentialed requests succeed in the browser
6. Add a CI check that rejects wildcard CORS with credentials enabled

### Detection Checklist
- [ ] Does `config/cors.php` have `'allowed_origins' => ['*']`?
- [ ] Is `'supports_credentials' => true` set?
- [ ] Are credentialed requests failing in the browser?
- [ ] Does the browser console show "wildcard" CORS errors?
- [ ] Are specific origins listed in `allowed_origins`?

### Related Rules/Skills/Trees
- Enable CORS With Credentials for SPA Subdomain Auth (05-rules.md)
- Configure CORS for API Integration (06-skills.md)
- Subdomain Cookie Configuration decision tree (07-decision-trees.md)
