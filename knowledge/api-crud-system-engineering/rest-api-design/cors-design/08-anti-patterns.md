# CORS Design: Anti-Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | rest-api-design |
| Knowledge Unit | cors-design |
| Phase | 8-anti-patterns |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. **CORS as Security Mechanism** — Treating CORS as an authentication or access control system
2. **Wildcard Origin in Production** — Using `*` for allowed origins in production environments
3. **Credentials Without Specific Origins** — Enabling `supports_credentials` while using wildcard origins
4. **CORS Configuration in Code** — Hardcoding CORS logic in middleware instead of `config/cors.php`
5. **ALLOW-ALL Development Config Leaked to Production** — Permissive development CORS configuration carried to production

## Repository-Wide Anti-Patterns

- Listing every possible origin additively without quarterly review and pruning
- Forgetting to handle OPTIONS preflight before authentication middleware
- Not including `sanctum/csrf-cookie` in CORS paths for SPA authentication
- Exposing internal headers via `Access-Control-Expose-Headers`

---

## 1. CORS as Security Mechanism

### Category
Security Misconception

### Description
Relying on CORS configuration as the primary security measure for the API, believing that restricting allowed origins prevents unauthorized access. CORS is enforced only by browsers for browser-based clients — server-to-server, mobile, and CLI requests bypass CORS entirely.

### Why It Happens
CORS errors visibly block requests in browser developer tools, creating a strong impression that CORS is "protecting" the API. Developers mistake browser behavior for server-side enforcement.

### Warning Signs
- No authentication on endpoints because "CORS blocks unauthorized origins"
- Mobile app or CLI accesses API without authentication
- CORS configuration is the only cross-origin access control
- Security review treats CORS as an access control mechanism

### Why Harmful
The API is completely unprotected from non-browser clients. Any script, server, or tool can access the API without restriction because CORS doesn't apply to them.

### Real-World Consequences
A developer builds a mobile app that accesses the API without authentication, assuming CORS protects it. After release, the API is scraped by automated scripts that bypass CORS entirely, leading to data theft.

### Preferred Alternative
Implement proper authentication (Sanctum, Passport) for all API access. Use CORS only for its intended purpose: controlling browser-based cross-origin requests.

### Refactoring Strategy
1. Implement authentication on all protected endpoints
2. Remove reliance on CORS for access decisions
3. Document that CORS is browser-only in security documentation
4. Add rate limiting and IP-based access controls for additional security

### Detection Checklist
- [ ] Endpoints lack authentication because "CORS protects them"
- [ ] Mobile or CLI access is unauthenticated
- [ ] Security documentation lists CORS as an access control
- [ ] No authentication middleware on API routes

### Related Rules/Skills/Trees
- Rule: API-SEC-001 (Defense in Depth)
- Skill: api-authentication-authorization
- Tree: security-basics

---

## 2. Wildcard Origin in Production

### Category
Security Risk

### Description
Configuring `allowed_origins` to `['*']` in production, allowing any website to make browser-based requests to the API.

### Why It Happens
Development convenience, copy-paste from tutorials, or the assumption that "it works in development so it'll work in production." The wildcard appears simpler than maintaining an origin list.

### Warning Signs
- `config/cors.php` contains `'*'` in `allowed_origins`
- No environment variable controls allowed origins
- CORS policy never reviewed after initial setup
- Any origin can access the API

### Why Harmful
Any website can make authenticated requests from a user's browser if the user is logged in (CSRF-style attack). Even without credentials, wildcard CORS exposes the API to cross-origin data scraping.

### Real-World Consequences
A third-party website embeds a script that fetches user data from the API. Because CORS allows all origins, the user's browser happily sends their session cookies (if credentials are enabled) or the data is accessible for scraping.

### Preferred Alternative
List specific origins in production. Use environment variables to manage the list: `CORS_ALLOWED_ORIGINS=https://app.example.com,https://admin.example.com`.

### Refactoring Strategy
1. Replace wildcard with explicit origin list
2. Use environment variable to configure allowed origins
3. Add a CI check that fails if wildcard is present in production config
4. Test CORS policy with curl: `curl -H "Origin: https://evil.com" -I`

### Detection Checklist
- [ ] `allowed_origins` contains `*` in production
- [ ] No environment-specific CORS configuration
- [ ] CI/CD doesn't check for wildcard in production config
- [ ] Test with unauthorized origin succeeds

### Related Rules/Skills/Trees
- Rule: API-SEC-003 (Explicit Origin Policy)
- Skill: api-security-headers
- Tree: security-hardening

---

## 3. Credentials Without Specific Origins

### Category
Configuration Error

### Description
Setting `supports_credentials: true` while using `allowed_origins: ['*']`. Browsers reject this combination because credentialed requests require explicit origin matching.

### Why It Happens
Developers enable credentials for authentication (cookies, Authorization headers) but keep the wildcard origin for convenience, not realizing browsers refuse to send credentialed requests with wildcard origins.

