# Standardized Knowledge: OpCache Reset Strategies

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | Deployment & Cache Invalidation |
| Knowledge Unit | OpCache Reset Strategies |
| Difficulty | Intermediate |
| Lifecycle | Deploy, Operate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

Three OpCache reset strategies exist: PHP-FPM restart (most thorough — resets everything including preloading, but slowest), opcache_reset() (fastest — clears shared memory opcodes in microseconds, but does not reload preloading), and cachetool CLI (remote operation — calls opcache_reset() via web endpoint on each worker, no SSH needed). Strategy depends on deployment architecture and tolerance for cold-start latency.

## Core Concepts

- **PHP-FPM Restart**: systemctl reload php8.x-fpm. Kills all workers, spawns new ones. OpCache shared memory destroyed and recreated. Preloading script re-executes. Cold-start: 1-5 seconds (all files recompile).
- **opcache_reset()**: PHP function. Atomically clears OpCache shared memory. All files recompiled on next access. Preloading NOT reloaded. Must be called on every worker pool. Cost: ~1µs execution, then cold-start on next requests.
- **cachetool CLI**: `cachetool opcache:reset --web --web-path=http://app/opcache.php`. Sends HTTP request to a PHP endpoint that calls opcache_reset(). Each worker's endpoint executes independently. No server access required.
- **opcache_invalidate()**: Per-file invalidation. Recompiles only the specified file on next access. Used for partial deployments, individual hotfixes, or development.

## When To Use

- **PHP-FPM restart**: When preloading script changed, PHP version upgraded, or full state reset needed
- **opcache_reset()**: Fast deployment rollouts where preloading hasn't changed, quick cache clears
- **cachetool CLI**: When SSH access is restricted, multi-server deployments, automated CI/CD pipelines
- **opcache_invalidate()**: Single-file hotfixes, development, partial deployments

## When NOT To Use

- PHP-FPM restart without load balancer drain in zero-downtime environments
- opcache_reset() when preloading has changed (it won't refresh preloaded classes)
- cachetool on untrusted networks (the web endpoint must be protected)
- opcache_invalidate() for full deployments (use reset or restart instead)

## Best Practices

- **Use cachetool for production deployments**: No SSH required, works across all workers, integrates with CI/CD pipelines. Install as a Composer dependency.
- **Combine reset with warm**: Always follow opcache_reset() with a warm-up script that hits critical endpoints. Prevents cold-start latency for first users.
- **Restart PHP-FPM when preloading changes**: Neither opcache_reset() nor reload (USR2) refreshes preloading. Only a full restart re-executes the preload script.
- **Secure the opcache_reset() endpoint**: The web endpoint must be authentication-protected and network-restricted. Exposing opcache_reset() publicly is a denial-of-service risk.
- **Monitor cache hit rate after reset**: Verify hit rate returns to >99% after warm-up. If not, increase memory_consumption or max_accelerated_files.

## Architecture Guidelines

- **Reset vs Restart**: opcache_reset() clears shared memory opcodes but preserves the OpCache memory segment. PHP-FPM restart destroys and recreates the entire segment including preloaded classes.
- **Multi-Worker Coordination**: In PHP-FPM with multiple workers, opcache_reset() affects all workers simultaneously because they share the same OpCache memory. In RoadRunner/Octane, each worker process has its own OpCache.
- **cachetool Mechanism**: The web endpoint must be deployed on each server. cachetool sends an HTTP request to the endpoint, which calls opcache_reset() and returns the status. The endpoint should be protected.
- **Deployment Integration**: cachetool as Composer dependency simplifies integration. The deployment script runs `cachetool opcache:reset --all` after code deployment.

## Performance Considerations

- opcache_reset() execution: ~1µs. The cost is in subsequent requests (all files recompile)
- PHP-FPM restart: 1-5 seconds cold-start while all files recompile
- Every 1% decrease in hit rate increases CPU usage ~0.5-1% due to recompilation
- opcache_invalidate() per-file cost: ~50µs per file (stat + recompile)

## Security Considerations

- opcache_reset() web endpoint must be protected: authentication token, IP whitelist, or internal network only
- Exposed opcache_reset() allows attackers to degrade performance by forcing constant recompilation
- cachetool CLI commands should use HTTPS for web endpoint communication
- PHP-FPM restart requires sudo or appropriate systemd permissions

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| opcache_reset() without restarting when preloading is used | Not understanding preloading lifecycle | Preloaded classes survive reset, stale definitions served | Full PHP-FPM restart when preloading changes |
| No warm-up after reset | Not accounting for cold-start | First users experience slow responses | Run warm-up script immediately after reset |
| Exposed opcache_reset() endpoint | Convenience for ops | DoS attack vector, constant recompilation | Protect with authentication and IP restriction |
| Using restart instead of reload | Not knowing the difference | In-flight requests dropped | Use reload (SIGUSR2) for zero-downtime |

## Anti-Patterns

- **Calling opcache_reset() in every request**: Debug pattern that destroys production performance. Reset only during deployments.
- **Skipping verification after reset**: Assume reset worked without checking. Always verify with opcache_get_status().
- **Manual reset across many servers**: Human error risk. Use cachetool with CI/CD automation for multi-server resets.
- **Resetting OpCache without deploying code**: Unnecessary performance hit. Only reset after actual code changes.

## Examples

```bash
# Production deployment with cachetool
cachetool opcache:reset --web --web-path=http://localhost/opcache.php
# Verify
php -r "print_r(opcache_get_status(false));"
```

## Related Topics

- Deployment Cache Invalidation Landscape
- PHP-FPM Graceful Reload Patterns
- Preloading Update Procedure
- CI/CD Cache Invalidation Steps

## AI Agent Notes

- opcache_reset() does NOT clear preloaded classes. Only PHP-FPM restart does.
- cachetool requires a PHP web endpoint on each server. The endpoint calls opcache_reset().
- PHP-FPM workers share a single OpCache memory segment. opcache_reset() affects all workers at once.
- After any reset, a warm-up phase is essential to restore performance for first users.

## Verification

- [ ] Reset strategy selected based on deployment type (preloading changes? yes/no)
- [ ] cachetool installed and configured for CI/CD pipeline
- [ ] opcache_reset() web endpoint secured (auth + IP restriction)
- [ ] Warm-up script configured to run after reset
- [ ] PHP-FPM restart procedure coordinated with load balancer
- [ ] Cache hit rate verified >99% after warm-up
- [ ] opcache_invalidate() path available for emergency hotfixes
