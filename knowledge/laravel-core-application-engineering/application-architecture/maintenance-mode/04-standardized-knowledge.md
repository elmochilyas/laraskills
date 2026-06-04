# Maintenance Mode

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Application Architecture & Structure
- **Knowledge Unit:** Maintenance Mode
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02
- **ECC Phase:** 4

---

## Overview

Maintenance mode in Laravel allows administrators to take the application offline during deployments, updates, or emergencies. When enabled via `php artisan down`, all incoming HTTP requests receive a 503 Service Unavailable response with a configurable view. The feature uses a file-based lock (`storage/framework/down` — a JSON file) combined with `Illuminate\Foundation\Http\Middleware\PreventRequestsDuringMaintenance` middleware. It provides bypass mechanisms (secret URL, IP allowlist) for developers and monitoring services, and supports custom response views, retry headers, and redirect URLs.

---

## Core Concepts

1. **File-Based State Storage** — Maintenance mode state is stored in `storage/framework/down` as a JSON file containing `time`, `message`, `retry`, `secret`, `status`, `template`, and `allowed` fields. `php artisan down` writes this file; `php artisan up` deletes it. The `PreventRequestsDuringMaintenance` middleware checks for this file's existence on every request.

2. **PreventRequestsDuringMaintenance Middleware** — Registered in the global middleware stack, this middleware intercepts all requests when the down file exists. It checks the file, parses the JSON, evaluates bypass conditions (IP allowlist, secret URL, bypass cookie), and returns a 503 response if not bypassed.

3. **Bypass via Secret URL** — When `--secret` is provided, `/{{secret}}` becomes a signed URL that sets an encrypted `laravel_maintenance` cookie (valid for the session), then redirects to `/`. Subsequent requests from that browser pass through. The secret creates a no-auth bypass for team members during deployment verification.

4. **Bypass via IP Allowlist** — The `--allow` flag accepts IP addresses and CIDR ranges (e.g., `--allow=127.0.0.1 --allow=192.168.1.0/24`). Requests from these IPs bypass maintenance mode without requiring a secret URL. Used for monitoring services and internal infrastructure.

5. **Maintenance Mode Response** — Returns HTTP 503 (Service Unavailable) by default, configurable via `--status`. The response body renders `resources/views/errors/503.blade.php` by default, or a custom view specified via `--render`. The `--retry` option adds a `Retry-After` header for search engine crawlers.

---

## When To Use

- **Deployments** — Take the app offline during `git pull`, `composer install`, `artisan migrate`, and cache clear operations
- **Database migrations** — Prevent users from seeing inconsistent state during schema changes
- **Emergency maintenance** — Take the app offline to address incidents, security patches, or infrastructure failures
- **Major updates** — Large deployments where partial availability is worse than complete downtime
- **Queue worker drain** — Coordinate with Horizon/queue pause to let running jobs finish before deployment

---

## When NOT To Use

- **Static asset updates** — Use versioned assets, CDN cache invalidation, or asset hashing instead of taking the whole app down for a CSS/JS change
- **Configuration changes** — Use `.env` updates with `config:cache` (zero-downtime if using load-balanced rolling deploys)
- **Partial feature releases** — Use feature flags to disable incomplete features for specific users; maintenance mode is all-or-nothing
- **Single-instance bug fixes** — For critical bugs affecting a specific user group, consider selective feature gating or targeted fixes rather than taking the entire application offline
- **Database-only changes** — Many schema changes can be performed without downtime using zero-downtime migration tools; maintenance mode is for changes that absolutely require application unavailability

---

## Best Practices (WHY)

1. **Always use --secret for deployment bypass** — Without `--secret`, even developers cannot access the application to verify the deployment. The secret URL allows team members to test the deployed version while users see the maintenance page. Generate a dynamic secret per deployment: `php artisan down --secret="deploy-$(date +%s)"`.

2. **Set --retry for search engine crawlers** — `--retry=60` adds a `Retry-After: 60` header that tells crawlers to come back in 60 seconds. Without this, crawlers may interpret the 503 as a permanent failure and remove the site from search results.

3. **Customize the maintenance view** — Create a branded 503.blade.php that communicates expected downtime, estimated return time, and alternative contact methods. A generic framework error page looks unprofessional and frustrates users.

4. **Add monitoring IPs to --allow** — Monitoring services (Pingdom, New Relic, health checks) trigger alerts when the site returns 503. Add their IPs via `--allow` so they see the application normally during maintenance, preventing false alerts.

