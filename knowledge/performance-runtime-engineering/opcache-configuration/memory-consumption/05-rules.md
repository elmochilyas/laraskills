## Calculate memory_consumption from file count, never guess
---
Category: Configuration
---
Set memory_consumption = (total php file count × 10KB) / 0.8. Start at 256MB for Laravel/Symfony.
---
Reason: The default 128MB is insufficient for virtually all framework applications. A Laravel app with 20K files needs 200MB + 20% headroom = 256MB minimum. Guessing leads to under-provisioning and cache thrashing.
---
Bad Example:
```ini
; Default 128MB for a Laravel app — guaranteed cache_full
opcache.memory_consumption=128
```

Good Example:
```bash
# Count files
find . -name '*.php' | wc -l # 25000
# Calculate: 25000 × 10KB / 0.8 = 312MB → set 384MB
opcache.memory_consumption=384
```
---
Exceptions: Small applications (<5000 files) where 128MB default is sufficient.
---
Consequences Of Violation: cache_full → eviction → 50%+ CPU increase.

## Increase memory_consumption by 50% when cache_full occurs
---
Category: Maintainability
---
When cache_full=true, increase memory_consumption by 50% (not 10-20%). Small increments don't provide meaningful headroom.
---
Reason: cache_full=true means memory is critically undersized. A 10% increase provides minimal additional capacity before hitting the same problem. 50% provides meaningful headroom and reduces frequency of adjustments.
---
Bad Example:
```ini
; Small increment — problem returns quickly
opcache.memory_consumption=256 → 272
```

Good Example:
```ini
; Meaningful increase
opcache.memory_consumption=256 → 384
```
---
Exceptions: Applications with stable, known file counts where 50% overshoots significantly.
---
Consequences Of Violation: Repeated cache_full events, requiring frequent adjustments.
