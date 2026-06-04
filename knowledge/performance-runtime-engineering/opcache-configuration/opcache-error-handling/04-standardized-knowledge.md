# OpCache Error Handling — Logging, Diagnostic Tools, Common Error Scenarios, Recovery

| Metadata | |
|----------|--|
| Domain | Performance & Runtime Engineering |
| Subdomain | OpCache Configuration & Preloading |
| Knowledge Unit | OpCache Error Handling — Logging, Diagnostic Tools, Common Error Scenarios, Recovery |
| Difficulty | Intermediate |
| Last Updated | 2026-06-02 |

## Overview

OpCache errors typically manifest as performance degradation (low hit rate, high CPU), stale code serving, or application-level issues (compile errors, class definition conflicts). OpCache provides diagnostic tools via `opcache_get_status()` and `opcache_get_configuration()`, as well as detailed error counters (cache_full, oom_restarts, hash_restarts). Understanding these diagnostics and knowing how to recover from common scenarios — cache full, stale compilation, preload failures, shared memory exhaustion — is essential for maintaining OpCache health in production.

## Core Concepts

- **Error indicators**: `opcache_get_status()` provides: `cache_full` (true/false), `oom_restarts` (integer), `hash_restarts` (integer), `current_wasted_percentage` (float). Non-zero restarts or high waste = configuration problems.
- **opcache.error_log**: If set, OpCache errors are logged to a separate file. If not set, errors go to PHP's main error log.
- **opcache.log_verbosity_level**: Controls OpCache's internal logging verbosity (0–4). Default: 1 (only critical errors). Increase to 2–3 for debugging, but never in production — high verbosity generates significant log volume.
- **Compile-time errors**: If a PHP file has a parse error, OpCache caches the error and reports a compile failure on every subsequent access. The file must be fixed and the cache cleared.
- **Preload failure**: If the preload script fails, PHP-FPM may not start, or workers may start with an incomplete preload. Errors are logged to the PHP error log.
- **Shared memory corruption**: Rare but catastrophic. Memory corruption in the shared memory segment causes unpredictable behavior. Requires PHP-FPM restart.
- **Stale code serving**: With `validate_timestamps=0`, if a file is changed but OpCache is not reset, old opcodes serve indefinitely. Detect by comparing file mtimes with cache timestamps.

## When To Use

- You are diagnosing low OpCache hit rates or high CPU usage.
- You are investigating "code changes not taking effect" after deployment.
- You are debugging PHP-FPM startup failures related to preloading.
- You are monitoring OpCache health and want to understand the diagnostics.
- You need to set up alerting for OpCache-related issues.

## When NOT To Use

- OpCache is working normally — don't log verbosely in production.
- You are just configuring OpCache for the first time — focus on getting the basics right first.
- Your application has no OpCache-related issues — error diagnostics are for troubleshooting.

## Best Practices (WHY)

| Practice | WHY |
|----------|-----|
| Monitor `oom_restarts`, `hash_restarts`, and `cache_full` | These are the three critical indicators of OpCache misconfiguration. Non-zero values signal undersized resources. |
| Set up alerts on `oom_restarts > 0` and `cache_full = true` | These indicate imminent or active performance degradation. Alert immediately. |
| Check OpCache status after every deployment | Verify hit rate is >99% and no error counters have incremented. A deployment can silently break OpCache configuration. |
| Use `opcache.error_log` for OpCache-specific diagnostics | Separate logging helps isolate OpCache issues from application errors. Set in production with log rotation. |
| Increase `log_verbosity_level` temporarily for debugging | Set to 3, reproduce the issue, then set back to 1. High verbosity generates significant log volume. |
| Restart PHP-FPM as a recovery step for most OpCache errors | Shared memory corruption, stale preloading, and cache file issues are fixed by restart. `opcache_reset()` only clears the opcode cache, not the shared memory structure. |
| Monitor `current_wasted_percentage` | >5% indicates cache thrashing — memory is too small. >20% indicates severe problems requiring immediate action. |

## Architecture Guidelines

- **Error propagation**: OpCache errors do not cause PHP userland exceptions. They manifest as log messages, counter increments, or degraded performance. Monitoring is essential for detection.
- **oom_restarts**: OpCache's internal memory allocator is out of memory. This is NOT a PHP-FPM restart. It resets the OpCache internal allocator, clearing all cached files. Files are recompiled. Immediate cause: `memory_consumption` too small.
- **hash_restarts**: Hash table allocation failure. The hash table cannot accommodate more file entries. Immediate cause: `max_accelerated_files` too small.
- **Compile error caching behavior**: When a PHP file has a compile error, OpCache caches the error state. On every subsequent request, the file returns the same error without attempting recompilation. The file must be fixed and the cache cleared.
- **Preload error recovery**: A preload failure during startup prevents PHP-FPM from entering the ready state. Fix the preload script and restart PHP-FPM. A partial preload (some files failed) is logged but the worker may start.
- **Shared memory cleanup**: On PHP-FPM shutdown, OpCache's shared memory segment is marked for deletion (via `shmctl(IPC_RMID)`). If PHP-FPM crashes, the shared memory segment may persist, consuming system resources. Manual cleanup may be needed.

## Performance Considerations

- Error monitoring overhead: `opcache_get_status()` call is lightweight (<10µs). Call it periodically from monitoring scripts, not per-request.
- Log verbosity overhead: At level 1 (default), OpCache logs only critical errors — negligible overhead. At level 4, OpCache logs every cache operation — significant overhead. Never use >1 in production.
- Recovery cost: `opcache_reset()` takes <1ms. Full recompilation of all cached files takes 5–60 seconds depending on file count — this is the cost of recovering from cache-full or stale-cache scenarios.
- PHP-FPM restart cost: ~200ms process spawn + recompilation of all files. A necessary but expensive recovery step.

