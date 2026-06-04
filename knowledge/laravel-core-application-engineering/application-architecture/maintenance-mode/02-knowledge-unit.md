# Maintenance Mode

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Application Architecture & Structure
- **Knowledge Unit:** Maintenance Mode
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Maintenance mode in Laravel allows administrators to take the application offline during deployments, updates, or emergencies. When enabled, all incoming HTTP requests receive a 503 Service Unavailable response with a configurable view. The feature uses a file-based lock (`storage/framework/down`) combined with `Illuminate\Foundation\Http\Middleware\PreventRequestsDuringMaintenance` middleware.

The engineering value is providing a controlled, user-friendly way to take the application offline while allowing specific IPs, URLs, or authentication tokens to bypass maintenance mode for testing. It prevents users from seeing partial deployments, database migration errors, or incomplete updates.

---

## Core Concepts

### Enabling Maintenance Mode

```bash
# Basic maintenance mode
php artisan down

# With bypass secret
php artisan down --secret="1630542a-246b-4b53-aba0-1bd2c9e680ef"

# With retry header (seconds)
php artisan down --retry=60

# With custom status code
php artisan down --status=503

# With allow list
php artisan down --allow=127.0.0.1 --allow=192.168.1.0/24

# With custom template
php artisan down --render="errors.maintenance"
```

### Disabling Maintenance Mode

```bash
php artisan up
```

### Maintenance Mode Response

When in maintenance mode, the `PreventRequestsDuringMaintenance` middleware intercepts all requests and returns a 503 response. The response body is rendered from `resources/views/errors/503.blade.php` by default.

---

## Mental Models

### The On/Off Switch

Maintenance mode is a binary on/off switch for the entire application. When on, every request hits the maintenance middleware and returns a 503. There is no partial or degraded mode — it is all-or-nothing.

### The Bypass Mechanism

The bypass secret (when provided) creates a signed URL that bypasses maintenance mode:
- `https://example.com/1630542a-246b-4b53-aba0-1bd2c9e680ef`
- Visitors with this URL can access the application normally
- The signed URL stores a cookie on the visitor's browser for the session duration

This allows developers and testers to verify the deployment while regular users see the maintenance page.

---

## Internal Mechanics

### The Down File

```php
// storage/framework/down - JSON content
{
    "time": 1717022400,
    "message": "We are upgrading our system. Please check back soon.",
    "retry": 60,
    "secret": "1630542a-246b-4b53-aba0-1bd2c9e680ef",
    "status": 503,
    "template": "errors.maintenance",
    "allowed": ["127.0.0.1", "192.168.1.0/24"]
}
```

The `php artisan down` command writes this JSON file. The `php artisan up` command deletes it. The `PreventRequestsDuringMaintenance` middleware checks for this file's existence on every request.

### Middleware Resolution

1. `PreventRequestsDuringMaintenance::handle()` checks if `storage/framework/down` exists
2. If it does not exist, request passes through normally
3. If it exists, the middleware reads the JSON content
4. It checks if the request is from an allowed IP (CIDR or exact match)
5. It checks if the request URL matches the bypass secret
6. If bypassed, request passes through; otherwise, 503 response is returned

### Bypass Cookie

When a visitor accesses the secret URL:
1. The middleware detects the secret in the URL
2. It sets an `laravel_maintenance` encrypted cookie
3. The visitor is redirected to `/`
4. On subsequent requests, the middleware checks for the cookie
5. If the cookie is valid and not expired, the request passes through

---

## Patterns

### Custom Maintenance View

```blade
{{-- resources/views/errors/503.blade.php --}}
<x-layout>
    <div class="maintenance-page">
        <h1>Under Maintenance</h1>
        <p>{{ $exception?->getMessage() ?? 'We\'ll be back shortly.' }}</p>
        <p>Expected downtime: approximately 5 minutes.</p>
    </div>
</x-layout>
```

### Bypass with Secret URL

```bash
# Enable with secret
php artisan down --secret="deploy-$(date +%s)"

# Share the URL with the team
echo "https://example.com/deploy-$(date +%s)"
```

### Pre-Deploy Checklist

```bash
#!/bin/bash
php artisan down --retry=60 --message="Deploying new features..."
git pull origin main
composer install --no-dev
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan up
```

### Maintenance Mode with Queue Worker Drain

```bash
# Before enabling maintenance
php artisan horizon:pause

# Enable maintenance
php artisan down

# Wait for running jobs to finish (check Horizon dashboard)
# Deploy and migrate...

# Bring back up
php artisan up

# Resume queue
php artisan horizon:continue
```

---

## Architectural Decisions

### File-Based vs Database-Based Mode

| Concern | File-Based (Laravel) | Database-Based |
|---|---|---|
| Dependencies | None (filesystem) | Requires working database connection |
| Detection speed | Filesystem stat call | Database query |
| Scalability | Per-server (each server checks its own file) | Centralized (shared state) |
| Atomicity | File creation/deletion | Database transaction |
| Failure mode | File not written (app stays up) | DB down = no maintenance check |

Laravel's file-based approach is intentionally simple — it avoids the circular dependency of requiring a working database to detect maintenance mode.

### Secret vs IP Allowlist

