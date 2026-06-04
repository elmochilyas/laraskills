# Standardized Knowledge: Preloading Update Procedure

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | Deployment & Cache Invalidation |
| Knowledge Unit | Preloading Update Procedure |
| Difficulty | Intermediate |
| Lifecycle | Deploy, Operate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

Updating the preloading script requires a full PHP-FPM restart (not just reload). Preloaded classes are loaded during php_module_startup() when the preload script is executed. Neither opcache_reset() nor reload (USR2) re-executes the preloading script. The only mechanism to refresh preloaded classes is to terminate and restart PHP-FPM.

## Core Concepts

- **Preloading Lifecycle**: PHP-FPM starts → Master reads opcache.preload setting → Preload script executed → Classes compiled and stored in OpCache shared memory → Workers fork from preloaded master.
- **Why Reset Doesn't Work**: opcache_reset() clears OpCache of lazily-cached files but does NOT remove preloaded classes. They are flagged as GC_IMMUTABLE/PERSISTENT and survive reset.
- **Why Reload Doesn't Work**: kill -USR2 only replaces workers. The preloaded master state persists because the master process doesn't re-execute the preload script.
- **Full Restart**: systemctl stop php8.x-fpm && systemctl start php8.x-fpm. Master terminates. New master starts fresh, re-executes preload script.

## When To Use

- After any change to the preloading script (preload.php or similar)
- After any change to preloaded class files (since classes are loaded at startup)
- PHP version upgrades (preload format may differ)
- Scheduled preloading refresh as part of maintenance windows

## When NOT To Use

- Routine code deployments that don't affect preloaded classes (use graceful reload instead)
- Development environments (preloading should match production but restarts are acceptable)
- Emergency hotfixes to non-preloaded files (use opcache_reset() or per-file invalidation)

## Best Practices

- **Coordinate with load balancer**: Full restart drops in-flight connections. Drain traffic from the server before restart, then warm and rejoin.
- **Verify preloaded classes after restart**: Check opcache_get_status()['preload_statistics'] to confirm preloading executed correctly.
- **Test preload changes in staging**: A bad preload script prevents PHP-FPM from starting. Always verify in staging before production restart.
- **Minimize preload changes**: Batch preloading updates to reduce the number of full restarts. Most deployments only need graceful reload.
- **Document preload dependencies**: Preloaded classes cannot be modified without full restart. Developers must know which files are preloaded.

## Architecture Guidelines

- **Preloading vs OpCache**: OpCache caches files lazily (on first access). Preloading compiles files eagerly (at startup). Preloaded classes are immutable in OpCache — they persist until the process dies.
- **Master Process State**: The PHP-FPM master process holds the preloaded class table. Workers fork with a copy of this table. When the master restarts, the table is rebuilt.
- **Immutable Flag**: Preloaded classes have the GC_IMMUTABLE flag set. The garbage collector ignores them, and opcache_reset() skips them. Only process termination removes them.
- **Restart Window**: During full restart, the server cannot serve requests. Brief downtime (1-5 seconds) occurs unless the server is drained from the load balancer first.

## Performance Considerations

- Full restart cold-start: 1-5 seconds for workers to start and OpCache to warm
- Preloading execution time: 100ms-2s depending on the number of classes
- After restart, all workers share the same preloaded class table — no per-worker duplication
- Preloaded class memory is not freed until process termination

## Security Considerations

- A bad preload script can prevent PHP-FPM from starting entirely (denial of service). Test thoroughly.
- Preloading runs as the configured preload_user. Ensure this user has appropriate file permissions.
- Full restart drops all connections. Coordinate with load balancer to prevent user-facing downtime.
- Preload script errors may not be visible in standard error logs. Check PHP-FPM startup logs.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Not accounting for preloading reload cost | Not understanding preload lifecycle | Stale class definitions served indefinitely | Always restart fully when preloading changes |
| Using reload instead of restart | Assuming reload refreshes everything | Preloaded classes unchanged, unexpected behavior | Use full restart for preloading changes |
| No preload verification after restart | Assuming restart succeeded | Silent preload failure serves un-preloaded classes | Check opcache_get_status() preload statistics |
| Not draining before restart in production | Emergency process | In-flight requests dropped | Coordinate with load balancer for zero-downtime |

## Anti-Patterns

- **Frequent preloading updates**: Each update requires full restart. Batch changes to minimize restart frequency.
- **Preloading without testing**: A bad preload script crashes PHP-FPM on restart. Test in staging first.
- **Assuming opcache_reset() refreshes preloading**: Preloaded classes survive opcache_reset(). Only full restart works.
- **Ignoring preload in rollback plan**: Rollback that doesn't include full restart may leave stale preloaded classes.

## Examples

```bash
# Preloading update procedure
# 1. Update preload script
# 2. Drain connections
aws elbv2 deregister-targets --target-group-arn $TG --targets Id=$INSTANCE
sleep 30
# 3. Full restart
systemctl stop php8.3-fpm
systemctl start php8.3-fpm
sleep 3
# 4. Verify preloading
php -r 'print_r(opcache_get_status(false)["preload_statistics"]);'
# 5. Warm OpCache
for url in / /api/health; do curl -s -o /dev/null http://localhost$url; done
# 6. Rejoin
aws elbv2 register-targets --target-group-arn $TG --targets Id=$INSTANCE
```

## Related Topics

- OpCache Reset Strategies
- PHP-FPM Graceful Reload Patterns
- Deployment Cache Invalidation
- Preloading Script Design Patterns

## AI Agent Notes

- Preloading update REQUIRES full PHP-FPM restart. Neither opcache_reset() nor graceful reload (USR2) works.
- Preloaded classes are flagged GC_IMMUTABLE — they survive opcache_reset().
- The PHP-FPM master process holds preloaded state. Workers fork from it. Only master restart rebuilds it.
- Always drain from load balancer before full restart to avoid dropping connections.

## Verification

- [ ] Preloading change triggers full restart (not reload)
- [ ] Load balancer drain coordinated before restart
- [ ] Preloading verified after restart (opcache_get_status preload_statistics)
- [ ] Preload script tested in staging before production restart
- [ ] Rollback plan includes preloading refresh
- [ ] Deployment pipeline distinguishes preloading vs non-preloading deployments