## Security Considerations

- error_log exposure: Ensure OpCache error logs are not publicly accessible. Log files may reveal filesystem paths and configuration details.
- compile error information: OpCache error messages include file paths and line numbers. These can reveal application structure. Control access to error logs.
- Preload script errors: A preload script error prevents PHP-FPM from starting. Ensure the preload script is tested in staging before production deployment.
- Shared memory leftover: After PHP-FPM crash, the shared memory segment may remain. An attacker could potentially read stale data. The data is compiled opcodes and interned strings — low sensitivity, but should be cleaned up.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|----------------|
| Ignoring non-zero error counters | `oom_restarts=5` means OpCache has OOM'd 5 times. | Not monitoring OpCache diagnostics. | Files repeatedly evicted and recompiled — 50%+ CPU wasted. | Alert on any non-zero restart counter. |
| Not checking OpCache status after deploy | Deployment adds new files, potentially exceeding `max_accelerated_files`. | Deploy pipeline doesn't include OpCache validation. | Post-deploy performance degrades silently. | Check `cache_full` and `hash_restarts` after every deploy. |
| Using `opcache_reset()` to fix all problems | Reset clears the cache but doesn't fix underlying configuration. | Quick-fix mentality. | Symptom masked, root cause persists. | Check error counters AFTER reset. If they're non-zero, increase limits. |
| Relying on `opcache_reset()` for preload changes | Preloaded files are NOT cleared by `opcache_reset()`. | Not understanding the difference between cached and preloaded files. | Preload changes don't take effect. | Restart PHP-FPM after preload changes. |
| Setting `log_verbosity_level=4` in production | Every cache operation is logged. | Copying debug config to production. | Log files fill disk rapidly. CPU wasted on logging. | Set to 1 (default) in production. Increase temporarily for debugging. |

## Anti-Patterns

- **Ignoring waste percentage**: `current_wasted_percentage > 5%` indicates cache thrashing. Don't dismiss it — increase `memory_consumption`.
- **Frequent PHP-FPM restarts to "clean" OpCache**: Restarting fixes symptoms but not causes. Fix the underlying configuration or memory leak.
- **Manual error log parsing**: Use structured monitoring (Prometheus, Datadog) to track OpCache metrics. Manual log parsing misses trends.
- **Treating all OpCache errors as application bugs**: Some errors are configuration issues. Distinguish between "code compile error" (userland bug) and "cache full" (configuration issue).

## Examples

```php
// OpCache health check
function checkOpcacheHealth(): array
{
    $status = opcache_get_status(false);
    if (!$status || !$status['opcache_enabled']) {
        return ['healthy' => false, 'error' => 'OpCache not enabled'];
    }
    
    $errors = [];
    $stats = $status['opcache_statistics'];
    
    if ($status['cache_full']) {
        $errors[] = 'Cache is full — increase memory_consumption';
    }
    if ($stats['oom_restarts'] > 0) {
        $errors[] = 'OOM restarts: ' . $stats['oom_restarts'] . ' — increase memory_consumption';
    }
    if ($stats['hash_restarts'] > 0) {
        $errors[] = 'Hash restarts: ' . $stats['hash_restarts'] . ' — increase max_accelerated_files';
    }
    if ($status['memory_usage']['current_wasted_percentage'] > 5) {
        $errors[] = 'Wasted memory > 5% — increase memory_consumption';
    }
    if ($stats['hit_rate'] < 99) {
        $errors[] = 'Hit rate: ' . round($stats['hit_rate'], 1) . '% — target >99%';
    }
    
    return [
        'healthy' => empty($errors),
        'errors' => $errors,
        'hit_rate' => $stats['hit_rate'],
        'cache_full' => $status['cache_full'],
        'oom_restarts' => $stats['oom_restarts'],
        'hash_restarts' => $stats['hash_restarts'],
        'wasted_percentage' => $status['memory_usage']['current_wasted_percentage'],
    ];
}
```

```bash
# Common recovery commands
# Clear opcode cache
php -r 'opcache_reset();'

# Check OpCache status from CLI
php -r 'print_r(opcache_get_status(false));'

# Restart PHP-FPM (full OpCache reset including preloaded files)
sudo systemctl restart php8.3-fpm

# List shared memory segments (check for leftover OpCache)
ipcs -m | grep '0x'
```

## Related Topics

- OpCache Monitoring and Hit Rate Analysis
- OpCache Memory Consumption
- OpCache Max Accelerated Files
- OpCache Preloading and Warmup
- Deployment Cache Invalidation

## AI Agent Notes

- The three numbers to watch: `oom_restarts`, `hash_restarts`, and `cache_full`. Any non-zero value signals a configuration problem that will cause performance degradation.
- Most OpCache "errors" are not crashes — they're performance degradation signals. The cache silently falls back to worst-case behavior (recompilation) without throwing errors.
- `opcache_reset()` is the universal first-aid for most OpCache problems. But always check error counters after reset — if they're still incrementing, the root cause (undersized config) is still there.
- Preload failures are the most critical — they prevent PHP-FPM from starting. Always test preload scripts separately before including them in production configuration.

## Verification

- [ ] Run `opcache_get_status(false)` and verify all error counters are zero.
- [ ] Check `cache_full` is false, `oom_restarts` and `hash_restarts` are 0.
- [ ] Verify `current_wasted_percentage` is <5%.
- [ ] Test `opcache_reset()` and verify counters reset.
- [ ] Simulate a compile error: verify OpCache caches the error state.
- [ ] Set up monitoring alerts for non-zero error counters.
- [ ] Document the error handling and recovery procedures.
