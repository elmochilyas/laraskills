# OpCache Revalidation Frequency — validate_timestamps, revalidate_freq, stat() Elimination

| Metadata | |
|----------|--|
| Domain | Performance & Runtime Engineering |
| Subdomain | OpCache Configuration & Preloading |
| Knowledge Unit | OpCache Revalidation Frequency — validate_timestamps, revalidate_freq, stat() Elimination |
| Difficulty | Foundation |
| Last Updated | 2026-06-02 |

## Overview

`opcache.validate_timestamps` and `opcache.revalidate_freq` control whether and how often OpCache checks if cached files have changed on disk. When `validate_timestamps=1`, OpCache calls `stat()` on each file to check its modification time, comparing it to the cached version. This adds 1–3% CPU overhead due to stat() syscalls. Setting `validate_timestamps=0` eliminates all stat() calls, providing maximum throughput at the cost of requiring explicit cache management during deployments. For production environments, `validate_timestamps=0` is the standard practice.

## Core Concepts

- **validate_timestamps=1 (default)**: OpCache calls `stat()` on each file before serving from cache. If the file's mtime is newer than the cached version, the file is recompiled.
- **validate_timestamps=0**: OpCache never checks file timestamps. Cached opcodes are served indefinitely, even if the source file changes. Requires explicit `opcache_reset()` or PHP-FPM restart after deployments.
- **revalidate_freq (seconds)**: How often OpCache checks timestamps (only when `validate_timestamps=1`). Default: 2 seconds. Set to 0 to check every request (not recommended).
- **revalidate_path**: If enabled (0 by default), OpCache checks the stat() timestamp even for files that haven't changed — adds unnecessary overhead. Leave disabled.
- **stat() syscall**: System call that checks file metadata (modification time, size, permissions). Each file access triggers one stat() when `validate_timestamps=1`.
- **revalidate_freq optimization**: Files that passed the timestamp check within `revalidate_freq` seconds are not rechecked. At `revalidate_freq=2`, a file accessed 100 times per second is checked 0.5 times per second.

## When To Use

- You are configuring OpCache for production — `validate_timestamps=0` is the standard.
- You want maximum CPU throughput and have deployment automation in place.
- You are eliminating stat() syscalls as part of a performance optimization initiative.
- You have a deployment pipeline that can call `opcache_reset()` or reload PHP-FPM.

## When NOT To Use

- You are in development — set `validate_timestamps=1` with `revalidate_freq=0` so code changes take effect immediately.
- You lack deployment automation — `validate_timestamps=0` without automated cache reset leads to stale code serving.
- You deploy multiple times per day without infrastructure automation — manual `opcache_reset()` is error-prone.
- You are on shared hosting without access to `opcache_reset()` or PHP-FPM reload.

## Best Practices (WHY)

| Practice | WHY |
|----------|-----|
| Set `validate_timestamps=0` in production | Eliminates stat() syscalls — 1–3% CPU savings. The single most impactful OpCache performance tuning. |
| Automate `opcache_reset()` in deployment pipeline | Every deployment must clear the cache. Include in the deploy script: `opcache_reset()` for web requests, or PHP-FPM reload. |
| Use `validate_timestamps=1, revalidate_freq=2` in development | Code changes appear after 2 seconds without manual cache reset. Low enough for development. |
| Never set `revalidate_freq=0` in production | Checks timestamps on every request — 100% stat() overhead. Only use during debugging. |
| Use `opcache.revalidate_path=0` | Leave disabled. Revalidating by full path adds overhead without benefit. |
| Combine with `opcache.file_cache` for cold-start | With `validate_timestamps=0`, file cache provides secondary storage. When workers restart, they load from file cache instead of recompiling. |
| Test deployment procedure after changing to 0 | Ensure `opcache_reset()` or PHP-FPM reload works correctly. A failed reset means stale code serves indefinitely. |

## Architecture Guidelines

- **stat() elimination mechanism**: When `validate_timestamps=0`, OpCache never calls `stat()`. The lookup path is: hash table lookup → return cached op_array. No filesystem interaction beyond the initial compilation.
- **stat() cost**: Each stat() is a syscall (~0.5–2µs depending on filesystem and caching). For 20,000 files accessed over a minute, that's 10–40ms of CPU time spent on stat(). At high traffic, the cumulative cost is significant.
- **Cache staleness risk**: If a file is changed on disk after OpCache cached it, the old opcodes serve until the cache is cleared. This is the tradeoff for the CPU savings.
- **Deployment sequences**: Code deploy → `opcache_reset()` → warm cache with preloading or first request → health check → enable traffic. This sequence ensures no stale code is served.
- **revalidate_freq granularity**: At `revalidate_freq=2`, the check window is 2 seconds. If a file changes at t=0 and is accessed at t=1, it may serve stale code until t=2. For production, this is too slow for immediate updates — hence `validate_timestamps=0` + explicit reset is preferred.