5. **Coordinate maintenance with queue drain** — Before enabling maintenance mode, pause Horizon/queue workers: `php artisan horizon:pause`. This allows running jobs to finish without new jobs starting. Resume after the app is back up: `php artisan horizon:continue`.

6. **Automate up/down in deployment scripts** — The most common maintenance mode mistake is forgetting `php artisan up` after deployment. Always include `php artisan up` as the last step in deployment scripts, with error handling for rollback.

7. **Use orchestration for multi-server deployments** — Maintenance mode is per-server (file-based). On load-balanced setups, run `php artisan down` on all servers simultaneously via orchestration tools (Forge, Envoyer, Ansible). Otherwise, users randomly see the maintenance page depending on which server handles their request.

---

## Architecture Guidelines

### File-Based vs Database-Based Maintenance Mode

| Concern | File-Based (Laravel) | Database-Based |
|---|---|---|
| Dependencies | None (filesystem) | Requires working database connection |
| Detection speed | Filesystem stat call (~0.01ms) | Database query (~1-10ms) |
| Scalability | Per-server (each server checks its own file) | Centralized (shared state across servers) |
| Atomicity | File creation/deletion | Database transaction |
| Failure mode | File not written (app stays up) | DB down = no maintenance check (app stays up) |

Laravel's file-based approach is intentionally simple — it avoids the circular dependency of requiring a working database to detect maintenance mode.

### Secret URL vs IP Allowlist

| Concern | Secret URL | IP Allowlist |
|---|---|---|
| Ease of use | Share URL with team | Update IP list before down |
| Security | Anyone with URL can bypass | Only specific IPs bypass |
| Dynamic teams | No changes needed | Must add IP per developer |
| CI/CD integration | Easy (curl with secret) | Requires static IP |
| Monitoring | Not practical | Add monitoring IPs |

### Pre-Deploy Checklist
```bash
# 1. Pause queue workers
php artisan horizon:pause

# 2. Enable maintenance mode
php artisan down --retry=60 --secret="deploy-$(date +%s)"

# 3. Deploy
git pull origin main
composer install --no-dev

# 4. Run migrations
php artisan migrate --force

# 5. Refresh caches
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 6. Bring app back up
php artisan up

# 7. Resume queue workers
php artisan horizon:continue
```

---

## Performance

- Maintenance mode checking adds a filesystem `stat()` call on every request (~0.01ms) — negligible
- When maintenance mode is active, request processing is minimal (middleware returns 503 immediately) — the application is actually faster under maintenance than under normal load
- The `storage/framework/down` file JSON is small (~200 bytes) — parsing adds no measurable overhead
- Multi-server orchestration adds network latency for coordinated down/up operations, but this is a deployment-time cost, not a per-request cost

---

## Security

- The bypass secret URL is not authenticated — anyone with the URL can access the application during maintenance. Treat the secret like a password: generate unique secrets per deployment, share only with the team
- The `laravel_maintenance` bypass cookie is encrypted and session-scoped — it cannot be forged or reused across sessions
- `--allow` with CIDR notation is evaluated for each request — ensure the allowlist is not overly broad (e.g., allow specific IPs, not entire subnets without reason)
- In maintenance mode, all custom middleware still runs for bypassed requests — security middleware (auth, rate limiting) remains active
- The down file is in `storage/framework/down` — ensure `storage/` is not web-accessible
- Do NOT expose maintenance mode status through API endpoints that bypass the middleware — this would allow attackers to detect maintenance windows

---

## Common Mistakes

### Forgetting to Bring the App Back Up
- **Description:** `php artisan down` is run before deployment; `php artisan up` is forgotten
- **Cause:** Deployment script fails before the `up` command; developer assumes the script succeeded
- **Consequence:** Application shows 503 for hours until someone notices
- **Better:** Always automate `php artisan up` as the last deployment step; use a monitoring alert if maintenance mode is active beyond the expected window

### Using Maintenance Mode for Partial Updates
- **Description:** Taking the application down to update a single CSS file or static asset
- **Cause:** Over-applying maintenance mode to problems solvable with other strategies
- **Consequence:** Unnecessary downtime for a change that could be deployed without user-visible impact
- **Better:** Use versioned assets (`mix('css/app.css')` with cache busting) or CDN cache invalidation for static updates

### No Bypass for Monitoring
- **Description:** Enabling maintenance mode without adding monitoring IPs to `--allow`
- **Cause:** Assuming monitoring services handle 503 gracefully (many do not)
- **Consequence:** Monitoring services trigger alerts when the site returns 503, causing false-positive incident responses during planned maintenance
- **Better:** Add monitoring IPs to `--allow` or disable monitoring checks during the maintenance window

