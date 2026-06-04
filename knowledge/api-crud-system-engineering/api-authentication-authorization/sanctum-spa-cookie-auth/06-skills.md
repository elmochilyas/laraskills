# Skill: Implement Sanctum SPA Cookie Authentication

## Purpose
Configure Sanctum cookie-based auth for SPAs using `EnsureFrontendRequestsAreStateful` middleware, CORS credentials, CSRF token exchange, and session-based API routes.

## When To Use
- Single-page applications (Vue, React, Alpine) on same domain or subdomain
- First-party API consumers
- Cookie-based auth where HttpOnly cookies prevent XSS token theft

## When NOT To Use
- Third-party API consumers — use token-based auth
- Mobile apps — cookies not consistently available
- Server-to-server communication — use token auth

## Prerequisites
- Sanctum package installed
- CORS configuration for SPA domain
- Same-site cookie support

## Inputs
- SPA domain configuration
- CORS allowed origins

## Workflow
1. Configure SPA domain in `config/sanctum.php`: `'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS'))`
2. Apply `EnsureFrontendRequestsAreStateful` middleware to `api` group in `Kernel.php`
3. Configure CORS for SPA origin with `supports_credentials: true` in `config/cors.php`
4. Create CSRF cookie endpoint: `/sanctum/csrf-cookie` (GET)
5. SPA calls `/sanctum/csrf-cookie` first to get `XSRF-TOKEN` cookie
6. SPA login sends POST to `/login` with email/password and `X-XSRF-TOKEN` header from cookie
7. Sanctum creates session — subsequent requests authenticated via cookie
8. SPA logout calls POST `/logout` to destroy session
9. Test SPA flow: `$this->withCredentialsHeader()` and `withCsrfToken()` in feature tests
10. Set `SESSION_DRIVER=cookie` for SPA session persistence — avoids file/DB session conflicts

## Validation Checklist
- [ ] SPA domain configured in `config/sanctum.php`
- [ ] `EnsureFrontendRequestsAreStateful` middleware applied
- [ ] CORS configured with `supports_credentials: true` for SPA domain
- [ ] CSRF cookie endpoint registered and accessible
- [ ] SPA login flow works with XSRF-TOKEN + session cookie
- [ ] SPA requests authenticated via session cookie
- [ ] SPA logout destroys session
- [ ] Tests simulate SPA cookie auth flow
- [ ] `SESSION_DRIVER=cookie` for SPA deployments
- [ ] HTTPS enforced for cookie transmission in production

## Common Failures
- CORS with `supports_credentials: false` — browser blocks cookie transmission
- Missing `EnsureFrontendRequestsAreStateful` middleware — API returns 401 even with valid session
- SPA domain not in `stateful` config — Sanctum treats as token request
- No CSRF token exchange — POST requests fail with 419
- Not using HTTPS — cookies with `SameSite=None; Secure` won't work over HTTP
- SPA on different domain than API — requires extensive CORS and cookie config

## Decision Points
- Same-domain vs cross-domain SPA — same-domain easier, cross-domain requires `Secure; SameSite=None`
- CSRF cookie vs per-request token — CSRF cookie is standard for Sanctum
- Session driver — `cookie` for serverless, `file`/`database`/`redis` for traditional servers

## Performance Considerations
- CSRF cookie exchange adds one extra request before login
- Session-based auth is slightly slower than token-based (session read/write)
- Cookie size with session is <4KB — negligible overhead
- CORS preflight adds one OPTIONS request per new origin per day

## Security Considerations
- Sanctum protects against CSRF via XSRF-TOKEN
- HttpOnly session cookies prevent XSS token theft
- `SameSite=Strict` prevents CSRF from external sites
- HTTPS mandatory for cookie authentication in production
- Session fixation prevented by Sanctum's session regeneration on login

## Related Rules
- Configure SPA Domain In sanctum.php
- Apply EnsureFrontendRequestsAreStateful Middleware
- Configure CORS With supports_credentials: true
- Exchange CSRF Cookie Before Login
- Test SPA Auth Flow End-to-End
- Enforce HTTPS For Cookie Auth In Production

## Related Skills
- Sanctum Token Auth — for token-based comparison
- CORS Configuration — for CORS setup
- Same-Site Cookie Configuration — for cookie security
- Sanctum vs Passport Decision — for choosing auth approach

## Success Criteria
- SPA authenticates with CSRF cookie + session
- Subsequent requests to API are authenticated via session cookie
- Logout destroys session cookie
- Tests verify complete cookie auth flow
- CORS configured correctly for SPA origin with credentials
- HTTPS enforced in production
