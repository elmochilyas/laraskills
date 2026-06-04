## Run php artisan octane:test in CI/CD pipeline before every deployment
---
Category: Testing
---
Add `php artisan octane:test` to the CI/CD pipeline and fail the build if Octane compatibility checks fail after any dependency change.
---
Reason: A package update or code change can silently introduce Octane incompatibility — a static property, a $_SESSION access, or a singleton misuse. octane:test runs a battery of compatibility checks that catch these issues before deployment. Without it, incompatible changes reach production, causing state leaks, data corruption, or worker crashes that are extremely difficult to correlate with the triggering change.
---
Bad Example:
```bash
# No Octane compatibility check — leaks reach production
# composer update adds package with static cache — data leak between users
```

Good Example:
```bash
# octane:test in CI
php artisan octane:test  # Fails — incompatible package detected
# Build blocked, developer investigates before merge
```
---
Exceptions: Applications with no third-party dependencies (first-party packages only) still benefit from octane:test for app code auditing.
---
Consequences Of Violation: Undetected Octane incompatibility reaches production, cross-request data leakage, intermittent failures extremely difficult to debug.

## Start with 4 workers and 1000 max_requests as default — tune from monitoring, not guesses
---
Category: Configuration
---
Begin every Octane deployment with 4 workers and max_requests=1000 as the safe default, then adjust based on observed RSS growth, listen queue, and database connection utilization.
---
Reason: Starting with too many workers risks immediate memory or connection exhaustion. Starting with too few causes performance complaints that lead to premature tuning. Four workers is a safe baseline for most servers — it provides meaningful concurrency without exceeding typical resource budgets. After 24-48 hours of monitoring, increase or decrease based on actual utilization data rather than theoretical formulas.
---
Bad Example:
```bash
# Guessing worker count without data
php artisan octane:start --workers=16  # May exhaust memory or DB connections
```

Good Example:
```bash
# Start conservative, tune with data
php artisan octane:start --workers=4 --max-requests=1000
# After 48 hours: RSS at 60%, listen queue at 0, DB connections at 30%
# Increase to 8 workers — validated by data
```
---
Exceptions: Applications with already-established capacity planning data may start with their calculated worker count directly.
---
Consequences Of Violation: Memory or connection exhaustion from over-provisioning (too many workers) or suboptimal throughput from under-provisioning (too few).

## Always run Octane behind a reverse proxy in production
---
Category: Security
---
Place Octane's HTTP server behind Nginx, Caddy, or a cloud load balancer — never bind Octane to a public interface or expose it directly to the internet.
---
Reason: Octane's built-in HTTP server is designed for PHP execution, not edge security. A reverse proxy provides SSL termination, rate limiting, static file serving (eliminating PHP overhead for asset requests), slow HTTP attack protection, and connection limiting. Exposing Octane directly bypasses all these protections and increases attack surface for PHP worker processes.
---
Bad Example:
```bash
# Octane exposed directly — security risk
php artisan octane:start --host=0.0.0.0 --port=80
```

Good Example:
```bash
# Octane on localhost only, Nginx in front
php artisan octane:start --host=127.0.0.1 --port=8000
```
---
Exceptions: Development environments and internal-only APIs may bypass the reverse proxy.
---
Consequences Of Violation: Exposure to HTTP-based attacks, no SSL termination, static file requests consuming PHP workers unnecessarily, increased risk of worker exhaustion.

## Use --watch for development, never for production
---
Category: Framework Usage
---
Enable the --watch flag during development for automatic worker reload on file changes, but never include it in production configuration.
---
Reason: The --watch flag monitors the filesystem for changes and triggers worker restart when files are modified. In production, this causes unexpected worker recycling whenever deployment scripts touch files or log files are rotated. The filesystem watcher also consumes CPU and I/O resources that should be dedicated to request handling. Production reloads should be explicit (octane:reload), not reactive.
---
Bad Example:
```bash
# --watch in production — unexpected reloads
php artisan octane:start --watch  # File changes from deploy scripts trigger restarts
```

Good Example:
```bash
# Development
php artisan octane:start --watch
# Production
php artisan octane:start
php artisan octane:reload  # Explicit, controlled reload
```
---
Exceptions: None. --watch is a development-only feature.
---
Consequences Of Violation: Unexpected worker recycling during file writes, unnecessary CPU usage from filesystem monitoring, potential race conditions during deployment.
