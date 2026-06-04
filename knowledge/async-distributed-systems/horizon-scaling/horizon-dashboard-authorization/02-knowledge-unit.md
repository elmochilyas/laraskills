# Metadata
Domain: Async & Distributed Systems
Subdomain: Horizon Scaling & Monitoring
Knowledge Unit: Horizon Dashboard Authorization
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary
The Horizon dashboard provides a web UI at `/horizon` with queue metrics, job monitoring, and retry functionality. Access is controlled by the `Horizon::auth()` callback in `AppServiceProvider`, which returns a boolean indicating whether the current user can access the dashboard. In production, this must be restricted to authorized administrators. The dashboard includes job management features (retry, delete) that are dangerous if exposed to unauthorized users.

# Core Concepts
- **`Horizon::auth()`**: Callback registered in `AppServiceProvider::boot()`. Receives the incoming request, returns `true`/`false`.
- **Default behavior**: In `local` environment, all access is granted. In other environments, no access is granted until `Horizon::auth()` is configured.
- **Route prefix**: `/horizon` by default, customizable via `horizon.path` config.
- **Middleware**: Customizable via `horizon.middleware` array in config. Default is `web` middleware.
- **Dashboard actions**: View metrics, retry failed jobs, delete failed jobs, pause/resume supervisors, terminate Horizon.

# Mental Models
- **Server room door**: The Horizon dashboard is the server room. `Horizon::auth()` is the keycard lock. By default, the door is open in development (local) and locked in production. You must explicitly authorize who gets a keycard.
- **Operations console**: Dashboard is the command center. Anyone with access can see all queue operations and retry/delete jobs. Authorization restricts this to ops personnel.

# Internal Mechanics
- Horizon registers a route group with the prefix configured in `config/horizon.php`.
- `HorizonCheckAuth` middleware runs before each dashboard request. It calls `Horizon::auth()` callback.
- If the callback returns `false`: 403 Forbidden response.
- The default `auth` callback:
  ```php
  Horizon::auth(function ($request) {
      return app()->environment('local');
  });
  ```
- The callback has access to `$request` — can check session, user roles, IP addresses, or other criteria.
- Custom middleware can be added via `horizon.middleware` config for additional security layers (IP whitelisting, basic auth, etc.).

# Patterns
## Role-Based Authorization
- **Purpose**: Only allow users with specific roles.
- **Benefit**: Integrates with existing authorization system.
- **Tradeoff**: Requires user authentication.

## IP-Restricted Access
- **Purpose**: Only allow access from internal IPs/VPN.
- **Benefit**: Simple, no user context needed.
- **Tradeoff**: Users outside VPN cannot access even if authenticated.

## Two-Factor Authentication
- **Purpose**: Require 2FA for dashboard access.
- **Benefit**: Additional security layer.
- **Tradeoff**: Added friction for legitimate users.

# Architectural Decisions
- **Always configure `Horizon::auth()` for production**: Never leave default (local-only) in production. Dashboard exposes sensitive operations.
- **Use role/permission checks in auth callback**: `$request->user()?->isAdmin()` — ensures only authorized personnel access the dashboard.
- **Protect dashboard routes with additional middleware**: Use IP whitelist middleware or basic auth alongside `Horizon::auth()`.
- **Consider removing Horizon routes in production entirely**: If no one needs to access the dashboard in production, don't register the route group (`horizon.routes = false` in config).

# Tradeoffs
Role-based auth | Granular control, user-level | Requires authentication system; session dependency
IP whitelist | Simple, no user context | Not suitable for remote teams/VPN
Route removal (production) | Maximum security, no exposure | No remote monitoring capability

# Performance Considerations
- Auth callback runs on every dashboard request. Keep it fast.
- No database queries should be needed in the auth callback for typical cases (check role on user object).
- Dashboard page loads are infrequent — auth overhead is negligible.

# Production Considerations
- Test dashboard access in staging before production deployment.
- Monitor dashboard access logs for unauthorized access attempts.
- If using `Horizon::auth()` with user roles, ensure the callback handles unauthenticated users gracefully (return `false`, not throw).
- The dashboard exposes job payload data, which may contain sensitive information. Restrict access accordingly.
- Retry functionality in the dashboard can replay failed jobs. Ensure only operators with proper understanding use it.

# Common Mistakes
- **Not configuring `Horizon::auth()` in production**: Dashboard is accessible to anyone accessing `/horizon`. Exposes full job payloads and retry capabilities.
- **Throwing exceptions in auth callback**: If the callback throws (e.g., calling `->user()` on an unauthenticated request), the dashboard returns an error instead of 403.
- **Assuming authentication gates work**: `Horizon::auth()` does NOT use Laravel gates/policies by default. Must be explicitly configured.
- **Using `Horizon::auth()` without checking environment**: The callback structure should allow `local` access AND production-authorized access.
- **Leaving Horizon routes registered in production**: Even with auth, having the routes registered exposes the dashboard's existence. Remove routes if dashboard is not used.

# Failure Modes
- **Auth callback bug locks everyone out**: If the callback returns `false` for all users, the dashboard is inaccessible. Requires code deploy to fix.
- **Session timeouts**: Authenticated user's session expires while viewing the dashboard, causing redirects to login.
- **Auth misconfiguration on multi-server**: Different auth config on different servers — dashboard access inconsistent.
- **Rate limiting on dashboard**: If dashboard is hit by a script (DDoS), Horizon still processes the requests, consuming resources.

# Ecosystem Usage
- **Laravel Horizon**: Built-in authorization via `Horizon::auth()` callback and route middleware configuration.
- **Laravel Forge**: Forge provides its own Horizon dashboard access via Forge UI, bypassing the application's dashboard.
- **Laravel Pulse**: Pulse has its own authorization mechanism (`Pulse::auth()`), configured separately.

# Related Knowledge Units
- K041 Horizon Supervisor Configuration (context)

## Research Notes
- Horizon's auto-balancing mode uses a scoring algorithm that reassigns worker processes between queues every few seconds — the scoring considers queue backlog depth and processing time to determine worker allocation.
- The alance:auto strategy in Horizon implements a "min/max" approach where each supervisor has a configured minProcesses and maxProcesses — the balancer adjusts within this range based on load.
- Horizon v5 (Laravel 11+) improved Redis cluster support by abstracting queue connections through a consistent hashing layer — jobs are distributed across cluster nodes based on job ID hash.
- The Horizon dashboard authorization gate can be customized via Horizon::auth() — exposing the dashboard without authentication in production is a common security gap.
- Horizon metrics (throughput, runtime, wait time) are stored in Redis with a retention period configured via 	rim — long retention can consume significant Redis memory in high-throughput environments.
- The horizon:snapshot command generates a work-in-progress report of all supervisors, processes, and queue metrics — useful for debugging queue backlogs during incidents.
- Silenced job tags in Horizon prevent specific job types from appearing in the "Completed Jobs" and "Failed Jobs" lists — this is a display-only filter that does not affect job processing or logging.
- Horizon's queue:monitor integration was added in Laravel 12 — it provides a Pulse integration for queue health dashboards beyond Horizon's own UI.