| Concern | Secret URL | IP Allowlist |
|---|---|---|
| Ease of use | Share URL with team | Update IP list before down |
| Security | Anyone with URL can bypass | Only specific IPs bypass |
| Dynamic teams | No changes needed | Must add IP per developer |
| CI/CD integration | Easy (curl with secret) | Requires static IP |

Use secret URL for team access during deployment. Use IP allowlist for automated health checks and monitoring services.

---

## Tradeoffs

| Concern | With Custom View | Default View |
|---|---|---|
| Brand consistency | Full control | Framework default styling |
| User messaging | Specific (expected downtime, ETA) | Generic "down for maintenance" |
| Development effort | Build a view | Zero effort |
| Maintenance | Update view when brand changes | No maintenance |

---

## Performance Considerations

Maintenance mode checking adds a filesystem `stat()` call on every request to check for `storage/framework/down`. This is negligible (~0.01ms) and not a performance concern. When maintenance mode is active, request processing is minimal (middleware returns 503 immediately) — the application is faster under maintenance than under normal load.

---

## Production Considerations

- Always use `--secret` when enabling maintenance mode for deploys — this allows testing before bringing the app fully online
- Use `--retry=60` for search engine crawlers — they will retry after 60 seconds instead of giving up
- Customize `resources/views/errors/503.blade.php` with brand styling and expected downtime information
- Set up monitoring to alert if maintenance mode is active for longer than expected
- Coordinate maintenance mode with load balancer health checks — remove the server from the pool before taking it down
- Use the `--allow` flag for monitoring services (Pingdom, New Relic) so they don't trigger false alerts
- For multi-server deployments, maintenance mode is per-server — use orchestration (Forge, Envoyer) to coordinate across servers
- Consider `--render="errors.maintenance"` for a custom Blade view without modifying the global error template

---

## Common Mistakes

### Forgetting to Bring the App Back Up

`php artisan down` is run before deployment. The deployment succeeds. `php artisan up` is forgotten. The application shows 503 for hours until someone notices. Always automate `php artisan up` as the last step in deployment scripts.

### Using Maintenance Mode for Partial Updates

Maintenance mode is all-or-nothing. Taking the app down to update a single CSS file is overkill. Use versioned assets or CDN cache invalidation for static updates.

### No Bypass for Monitoring

Monitoring services (Pingdom, Healthchecks) trigger alerts when the site returns 503. If maintenance mode is planned, add monitoring IPs to the `--allow` list or disable monitoring checks during the maintenance window.

---

## Failure Modes

### Stale Down File

The `storage/framework/down` file is not cleaned up after a failed deploy script. The application remains in maintenance mode until manually fixed. Monitor down file existence and alert if active beyond the expected maintenance window.

### Maintenance Mode During Migration Failure

`php artisan down` is called, then `php artisan migrate --force` fails. The application is down with no easy way to revert. The down file must be manually deleted. Always have a rollback plan: `php artisan migrate:rollback` followed by `php artisan up`.

### Multi-Server State Mismatch

On a load-balanced setup, `php artisan down` is run on one server. Other servers still serve traffic. Users randomly see the maintenance page or the application depending on which server handles their request. Use orchestration (Forge, Envoyer, custom script) to enable maintenance mode on all servers simultaneously.

---

## Ecosystem Usage

Laravel Forge and Envoyer manage maintenance mode as part of their deployment scripts — Forge runs `php artisan down` before deploying and `php artisan up` after. Laravel Vapor handles maintenance mode at the infrastructure level (Lambda function disable) rather than using the framework's file-based approach. Laravel Horizon recommends pouncing the queue before enabling maintenance mode to allow running jobs to complete.

The `PreventRequestsDuringMaintenance` middleware is part of Laravel's default middleware stack (`$middleware` global group) and is always active. The `php artisan down` command accepts `--redirect` option for redirecting to a specific URL during maintenance. The `php artisan up` command deletes the down file and optionally runs any deferred tasks.

---

## Related Knowledge Units

- **Kernel Architecture** (this workspace) — how the middleware that checks maintenance mode is registered
- **Middleware Lifecycle** (this workspace) — where `PreventRequestsDuringMaintenance` runs in the pipeline
- **HTTP Exceptions** (this workspace) — 503 error page rendering
- **Bootstrapping Lifecycle** (this workspace) — how maintenance mode detection interacts with boot sequence
- **Application Class** (this workspace) — Application::isDownForMaintenance() check

---

## Research Notes

- Maintenance mode uses a JSON file at `storage/framework/down` as the state store
- The `PreventRequestsDuringMaintenance` middleware is registered in the global middleware stack
- Bypass is achieved via a signed URL or `laravel_maintenance` cookie
- CIDR notation is supported for IP allowlisting (e.g., `192.168.1.0/24`)
- The `--secret` bypass URL is `/{{secret}}` — no additional route registration needed
- `--render` option accepts a Blade view name for custom maintenance page without modifying 503.blade.php
- `--redirect` option redirects to a specific URL instead of showing the maintenance page
- PreventsRequestsDuringMaintenance has `$except` array for URLs that bypass maintenance mode
- Maintenance mode detection via `app()->isDownForMaintenance()` is available in application code
- `php artisan down --secret` generates a random secret if not provided
- The bypass cookie is encrypted and valid for the session lifetime
- Multi-server coordination requires external orchestration — the file-based approach is per-server
