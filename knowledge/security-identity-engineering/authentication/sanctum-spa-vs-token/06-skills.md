# Skill: Configure Sanctum SPA Cookie Auth vs Token Auth for Appropriate Client Types

## Purpose
Select and configure Sanctum's SPA cookie authentication for browser-based first-party apps or token authentication for mobile, cross-domain, and third-party clients.

## When To Use
- Every Laravel application using Sanctum for API authentication
- Decision point when adding new client types (SPA, mobile, third-party)

## When NOT To Use
- Applications using Passport as the primary auth mechanism
- CLI-only applications without API clients

## Prerequisites
- Laravel Sanctum installed via `composer require laravel/sanctum`
- `php artisan vendor:publish --tag=sanctum-config`
- API routes created and client types identified

## Inputs
- Client type (browser SPA, mobile app, third-party API consumer)
- Domain relationship (same-domain, subdomain, cross-domain)
- CSRF protection requirements
- Session storage strategy (for SPA mode)

## Workflow (numbered)
1. Identify each client type consuming the API
2. For same-domain browser SPAs: configure SPA cookie auth (most secure for browsers)
3. For mobile apps: configure Bearer token auth
4. For cross-domain SPAs: configure Bearer token auth (cookie auth not feasible)
5. Configure SANCTUM_STATEFUL_DOMAINS for SPA cookie auth domains
6. Configure session driver: use Redis/memcached for production multi-server
7. Implement SPA CSRF flow: call `/sanctum/csrf-cookie` before login POST
8. Configure CORS with `supports_credentials: true` for SPA subdomain auth
9. Store Bearer tokens in secure device storage (not localStorage)
10. Regenerate session ID after login to prevent session fixation

## Validation Checklist
- [ ] SPA same-domain uses cookie auth, not Bearer tokens in localStorage
- [ ] SANCTUM_STATEFUL_DOMAINS includes all SPA domains
- [ ] Session driver is production-appropriate (Redis for multi-server)
- [ ] SPA calls `/sanctum/csrf-cookie` before login
- [ ] CORS configured with specific origins and `supports_credentials: true`
- [ ] Bearer tokens for mobile stored in secure device storage
- [ ] `session()->regenerate()` called after login
- [ ] Session ID regenerated after login (session fixation prevention)

## Common Failures
- Using Bearer tokens stored in localStorage for same-domain SPA (XSS vulnerable)
- Not configuring SANCTUM_STATEFUL_DOMAINS (SPA returns 401)
- Forgetting CSRF cookie call before login (419 CSRF mismatch)
- File session driver on multi-server (intermittent 401 errors)

## Decision Points
- **Cookie vs Token**: Cookie for same-domain browser apps; Token for mobile/cross-domain/third-party
- **Session driver**: Redis for multi-server production; file only for single-server dev
- **Stateful domains**: Every domain/subdomain where the SPA makes requests

## Performance Considerations
- SPA mode: session read/write on every request — Redis important in production
- Token mode: SHA-256 hash lookup — slightly faster for API-heavy apps (no session read)
- Both modes: negligible overhead with proper caching

## Security Considerations
- XSS: SPA mode more resistant (httpOnly session cookie — not accessible to JS)
- CSRF: SPA mode requires CSRF token exchange; Token mode does not
- Token leakage: Bearer tokens in every request header — leak via logs, referer headers
- Session fixation: Always regenerate session ID after login

## Related Rules (from 05-rules.md)
- Use SPA Cookie Auth for Same-Domain Browser Apps
- Configure SANCTUM_STATEFUL_DOMAINS for SPA Cookie Auth
- Always Call /sanctum/csrf-cookie Before SPA Login
- Use Production-Ready Session Driver for SPA Auth
- Store Bearer Tokens Securely, Not in localStorage
- Enable CORS With Credentials for SPA Subdomain Auth
- Regenerate Session ID After Login for SPA Auth

## Related Skills
- Scope Sanctum API Tokens with Abilities
- Configure Auth Guards and Providers
- Configure CORS for API Integration
- Configure Laravel Session Settings

## Success Criteria
- Same-domain SPA authenticated via httpOnly session cookies
- Mobile/cross-domain clients authenticated via Bearer tokens
- SANCTUM_STATEFUL_DOMAINS configured and verified working
- SPA CSRF flow works (no 419 errors on POST/PUT/DELETE)
- Bearer tokens not stored in localStorage for browser apps
- Session driver appropriate for production deployment