### Warning Signs
- `supports_credentials: true` with `allowed_origins: ['*']`
- Authenticated requests from browser fail with CORS errors
- Preflight succeeds but actual request fails
- Browser console shows "credentials flag is true, but Access-Control-Allow-Origin is wildcard"

### Why Harmful
The CORS configuration fails silently — preflight succeeds (OPTIONS returns 204) but the actual credentialed request is blocked by the browser. Debugging is difficult because the error appears only in browser console.

### Real-World Consequences
A team spends two days debugging why authenticated requests fail in the browser. The server logs show successful OPTIONS and requests, but the browser blocks the actual response. The root cause is wildcard + credentials.

### Preferred Alternative
Always use explicit origins when `supports_credentials: true`. List the exact frontend URLs that need credentialed access.

### Refactoring Strategy
1. Remove wildcard from `allowed_origins` when credentials are enabled
2. List specific origins for each environment
3. Test with `credentials: 'include'` in fetch requests
4. Verify CORS headers with `curl -H "Origin: https://app.example.com" -v`

### Detection Checklist
- [ ] `supports_credentials: true` with wildcard origins
- [ ] Authenticated fetch requests fail with CORS error
- [ ] Preflight succeeds but actual request blocked by browser
- [ ] No explicit origins listed for credentialed endpoints

### Related Rules/Skills/Trees
- Rule: API-CORS-002 (Credentials Policy)
- Skill: cors-configuration
- Tree: browser-security

---

## 4. CORS Configuration in Code

### Category
Poor Maintainability

### Description
Hardcoding CORS headers directly in middleware or controllers instead of using `config/cors.php`. For example, `$response->header('Access-Control-Allow-Origin', '*')` in a custom middleware.

### Why It Happens
Developers need a quick CORS fix during development and add header-setting code directly, bypassing the proper configuration system. The temporary fix becomes permanent.

### Warning Signs
- `header('Access-Control-Allow-*')` calls in middleware or controllers
- CORS headers set via `$response->header()` in multiple locations
- `config/cors.php` is empty or uses defaults while custom CORS logic exists
- CORS behavior differs across endpoints

### Why Harmful
CORS policy is scattered across the codebase, making it impossible to audit or update centrally. Middleware ordering issues cause CORS headers to be set inconsistently. Security reviews miss CORS configuration.

### Real-World Consequences
A security audit finds that one controller sets `Access-Control-Allow-Origin: *` while another uses the config file. The inconsistency creates a security hole that the wildcard controller exposes.

### Preferred Alternative
Configure all CORS settings in `config/cors.php`. Let `HandleCors` middleware apply settings globally and consistently.

### Refactoring Strategy
1. Remove all custom CORS header-setting code
2. Centralize configuration in `config/cors.php`
3. Verify all endpoints return consistent CORS headers
4. Add architecture test that forbids CORS header-setting outside config

### Detection Checklist
- [ ] CORS headers set outside `config/cors.php`
- [ ] Multiple files contain `Access-Control-Allow` references
- [ ] Inconsistent CORS behavior across endpoints
- [ ] `config/cors.php` unused or incomplete

### Related Rules/Skills/Trees
- Rule: API-CONFIG-001 (Centralized Configuration)
- Skill: cors-configuration
- Tree: configuration-management

---

## 5. ALLOW-ALL Development Config Leaked to Production

### Category
Configuration Drift

### Description
The development environment uses permissive CORS (all origins allowed, all methods, all headers) to simplify local development. This configuration is accidentally deployed to production through environment config files or missing environment variable overrides.

### Why It Happens
Configuration files are shared between environments. Environment variables that override CORS settings for production are not defined, so the permissive development defaults are used.

### Warning Signs
- `config/cors.php` defaults to `['*']` for allowed origins
- No production environment override for CORS settings
- CORS configuration hasn't changed since project initialization
- Production API accessible from any origin

### Why Harmful
The production API is exposed to cross-origin attacks. Any website can make browser-based requests, potentially with user credentials if `supports_credentials` is also enabled.

### Real-World Consequences
A startup deploys their API with permissive CORS from development. A marketing landing page makes API calls directly from JavaScript, which works perfectly. A security researcher finds the API is accessible from any origin, leading to a responsible disclosure report.

### Preferred Alternative
Use environment-specific CORS configuration. Default to restrictive settings in production. Override only for development environments.

### Refactoring Strategy
1. Set restrictive CORS defaults in `config/cors.php`
2. Use `env()` for environment-specific overrides
3. Add deployment check that verifies production CORS settings
4. Test CORS from unauthorized origin in production

### Detection Checklist
- [ ] Production CORS uses same config as development
- [ ] No environment-specific CORS overrides
- [ ] Production API accessible from any browser origin
- [ ] `config/cors.php` has permissive defaults

### Related Rules/Skills/Trees
- Rule: API-CONFIG-002 (Environment-Specific Configuration)
- Skill: api-lifecycle-governance
- Tree: deployment-security
