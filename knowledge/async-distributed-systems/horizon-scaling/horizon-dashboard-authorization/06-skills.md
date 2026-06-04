# Skill: Authorize Horizon Dashboard Access

## Purpose
Configure `Horizon::auth()` in `AppServiceProvider` to restrict Horizon dashboard access to authorized administrators in production.

## When To Use
Always before deploying Horizon to production. Required to prevent unauthorized access to job payloads, retry capabilities, and supervisor controls.

## When NOT To Use
Development environments (default local access is appropriate); when dashboard routes are disabled entirely.

## Prerequisites
- Horizon installed on the application
- User authentication system with role/permission support

## Inputs
- Authorization logic (role check, IP whitelist, etc.)
- Decision: enable routes in production or disable entirely

## Workflow
1. Configure `Horizon::auth()` in `AppServiceProvider::boot()`
2. Use role/permission checks: `$request->user()?->hasRole('admin')`
3. Return `false` for unauthenticated users — never throw
4. Keep callback fast — no database queries (use simple role checks)
5. Consider removing Horizon routes entirely in production via `routes` config
6. Add custom middleware via `horizon.middleware` for IP whitelisting
7. Default config grants `local` access only — do not change in production

## Validation Checklist
- [ ] `Horizon::auth()` configured for production
- [ ] Role/permission check (not `true` for everyone)
- [ ] `false` returned for unauthenticated (not exception)
- [ ] Callback fast — no DB queries
- [ ] Routes considered for disable in production
- [ ] `local` environment still has default access
- [ ] Dashboard returns 403 without auth in production

## Common Failures
- No auth in production — anyone can access `/horizon`
- Throwing in auth callback — 500 error instead of 403
- Leaving routes registered when not needed — attack surface exists
- Auth callback always returns `true` in production — no security
- Heavy computation in auth callback — slow dashboard page loads

## Decision Points
- Role-based: check user role/permission
- IP-restricted: whitelist internal network IPs
- Routes disabled: production = no remote monitoring needed

## Related Rules
- Rule 1: configure-horizon-auth-production
- Rule 2: return-false-not-exception
- Rule 3: consider-removing-horizon-routes
- Rule 4: keep-auth-callback-fast

## Related Skills
- Configure Horizon Supervisors for Queue Workers
- Monitor Horizon Metrics — Throughput, Runtime, Wait Time
- Configure Horizon Notifications for Wait Time Alerts

## Success Criteria
Horizon dashboard is protected by auth in production, unauthorized requests return 403, the callback is fast and doesn't throw, and routes can optionally be disabled entirely.