## Performance Considerations

- stat() overhead: 1–3% CPU with `validate_timestamps=1`. At scale (100+ req/s), this adds measurable CPU cost.
- Setting `revalidate_freq=0`: ~5–15% CPU overhead from stat() on every request. Never use in production.
- The CPU savings from `validate_timestamps=0` are additive with other optimizations. Combined with preloading, OPcache file cache, and JIT, the total gain is substantial.
- Container environments: In Docker/K8s, overlay filesystems have different stat() performance characteristics. `validate_timestamps=0` is especially beneficial in containers where stat() on overlayfs is slower than on native filesystems.

## Security Considerations

- **Stale code serving with validate_timestamps=0**: If a security patch is deployed and `opcache_reset()` fails silently, the old (vulnerable) code continues to serve. Always verify cache reset in the deployment pipeline.
- **validate_timestamps=1 with low revalidate_freq**: Not a security issue, but can mask deployment problems (files appear unchanged because stat() hasn't checked them yet).
- **Preloading + validate_timestamps=0**: Preloaded classes are loaded at startup and never refreshed until PHP-FPM restart. A preloading script change requires a full restart, not just `opcache_reset()`.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|----------------|
| Leaving `validate_timestamps=1` in production | Default setting keeps stat() overhead. | Not knowing about the performance impact. | 1–3% wasted CPU on stat() syscalls. | Set `validate_timestamps=0` for production. |
| Setting `validate_timestamps=0` without deployment automation | After deploy, old code continues to serve. | Only configuring the performance setting. | Security patches, bug fixes, features — none take effect until manual reset. | Automate `opcache_reset()` in every deploy. |
| Using `revalidate_freq=0` in production | Checks timestamps on every single request. | Copying development config to production. | 5–15% CPU overhead. Hit rate may drop due to unnecessary recompilation. | Set `validate_timestamps=0` or `revalidate_freq=2` minimum. |
| Not testing deployment procedure | Deploy → reset fails → old code serves for hours. | Trusting configuration without testing the full pipeline. | Undetected deployment failure. | Test the full deployment pipeline in staging. |
| Mixing validate_timestamps settings across environments | Dev: 1, Staging: 1, Production: 0 — forgetting to update one. | Environment-specific config files not synchronized. | Staging may not match production behavior. | Use environment-specific config files. Test validate_timestamps=0 in staging. |

## Anti-Patterns

- **validate_timestamps=1 in containers**: In immutable container images, files never change after build. stat() checks are always wasted. Always use `validate_timestamps=0` in containers.
- **revalidate_freq=3600 (1 hour)**: Misleading — if a file changes, it takes up to 1 hour to see the effect. If you can tolerate delay, use `validate_timestamps=0` with explicit reset instead.
- **Frequent opcache_reset() without need**: Calling `opcache_reset()` on every deploy adds unnecessary complexity for environments where `validate_timestamps=1` + deploy hook would suffice.

## Examples

```ini
; Production — maximum performance
opcache.validate_timestamps=0
opcache.revalidate_freq=0
opcache.revalidate_path=0

; Development — immediate code updates
opcache.validate_timestamps=1
opcache.revalidate_freq=0
opcache.revalidate_path=0

; Staging — balance
opcache.validate_timestamps=1
opcache.revalidate_freq=2
opcache.revalidate_path=0
```

```bash
# Deployment cache reset (validate_timestamps=0)
# Via web endpoint
curl -X POST https://example.com/opcache-reset

# Via cachetool CLI
cachetool opcache:reset --fcgi=127.0.0.1:9000

# Via PHP-FPM reload
sudo systemctl reload php8.3-fpm
```

## Related Topics

- OpCache Lifecycle and Invalidation
- OpCache File Cache Secondary Storage
- Preloading and Cold-Start Latency
- Deployment Cache Invalidation Strategies
- PHP-FPM Graceful Reload Patterns

## AI Agent Notes

- validate_timestamps=0 is OpCache's highest-ROI tuning parameter after simply enabling OpCache. It's free performance (1–3% CPU) with a non-trivial operational tradeoff.
- The tradeoff is clear: 1–3% CPU savings vs. needing to remember `opcache_reset()` on every deploy. Automate the reset, get the savings.
- In containerized environments, validate_timestamps=0 is always correct because container images are immutable. Files never change during the container's lifetime.
- Common pattern: set validate_timestamps=0 in production, 1 in staging/dev. Automate cache reset in all environments.

## Verification

- [ ] Verify `opcache.validate_timestamps` is 0 in production.
- [ ] Test deployment procedure: deploy → cache reset → verify new code serves.
- [ ] Benchmark CPU usage with validate_timestamps=1 vs 0 (expect 1–3% difference).
- [ ] Confirm `opcache.status` shows the correct configuration values.
- [ ] Verify the deployment pipeline includes cache invalidation step.
- [ ] Document the revalidation configuration and deployment procedure.
