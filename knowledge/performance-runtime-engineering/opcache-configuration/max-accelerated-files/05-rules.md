## Always count PHP files including generated/cache files
---
Category: Configuration
---
Count all PHP files including vendor/, bootstrap/cache/, storage/framework/, and Doctrine proxy directories when sizing max_accelerated_files.
---
Reason: Generated files (cached routes, compiled views, config cache, Doctrine proxies) add 20-40% to total file count. Not counting them causes undersizing. Vendor files are the largest contributor, typically 60-80% of total.
---
Bad Example:
```bash
# Only counting app/ files — underestimates by 80%
find app -name '*.php' | wc -l
# Setting max_accelerated_files based on this
```

Good Example:
```bash
# Count ALL PHP files
find . -name '*.php' | wc -l # Includes vendor, cache, generated
```
---
Exceptions: None. Always count everything.
---
Consequences Of Violation: 60-80% of files uncached, constant recompilation, high CPU.

## Set max_accelerated_files ≥ total file count — never below
---
Category: Configuration
---
Ensure max_accelerated_files is at least 1.5x your total PHP file count. Never set it lower.
---
Reason: Setting below total file count means some files are never cached. Even frequently-used files may be evicted. At 1.5x, all files fit with headroom for temporary files and growth.
---
Bad Example:
```ini
; max_accelerated_files below file count
; 25000 files, max set to 20000 — 5000 never cached
opcache.max_accelerated_files=20000
```

Good Example:
```ini
; 25000 files × 1.5 = 37500, rounded to 40000
opcache.max_accelerated_files=40000
```
---
Exceptions: None. Always set above total file count.
---
Consequences Of Violation: cache_full=true, files evicted and recompiled, CPU waste.
