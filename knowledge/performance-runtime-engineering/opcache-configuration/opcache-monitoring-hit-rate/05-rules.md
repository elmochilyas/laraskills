## Set alerts for OpCache hit rate below 99%
---
Category: Monitoring
---
Configure monitoring alerts when OpCache hit rate drops below 99%. At 95%, escalate urgently.
---
Reason: Each 1% decrease in hit rate increases CPU usage by ~0.5-1%. At 95% hit rate on a busy server, thousands of compilations per second occur, causing significant CPU overhead. Hit rate is a leading indicator of OpCache under-provisioning.
---
Bad Example:
```php
// No monitoring — silent degradation until outage
```

Good Example:
```php
$status = opcache_get_status(false);
$hitRate = $status['statistics']['hits'] /
    ($status['statistics']['hits'] + $status['statistics']['misses']) * 100;
if ($hitRate < 99) {
    // Alert: investigate OpCache sizing
}
if ($hitRate < 95) {
    // Urgent alert: increase memory_consumption / max_accelerated_files
}
```
---
Exceptions: Applications with very low traffic where hit rate variance is high due to small sample size.
---
Consequences Of Violation: Silent CPU increase, server saturation, performance degradation without root cause awareness.

## Alert on cache_full=true — never ignore it
---
Category: Monitoring
---
Create an immediate alert when opcache_get_status()['cache_full'] is true. This indicates max_accelerated_files is too low.
---
Reason: cache_full=true means the hash table has overflowed. Files exceeding the limit are never cached, forcing recompilation on every request. This flag is sticky — it persists until OpCache reset, so missed alerts lead to prolonged degradation.
---
Bad Example:
```php
$status = opcache_get_status(false);
// cache_full is true — ignored, no alert
// CPU has been 30% higher than normal for weeks
```

Good Example:
```php
if ($status['cache_full']) {
    // Alert immediately
    // Increase max_accelerated_files by 50% and reset OpCache
}
```
---
Exceptions: None. cache_full=true is always a configuration error.
---
Consequences Of Violation: Weeks of unnecessary CPU waste, slow performance degradation.

## Monitor wasted_memory percentage — restart when >5%
---
Category: Monitoring
---
Track current_wasted_percentage in OpCache status. Schedule PHP-FPM restart when it exceeds 5%.
---
Reason: Wasted memory is OpCache internal fragmentation from file evictions. As it grows, effective cache capacity shrinks. Periodic restarts compact the cache, reclaiming wasted memory. Unlike cache misses, wasted memory accumulates silently.
---
Bad Example:
```php
// Not monitoring wasted memory
// 15% wasted — 38MB of 256MB unusable
```

Good Example:
```php
$wasted = $status['memory_usage']['current_wasted_percentage'];
if ($wasted > 5) {
    // Schedule PHP-FPM restart during next maintenance window
}
```
---
Exceptions: Environments with validate_timestamps=0 where file changes (and thus evictions) are rare.
---
Consequences Of Violation: Gradual reduction in effective cache capacity, premature eviction of files.
