## Use cachetool for production OpCache resets — never manual SSH
---
Category: Reliability
---
Automate OpCache reset via cachetool CLI in CI/CD pipelines. Never SSH into production servers to manually reset OpCache.
---
Reason: Manual SSH resets introduce human error, are not repeatable across multi-server fleets, and create audit gaps. cachetool automates the reset across all workers via a protected HTTP endpoint, integrating cleanly with deployment pipelines.
---
Bad Example:
```bash
# Manual SSH — error-prone, not repeatable
ssh server1 "php -r 'opcache_reset();'"
ssh server2 "php -r 'opcache_reset();'"
```

Good Example:
```bash
# Automated via cachetool in CI/CD
cachetool opcache:reset --web --web-path=http://localhost/opcache.php
```
---
Exceptions: Single-server deployments where SSH is the standard deployment mechanism.
---
Consequences Of Violation: Reset skipped on some servers, stale code serving from uncached workers.

## Always warm cache after every OpCache reset
---
Category: Performance
---
Execute representative requests to warm the OpCache immediately after every opcache_reset() call.
---
Reason: After reset, the first request to each file triggers compilation (2-5s cold-start). Warming the cache with representative requests before accepting user traffic eliminates this latency spike.
---
Bad Example:
```bash
opcache_reset()
# First user request: 3s latency (all files recompiling)
```

Good Example:
```bash
opcache_reset()
# Warm critical endpoints
curl http://localhost/api/health
curl http://localhost/api/products
# Now accept user traffic
```
---
Exceptions: Low-traffic applications where occasional latency spikes are acceptable.
---
Consequences Of Violation: 2-5s first-request latency after every deployment, poor user experience.

## Restart PHP-FPM when preloading script changes — opcache_reset() is insufficient
---
Category: Configuration
---
Always perform a full PHP-FPM restart when the preloading script or any preloaded file changes.
---
Reason: opcache_reset() clears the OpCache but does NOT re-execute the preload script. Preloaded classes survive the reset. Only a full PHP-FPM restart loads new preloaded classes.
---
Bad Example:
```bash
# Changed preload.php — only calling opcache_reset()
cachetool opcache:reset --all
# Preloaded classes unchanged — old definitions served
```

Good Example:
```bash
# Full restart required
systemctl restart php8.5-fpm
```
---
Exceptions: Deployments where preloading has not changed (only application code).
---
Consequences Of Violation: Old preloaded classes continue serving, mixed old/new definitions, deployment inconsistency.

## Secure the opcache_reset() web endpoint
---
Category: Security
---
Protect the opcache_reset() web endpoint with authentication token, IP whitelist, or internal network restriction.
---
Reason: An exposed opcache_reset() endpoint allows attackers to force constant OpCache resets, degrading performance to zero. Every reset triggers mass recompilation, creating a denial-of-service vector.
---
Bad Example:
```php
// No protection — anyone can reset OpCache
Route::get('/opcache-reset', fn() => opcache_reset());
```

Good Example:
```php
// Authentication required
Route::get('/opcache-reset', fn() => opcache_reset())
    ->middleware(['auth', 'throttle:1,60']);
```
---
Exceptions: Internal-only networks with no external access where IP restriction suffices.
---
Consequences Of Violation: Denial-of-service attack vector, constant performance degradation from forced resets.
