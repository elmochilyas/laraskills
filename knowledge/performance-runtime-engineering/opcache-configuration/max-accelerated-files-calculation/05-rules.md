## Always count total PHP files including vendor before setting max_accelerated_files
---
Category: Configuration
---
Never guess max_accelerated_files. Count all PHP files including vendor/ and generated files, then set to 1.5x that count.
---
Reason: Vendor files account for 60-80% of total file count in framework applications. Not counting them guarantees undersizing. 1.5x provides headroom for growth and temporary files.
---
Bad Example:
```ini
; Guessing 10000 for a Laravel app with 25K files
opcache.max_accelerated_files=10000 ; 15K files never cached
```

Good Example:
```bash
find . -name '*.php' | wc -l # Count: 25000
# Set to 25000 × 1.5 = 37500, round to 40000
opcache.max_accelerated_files=40000
```
---
Exceptions: Very small applications where default 10000 is clearly sufficient (<5000 files).
---
Consequences Of Violation: cache_full=true, 60% of files never cached, constant recompilation, CPU spike.

## Monitor cache_full — it never clears automatically
---
Category: Monitoring
---
Always monitor opcache_get_status()['cache_full']. Once set, this flag persists until OpCache reset or PHP-FPM restart.
---
Reason: cache_full=true means max_accelerated_files has been exceeded. The flag is sticky — even if file count decreases, it remains true until explicitly reset. Missing this signal means performance degradation goes undetected.
---
Bad Example:
```php
// Not checking cache_full — silent degradation
$status = opcache_get_status(false);
// $status['cache_full'] may be true for days
```

Good Example:
```php
$status = opcache_get_status(false);
if ($status['cache_full']) {
    // Alert immediately — increase max_accelerated_files
    // Reset OpCache after config change
}
```
---
Exceptions: None. Always monitor cache_full in production.
---
Consequences Of Violation: Silent performance degradation, files not cached, CPU waste for weeks or months.

## Round max_accelerated_files to known prime numbers for predictable behavior
---
Category: Configuration
---
Set max_accelerated_files using known prime values (10000, 20000, 40000, 100000) for predictable hash table sizing.
---
Reason: OpCache rounds max_accelerated_files to the nearest prime internally. Using well-known prime-adjacent values (like 20000 → 20021) makes the effective limit predictable. Non-standard values may round unexpectedly.
---
Bad Example:
```ini
; Non-standard value — unpredictable rounding
opcache.max_accelerated_files=17341 ; Rounds to unknown prime
```

Good Example:
```ini
; Known prime-adjacent value
opcache.max_accelerated_files=40000 ; → rounds to 40009
```
---
Exceptions: Settings that precisely match your file count requirements are fine at any value.
---
Consequences Of Violation: Effective limit may be lower than expected, unexpected cache_full.
