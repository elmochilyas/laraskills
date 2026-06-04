---
## Rule Name

Monitor oom_restarts, hash_restarts, and cache_full

## Category

Performance

## Rule

Always monitor `oom_restarts`, `hash_restarts`, and `cache_full` from `opcache_get_status()` and alert on any non-zero value.

## Reason

These are the three critical indicators of OpCache misconfiguration. Non-zero values signal undersized resources — memory_consumption too small (oom_restarts), max_accelerated_files too small (hash_restarts), or both (cache_full). They indicate imminent performance degradation from cache thrashing.

## Bad Example

```php
// Proactively looking at these counters only when performance is already degraded
```

## Good Example

```php
$status = opcache_get_status(false);
$stats = $status['opcache_statistics'];
if ($stats['oom_restarts'] > 0 || $stats['hash_restarts'] > 0 || $status['cache_full']) {
    alert('OpCache configuration issue detected');
}
```

## Exceptions

Temporary non-zero values immediately after a deployment before warm-up completes.

## Consequences Of Violation

Files repeatedly evicted and recompiled, 50%+ CPU wasted on recompilation, hit rate below 99%, gradual performance degradation.

---

## Rule Name

Never Set log_verbosity_level Above 1 in Production

## Category

Performance

## Rule

Always keep `opcache.log_verbosity_level=1` (default) in production. Never use levels 2–4 outside of temporary debugging sessions.

## Reason

High verbosity levels log every OpCache operation — cache hits, misses, compilation events — generating significant log volume and consuming CPU on logging. Level 4 can cause measurable performance degradation and rapidly fill disk space.

## Bad Example

```ini
; Production — every cache operation logged
opcache.log_verbosity_level=4
```

## Good Example

```ini
; Production — only critical errors
opcache.log_verbosity_level=1
; Temporary debugging — set to 3, reproduce, revert to 1
```

## Exceptions

Temporary debugging sessions with immediate reversion to level 1.

## Consequences Of Violation

Excessive log volume, disk space exhaustion, CPU wasted on logging, performance degradation.

---

## Rule Name

Restart PHP-FPM for Full OpCache Recovery

## Category

Reliability

## Rule

Use `opcache_reset()` for clearing cached opcodes, but restart PHP-FPM when preloaded files or the OpCache shared memory structure itself is corrupted or needs resetting.

## Reason

`opcache_reset()` only clears the opcode cache in shared memory. Preloaded files, shared memory segment corruption, and blacklist changes require a full PHP-FPM restart to take effect. Using `opcache_reset()` alone in these scenarios gives a false sense of recovery.

## Bad Example

```bash
# Preload script changed — opcache_reset() does nothing
php -r 'opcache_reset();'
# Preloaded files are still the old versions
```

## Good Example

```bash
# After preload changes, memory corruption, or blacklist changes
sudo systemctl restart php8.5-fpm
```

## Exceptions

Routine code deployments where only lazily-cached files change (no preload, no config changes).

## Consequences Of Violation

Incomplete recovery from OpCache issues, stale preloaded code, persistent memory corruption symptoms.

---

## Rule Name

Check Error Counters After Every Deployment

## Category

Reliability

## Rule

Always verify that `oom_restarts`, `hash_restarts`, and `cache_full` remain at zero immediately after a deployment.

## Reason

Deployments can add files, increase the codebase size, or change file patterns. If the new codebase exceeds `max_accelerated_files` or `memory_consumption`, OpCache silently degrades. Post-deployment verification catches this before users are affected.

## Bad Example

```bash
# Deployed 5000 new files — max_accelerated_files was 20000
# Now 25000 files need caching — hash table overflows
# Performance degrades silently
```

## Good Example

```bash
# Deployment step: verify OpCache health
php -r '
$s = opcache_get_status(false);
$stats = $s["opcache_statistics"];
if ($stats["oom_restarts"] > 0 || $stats["hash_restarts"] > 0 || $s["cache_full"]) {
    echo "CRITICAL: OpCache needs reconfiguration after deploy";
    exit(1);
}
echo "OpCache healthy";
'
```

## Exceptions

No common exceptions. Always verify after deployment.

## Consequences Of Violation

Silent performance degradation after deployment, undetected cache thrashing, user-facing latency increase.

---

## Rule Name

Alert on current_wasted_percentage Exceeding 5%

## Category

Performance

## Rule

Set up monitoring alerts for `current_wasted_percentage > 5%` from `opcache_get_status()`.

## Reason

Wasted memory is memory that was used by evicted files and cannot be reused until compaction. High waste indicates cache thrashing — files are being evicted and recompiled frequently, wasting CPU and degrading hit rate.

## Bad Example

```php
// Ignoring 15% waste — "it's just memory fragmentation"
```

## Good Example

```php
$status = opcache_get_status(false);
if ($status['memory_usage']['current_wasted_percentage'] > 5) {
    alert('OpCache wasted memory > 5% — increase memory_consumption');
}
```

## Exceptions

Post-deployment window (first 60 seconds) where the cache is being repopulated and waste may temporarily spike.

## Consequences Of Violation

Cache thrashing, increased CPU usage, reduced hit rate, file eviction and recompilation cycles.

---

## Rule Name

Fix Underlying Configuration, Not Just Reset

## Category

Maintainability

## Rule

Never rely on `opcache_reset()` as a recurring fix for OpCache errors. Always address the root configuration cause.

## Reason

`opcache_reset()` clears the symptoms — zeroing error counters and emptying the cache — but does not fix the underlying resource exhaustion. If `memory_consumption` is too small, it will fill up again. Repeated resets waste CPU on recompilation and mask the real issue.

## Bad Example

```bash
# Cron job that resets OpCache every hour — masks the real problem
0 * * * * php -r 'opcache_reset();'
# Root cause: memory_consumption is too small
```

## Good Example

```bash
# Investigated: oom_restarts > 0 means memory_consumption is too small
# Fixed: increased from 128MB to 256MB
# No more resets needed
```

## Exceptions

Emergency recovery during an incident where reset buys time for a proper fix.

## Consequences Of Violation

Repeated cache reset cycles, wasted CPU on recompilation, masked resource exhaustion, delayed proper resolution.

---

## Rule Name

Use opcache_get_status for Structured Monitoring, Not Log Parsing

## Category

Maintainability

## Rule

Always use `opcache_get_status()` for monitoring OpCache health. Never parse OpCache log files for monitoring.

## Reason

`opcache_get_status()` provides structured, machine-parseable data with exact counters. Log parsing is unreliable — log formats may change, verbosity levels affect output, and important metrics may not be logged at default verbosity.

## Bad Example

```bash
# Parsing logs for "OOM restart" — unreliable, verbose, format-dependent
grep "restart" /var/log/php/opcache.log
```

## Good Example

```php
// Structured monitoring — reliable, fast, complete
$status = opcache_get_status(false);
$metrics = [
    'oom_restarts' => $status['opcache_statistics']['oom_restarts'],
    'hash_restarts' => $status['opcache_statistics']['hash_restarts'],
    'cache_full' => $status['cache_full'],
    'hit_rate' => $status['opcache_statistics']['hit_rate'],
    'wasted_percentage' => $status['memory_usage']['current_wasted_percentage'],
];
```

## Exceptions

No common exceptions. Always use the structured API.

## Consequences Of Violation

Incomplete monitoring, missed metrics, unreliable alerting, format-dependent parsing that breaks on PHP version upgrades.
