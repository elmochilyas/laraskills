## Always include opcache_reset() in deployment scripts
---
Category: Reliability
---
Run opcache_reset() as a mandatory step in every deployment pipeline when validate_timestamps=0.
---
Reason: With validate_timestamps=0, OpCache never checks file modification times. Without explicit reset, the old compiled opcodes serve indefinitely. New code never executes until the cache is cleared.
---
Bad Example:
```bash
# Deployment without opcache_reset()
git pull
composer install
php artisan migrate
# New code never runs — old opcodes still cached
```

Good Example:
```bash
git pull
composer install
php artisan migrate --force
php -r "opcache_reset();"
# Optionally: warm cache with representative requests
```
---
Exceptions: Containerized deployments where each deploy creates a new container with fresh OpCache.
---
Consequences Of Violation: Deployments appear successful but old code continues running, forcing rollbacks.

## Warm the cache after opcache_reset() to prevent latency spikes
---
Category: Reliability
---
After opcache_reset(), execute representative requests to warm the cache before accepting production traffic.
---
Reason: First request after reset compiles all accessed files, causing 2-5s latency spikes. Pre-warming avoids user-facing latency by compiling files before traffic arrives.
---
Bad Example:
```bash
opcache_reset()
# First user request: 3s latency (compiling all files)
```

Good Example:
```bash
opcache_reset()
# Warm cache with key endpoints
curl http://localhost/health
curl http://localhost/api/products
# Now accept traffic — <100ms first request latency
```
---
Exceptions: Low-traffic applications where occasional latency spikes are acceptable.
---
Consequences Of Violation: 2-5s first-request latency after every deployment, poor user experience.

## Use PHP-FPM restart for preloading changes, not opcache_reset()
---
Category: Configuration
---
Always restart PHP-FPM when the preloading script or preloaded files change. opcache_reset() does not reload preloaded classes.
---
Reason: Preloaded classes are loaded at PHP-FPM startup. opcache_reset() clears the OpCache but doesn't re-execute the preload script. Only a full restart refreshes preloaded classes.
---
Bad Example:
```bash
# Changed preload.php, only calling opcache_reset()
php -r "opcache_reset();" ; # Preloading unchanged
```

Good Example:
```bash
systemctl restart php8.5-fpm ; # Re-executes preload script
```
---
Exceptions: None. Preloading changes always require PHP-FPM restart.
---
Consequences Of Violation: Old preloaded classes continue serving, mixed old/new class definitions.
