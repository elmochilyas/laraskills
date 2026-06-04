## Always pair validate_timestamps=0 with deployment automation
---
Category: Reliability
---
Never set validate_timestamps=0 without implementing opcache_reset() in your deployment pipeline.
---
Reason: With validate_timestamps=0, PHP never checks file modification times. Code changes never take effect until opcache_reset() is called or PHP-FPM is restarted. Stale code silently serves to users.
---
Bad Example:
```bash
# Deployment without OpCache reset — old code continues serving
git pull
php artisan migrate --force
# deploy complete? NO — OpCache still has old opcodes
```

Good Example:
```bash
# Deployment with OpCache reset
php artisan down
git pull
php artisan migrate --force
php -r "opcache_reset();" # or via web endpoint
php artisan up
```
---
Exceptions: Containerized deployments where new containers start fresh (new container = fresh OpCache).
---
Consequences Of Violation: Deployments appear to succeed but old code continues serving, causing confusion and rollbacks.

## Set revalidate_freq=0 when validate_timestamps=0
---
Category: Maintainability
---
Always set revalidate_freq=0 in conjunction with validate_timestamps=0 for clarity and documentation.
---
Reason: revalidate_freq is ignored when validate_timestamps=0, but setting it to 0 documents intent and prevents confusion if someone later enables timestamp validation without adjusting revalidate_freq.
---
Bad Example:
```ini
; revalidate_freq=2 with validate_timestamps=0 — misleading
opcache.validate_timestamps=0
opcache.revalidate_freq=2
```

Good Example:
```ini
; Clean configuration
opcache.validate_timestamps=0
opcache.revalidate_freq=0
```
---
Exceptions: None. Setting revalidate_freq=0 is harmless and improves clarity.
---
Consequences Of Violation: Potential confusion if validate_timestamps is later enabled without adjusting revalidate_freq.
