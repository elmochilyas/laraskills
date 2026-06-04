# Skill: Detect and Debug Memory Leaks in PHP Applications

## Purpose

Identify memory leaks in PHP code, particularly in long-running workers (Octane, Swoole, RoadRunner), using systematic detection and debugging techniques.

## When To Use

- Memory usage (RSS) grows monotonically in long-running processes
- Workers exceed memory limits and are killed by OOM killer
- After adding new packages or code that manages state
- Monthly memory trend shows 5%+ growth per day

## When NOT To Use

- For PHP-FPM where memory is reset per request (leaks are isolated to single requests)
- When memory growth is expected (caches, connection pools)
- Without first establishing a baseline memory profile

## Prerequisites

- Memory monitoring in production (RSS per worker)
- Staging environment for controlled testing
- PHP memory profiling tools (Blackfire, SPX, or custom memory tracking)
- Understanding of common leak sources: statics, singletons, closures, listeners

## Inputs

- Worker RSS over time (hourly/daily trend)
- GC telemetry: `gc_status()`
- Memory usage at request boundaries: `memory_get_usage()`
- Code changes that coincided with memory growth start

## Workflow (numbered steps)

1. Confirm a leak exists: monitor worker RSS over 24 hours — if growth >10% per hour, a leak is present
2. Isolate the leak: disable components one at a time to identify which module causes the growth
3. Use memory profiling: compare memory snapshots at request start and end — the difference should be near zero in long-running workers
4. Check common leak sources: static properties holding data across requests, singleton registries, event listeners accumulating, closures capturing large scopes
5. For Laravel Octane: run `php artisan octane:watch` to detect state leaks automatically
6. For Symfony: check that services are not holding request-scoped data in shared instances
7. Once identified, fix the leak: unset() large variables, remove accumulated listeners, convert statics to instance properties
8. Verify: monitor RSS over 4 hours — slope should be flat (<2% growth per hour)
9. Document the leak source and fix

## Validation Checklist

- [ ] Memory growth trend confirmed (>10% per hour = leak)
- [ ] Leak source isolated through component disabling
- [ ] Common leak sources checked (statics, singletons, listeners, closures)
- [ ] Octane:watcher or equivalent used for detection
- [ ] Fix applied and verified
- [ ] RSS slope flat for 4+ hours after fix
- [ ] Leak source and fix documented

## Common Failures

- **Confusing cache warming with leaks**: Memory growth from cache warm-up is normal — distinguish by comparing growth rate after warm-up completes
- **Not using official detection tools**: Octane has built-in leak detection — use it before manual debugging
- **Fixing symptoms instead of causes**: Increasing max_requests recycles workers faster but does not fix the leak
- **Assuming third-party packages are leak-free**: Popular packages may have Octane-incompatible patterns — test each one

## Decision Points

- Growth 0-2% per hour: normal (fragmentation, minor leaks) — address if trend accelerates
- Growth 2-5% per hour: investigate during next maintenance window
- Growth 5-10% per hour: investigate immediately
- Growth >10% per hour: critical incident — consider worker recycling or rollback

## Performance Considerations

- Memory leak detection tools add overhead — use in staging, not production
- Octane watcher adds ~1% overhead — safe for production monitoring
- memory_get_usage() reports Zend MM heap usage, not total process RSS (which includes non-PHP memory)
- RSS growth from external libraries (libxml, libcurl) may not appear in memory_get_usage()

## Security Considerations

- State leaks in Octane can expose User A's data to User B — this is both a leak and a security vulnerability
- Singleton registries storing authentication data are the most critical leaks
- Event listeners accumulating across requests can fire on stale/wrong data
- Always treat state leaks as security incidents, not just performance issues

## Related Rules (from 05-rules.md)

- Never Use Static Properties for Request-Scoped Data
- Set max_requests to 500-1000
- Use Octane::booted() for Per-Worker Initialization
- Always Audit Service Providers Before Octane Deployment

## Related Skills

- PHP Memory Model
- GC Telemetry and Root Buffer
- State Management and Leak Prevention
- Octane Architecture and Execution Model

## Success Criteria

- Memory leak identified and fixed
- RSS growth flattened to <2% per hour
- Leak source documented with root cause
- Monitoring in place to detect future leaks
- Team trained on common leak patterns
