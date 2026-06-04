## Enable OpCache first, tune later — never run production without it
---
Category: Performance
---
Always enable OpCache as the first PHP optimization in production. Default settings still provide 1.5-2x throughput.
---
Reason: OpCache is the single highest-ROI PHP optimization. Default settings still provide significant gains. Delaying enablement to tune first wastes performance that could be captured immediately.
---
Bad Example:
```ini
; Not enabled while "researching optimal settings"
; Application runs at 50% potential throughput
```

Good Example:
```ini
opcache.enable=1 ; Enable immediately, tune later
; Then progressively: memory, files, preloading
```
---
Exceptions: Development environments where file changes must be immediately visible.
---
Consequences Of Violation: 50-75% lower throughput than possible, unnecessary CPU waste.

## Never disable OpCache for debugging
---
Category: Maintainability
---
Keep OpCache enabled during debugging. OpCache does not affect PHP behavior or error messages.
---
Reason: OpCache caches compiled opcodes but does not alter PHP execution semantics, error handling, or output. Disabling it changes only performance, not correctness. Debug the code, not the cache.
---
Bad Example:
```bash
# Disabling OpCache to "see if it fixes the bug"
php -d opcache.enable=0 artisan ...
```

Good Example:
```bash
# Keep OpCache enabled — it doesn't affect behavior
php artisan ...
```
---
Exceptions: Debugging OpCache-related issues like stale code or optimization-induced bugs.
---
Consequences Of Violation: Lost performance during debugging, unnecessary environment changes.

## Automate opcache_reset() in every deployment pipeline
---
Category: Reliability
---
Call opcache_reset() as a mandatory step in all deployment scripts when validate_timestamps=0.
---
Reason: With validate_timestamps=0 (production best practice), OpCache never detects file changes. Without explicit reset, new code never executes. This is a critical operational procedure, not optional.
---
Bad Example:
```bash
# Deploy without cache invalidation
git pull
# New code never executes — old opcodes served
```

Good Example:
```bash
git pull
php artisan migrate --force
php -r "opcache_reset();" # Mandatory step
```
---
Exceptions: Containerized deployments where new containers have fresh OpCache.
---
Consequences Of Violation: Deployments that appear successful but run old code.