### Multi-Server State Mismatch
- **Description:** `php artisan down` run on one server but not others in a load-balanced setup
- **Cause:** Manual execution on individual servers without orchestration
- **Consequence:** Users randomly see the maintenance page or the application depending on which server handles their request
- **Better:** Use orchestration (Forge, Envoyer, Ansible, custom SSH script) to enable/disable maintenance mode on all servers simultaneously

---

## Anti-Patterns

- **Manual Maintenance Mode** — SSHing into servers and running `php artisan down`/`up` manually. Deployment scripts should handle this automatically. Manual steps are forgotten, mistimed, or executed on the wrong server.
- **Extended Maintenance Windows** — Leaving the application in maintenance mode for hours during working hours. Maintenance should be planned during low-traffic periods and limited to the minimum time needed.
- **Generic Error Page** — Using Laravel's default 503 view without customization. A generic error page during maintenance looks unprofessional and provides no useful information to users.
- **No Queue Coordination** — Enabling maintenance mode while queue workers are still processing jobs. New jobs may be dispatched during deployment and lost when the queue connection changes. Always pause workers before going down.

---

## Examples

### Enabling Maintenance Mode with All Options
```bash
# Full maintenance mode configuration
php artisan down \
    --retry=60 \
    --secret="deploy-1717022400" \
    --status=503 \
    --allow=127.0.0.1 \
    --allow=192.168.1.0/24 \
    --render="errors.maintenance" \
    --message="We are upgrading our system. Please check back in 5 minutes."
```

### Custom Maintenance View
```blade
{{-- resources/views/errors/503.blade.php --}}
<x-layout>
    <div class="maintenance-page">
        <h1>Under Maintenance</h1>
        <p>{{ $exception?->getMessage() ?? "We'll be back shortly." }}</p>
        <p>Expected downtime: approximately 5 minutes.</p>
        <p>Follow @status on Twitter for updates.</p>
    </div>
</x-layout>
```

### Bypass URL Sharing
```bash
# Enable with timestamp-based secret
php artisan down --secret="deploy-$(date +%s)"

# Share with team
echo "Bypass URL: https://example.com/deploy-$(date +%s)"
```

### Deply Script with Rollback Handling
```bash
#!/bin/bash
set -e

php artisan down --retry=60 --secret="deploy-$(date +%s)"

if git pull origin main && composer install --no-dev && php artisan migrate --force; then
    php artisan config:cache
    php artisan route:cache
    php artisan up
    echo "Deployment successful"
else
    php artisan up
    echo "Deployment failed — app returned to online state"
    exit 1
fi
```

---

## Related Topics

- **Kernel Architecture** — how the `PreventRequestsDuringMaintenance` middleware is registered in the global stack
- **Middleware Lifecycle** — where maintenance mode checking runs in the middleware pipeline
- **HTTP Exceptions** — 503 error page rendering and customization
- **Bootstrapping Lifecycle** — how maintenance mode detection interacts with boot sequence
- **Application Class** — `Application::isDownForMaintenance()` check in application code

---

## AI Agent Notes

- Maintenance mode uses a JSON file at `storage/framework/down` as the state store
- The `PreventRequestsDuringMaintenance` middleware is registered in the global middleware stack and runs on every request
- Bypass is achieved via a signed URL or encrypted `laravel_maintenance` cookie
- CIDR notation is supported for IP allowlisting
- The `--secret` bypass URL is `/{{secret}}` — no additional route registration needed
- `--render` option accepts a Blade view name for custom maintenance page without modifying `503.blade.php`
- `--redirect` option redirects to a specific URL instead of showing the maintenance page
- Maintenance mode detection via `app()->isDownForMaintenance()` is available in application code
- Multi-server coordination requires external orchestration — the file-based approach is per-server
- Always suggest automation of `up`/`down` in deployment scripts; never suggest manual maintenance mode management

---

## Verification

- [ ] Can enable and disable maintenance mode with all relevant options
- [ ] Understands the file-based state storage mechanism
- [ ] Knows how the bypass secret and IP allowlist work
- [ ] Can customize the maintenance view
- [ ] Understands the deployment workflow (queue drain → down → deploy → up → resume)
- [ ] Can identify and fix common mistakes (forgetting `up`, no monitoring bypass)
- [ ] Understands why file-based approach is preferred over database-based for this use case
- [ ] Knows how to coordinate maintenance mode across multiple servers
