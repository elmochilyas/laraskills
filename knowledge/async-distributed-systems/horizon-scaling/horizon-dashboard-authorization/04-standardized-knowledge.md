# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Horizon Scaling & Monitoring
- **Knowledge Unit:** K082 — Horizon Dashboard Authorization
- **Knowledge ID:** K082
- **Difficulty Level:** Foundation
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Docs — Horizon: Dashboard Authorization
  - Laravel Source — `Laravel\Horizon\Horizon`

---

# Overview

The Horizon dashboard provides a web UI at `/horizon` with queue metrics, job monitoring, and retry functionality. Access is controlled by the `Horizon::auth()` callback in `AppServiceProvider`, which returns a boolean indicating whether the current user can access the dashboard. In production, this must be restricted to authorized administrators. The dashboard includes job management features (retry, delete) that are dangerous if exposed to unauthorized users.

---

# Core Concepts

- **`Horizon::auth()`:** Callback in `AppServiceProvider::boot()`. Receives request, returns true/false.
- **Default behavior:** `local` environment — all access granted. Other environments — no access until configured.
- **Route prefix:** `/horizon` by default, customizable via `horizon.path` config.
- **Middleware:** Customizable via `horizon.middleware` array. Default is `web` middleware.
- **Dashboard actions:** View metrics, retry/delete failed jobs, pause/resume supervisors, terminate Horizon.

---

# When To Use

- Always — configure `Horizon::auth()` in production before deploying Horizon
- Role-based access — only authorized administrators can view queue operations
- IP-restricted access — limit dashboard to internal network or VPN

---

# When NOT To Use

- Development environments — default local access is appropriate
- When dashboard routes are removed entirely (`horizon.routes = false`) — no access needed

---

# Best Practices

- **Always configure `Horizon::auth()` for production.** Never leave default local-only access. *Why: The dashboard exposes job payloads (potentially containing PII), retry capabilities, and supervisor controls — unauthorized access is a security and operational risk.*
- **Use role/permission checks in the auth callback.** `$request->user()?->isAdmin()` — integrates with existing authorization. *Why: Role-based access ensures only authorized personnel can perform destructive actions like retrying or deleting jobs.*
- **Handle unauthenticated users gracefully.** Return `false`, not throw an exception. *Why: An exception in the auth callback returns a 500 error instead of 403, and may leak error details.*
- **Consider removing Horizon routes in production entirely.** If no remote monitoring is needed, disable routes. *Why: Removing routes eliminates the attack surface entirely — no auth callback can be bypassed if the route doesn't exist.*

---

# Architecture Guidelines

- Horizon registers a route group with the configured prefix.
- `HorizonCheckAuth` middleware runs before each dashboard request.
- If the callback returns `false`: 403 Forbidden response.
- Custom middleware can be added via `horizon.middleware` config for IP whitelisting, basic auth, etc.
- The auth callback has access to `$request` — can check session, user roles, IP, or other criteria.

---

# Performance Considerations

- Auth callback runs on every dashboard request — keep it fast (no DB queries).
- Dashboard page loads are infrequent — auth overhead is negligible.
- No caching needed for auth decisions — callback logic should be simple role/IP checks.

---

# Security Considerations

- Dashboard exposes job payload data — may contain PII, API keys, or business data.
- Retry functionality can replay failed jobs — ensure operators understand the implications.
- Delete functionality permanently removes failed job records — no undo.
- Supervisor pause/terminate controls can stop all queue processing.
- Default config grants `local` access only — do not change this default in production without explicit auth configuration.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| No auth in production | Not configuring `Horizon::auth()` | Anyone can access `/horizon` | Configure auth callback |
| Throwing in auth callback | Calling methods on null user | 500 error instead of 403 | Handle unauthenticated gracefully |
| Assuming gates work | Not configuring auth | Dashboard still accessible | Explicitly configure auth |
| Leaving routes registered | Not disabling when unused | Attack surface exists | Remove routes or restrict |

---

# Anti-Patterns

- **Auth callback that always returns `true` in production:** Effectively disables all access control.
- **Auth callback that does heavy computation or DB queries:** Every dashboard page load triggers expensive operations.
- **Sharing dashboard URL publicly:** Even with auth, the endpoint existence is known — a security-by-obscurity risk.

---

# Examples

```php
// In AppServiceProvider::boot()

// Role-based authorization
Horizon::auth(function ($request) {
    return app()->environment('local')
        || ($request->user() && $request->user()->hasRole('admin'));
});

// IP-restricted authorization
Horizon::auth(function ($request) {
    return in_array($request->ip(), ['10.0.0.0/8', '172.16.0.0/12']);
});

// Disable routes in production (config/horizon.php)
'routes' => env('HORIZON_ROUTES_ENABLED', !app()->environment('production')),

// Custom middleware
'middleware' => ['web', 'auth', 'verified'],
```

---

# Related Topics

- **K041 Horizon Supervisor Configuration (K041)** — Horizon configuration context

---

# AI Agent Notes

- Always generate `Horizon::auth()` configuration when generating Horizon setup code for production environments.
- Default to role-based auth checking `$request->user()?->isAdmin()` or similar.
- For sensitive deployments, recommend disabling routes in production via `horizon.routes = false`.
- Never generate auth callbacks that always return `true` in production.

---

# Verification

- [ ] Dashboard accessible in `local` without auth — confirm default behavior
- [ ] Dashboard returns 403 without auth in production — verify unauthorized access blocked
- [ ] Role-based auth works — verify users with correct role can access
- [ ] IP-restricted auth works — verify access from authorized IPs only
- [ ] Routes disabled in production — verify `/horizon` returns 404 when routes disabled
- [ ] Unauthenticated requests handled gracefully — verify 403, not exception
