# Standardized Knowledge: Rollback Planning and Version Mismatch

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | Deployment & Cache Invalidation |
| Knowledge Unit | Rollback Planning and Version Mismatch |
| Difficulty | Enterprise |
| Lifecycle | Deploy, Operate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

Rollback in PHP deployments must handle OpCache version mismatches (OpCache format may differ between PHP minor versions) and stateful service rollback (Octane workers with persistent state). The rollback plan must include: code revert, OpCache invalidation, preloading refresh, and (for Octane) connection pool drain and worker restart.

## Core Concepts

- **OpCache Version Mismatch**: OpCache file cache format is not guaranteed compatible across PHP minor versions. Rolling back from PHP 8.5 to 8.4 requires deleting OpCache file cache directory. Shared memory mode only needs PHP-FPM restart.
- **Stateful Service Rollback (Octane)**: Octane workers maintain persistent connections and in-memory state. Rollback requires: signal workers to stop accepting requests, wait for in-flight requests to complete, kill workers, deploy previous code, restart workers, warm OpCache.
- **Database Migration Rollback**: Deploy code that is backward-compatible with the previous database schema. Schema rollback should be a separate, tested operation. Never deploy code requiring the new schema to function.
- **Canary Rollback**: If rollback is needed during canary deployment, simply redirect the canary's traffic back to the main pool. The canary's OpCache is discarded.

## When To Use

- Every production deployment (have a rollback plan before deploying)
- PHP version upgrades (OpCache format changes)
- Octane/Swoole/RoadRunner deployments (stateful rollback)
- Canary deployments (quick rollback to main pool)

## When NOT To Use

- Development/staging deployments (just fix forward)
- Blue-green deployments (rollback is switching back to blue — already handled)
- Stateless PHP-FPM deployments with pure code changes (simple code revert + reload suffices)

## Best Practices

- **Have a one-click rollback in CI/CD**: The pipeline should have a rollback button that reverts code, reloads workers, warms cache, and verifies health. Practice rollback monthly.
- **Test rollback in staging**: Don't discover rollback issues during a production incident. Test the rollback procedure after every deployment.
- **Handle OpCache version mismatches**: When rolling back PHP version, delete OpCache file cache directory. Shared memory is automatically cleared by PHP-FPM restart.
- **Drain Octane workers before rollback**: Signal workers to stop accepting traffic. Wait for in-flight requests (up to max request timeout). Then restart with old code.
- **Document the rollback time**: How long does rollback take? 30s? 5 minutes? This determines incident response strategy.

## Architecture Guidelines

- **Rollback Sequencing**: 1) Signal load balancer to drain, 2) Wait for requests to complete, 3) Revert code, 4) Restart workers (or reload for Octane), 5) Clear/warm OpCache, 6) Health check, 7) Rejoin load balancer.
- **OpCache File Cache Invalidation**: OpCache file cache format is PHP-version-specific. Rolling back PHP requires deleting the file cache directory. Rolling forward typically works without deletion.
- **Octane Stateful Rollback**: Octane workers hold database connections, in-memory cache, and application state. Old code may not correctly handle state initialized by new code. Always kill and restart workers.
- **Database Schema Compatibility**: Schema changes should be backward-compatible for at least one release cycle. This allows rollback without schema revert. Schema revert should be a separate, slower process.

## Performance Considerations

- Rollback time: 30s (simple code revert) to 5min (PHP version rollback with file cache clear)
- OpCache warm-up after rollback: 5-30s (same as after deployment)
- Octane worker restart: 5-15s for worker pool to restart and stabilize
- During rollback, server capacity may be reduced (draining connections, workers restarting)

## Security Considerations

- Rollback is a high-risk operation. It should require approval (unless it's an automated health-check rollback).
- PHP version rollback may re-introduce known vulnerabilities. Document what you're rolling back to and its security status.
- Database schema rollback can cause data loss. Schema changes should be additive (new columns/tables) to avoid data loss on rollback.
- OpCache file cache from a newer PHP version should not be loaded by older PHP — it can cause segfaults.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Octane rollback without worker restart | Not understanding persistent state | Workers have mixed state from old+new code | Always kill and restart Octane workers during rollback |
| Not handling OpCache version mismatch | Rolling back PHP version without clearing file cache | Segfaults from incompatible file cache format | Delete OpCache file cache directory during PHP version rollback |
| Assuming database rollback is instant | Not planning schema revert | Slow rollback, potential data loss | Use additive-only schema changes for fast code rollback |
| Not testing rollback | Trusting the forward deployment | Discover rollback issues during incident | Test rollback after every deployment in staging |

## Anti-Patterns

- **Rolling back without draining traffic**: Dropping in-flight connections causes errors for active users.
- **Skipping cache validation after rollback**: Verifying OpCache and preloading after rollback is essential. Don't trust the process — verify.
- **Manually rolling back**: The rollback procedure should be as automated as the deployment. Manual rollback is error-prone.
- **Rolling back PHP minor version without full testing**: The application may have features incompatible with the older PHP version. Test rollback scenarios.

## Examples

```bash
# One-click rollback
aws elbv2 deregister-targets --target-group-arn $TG --targets Id=$INSTANCE
sleep 30
rsync -a --delete /app/releases/previous/ /app/current/
systemctl restart php8.3-fpm
for url in / /api/health; do
    curl -s -o /dev/null http://localhost$url
done
curl -s http://localhost/health | grep '"status":"ok"'
aws elbv2 register-targets --target-group-arn $TG --targets Id=$INSTANCE

# PHP version rollback — delete incompatible file cache
rm -rf /var/opcache-cache/*
systemctl restart php8.3-fpm
```

## Related Topics

- Zero-Downtime Deployment OpCache
- Blue-Green Deployment OpCache
- CI/CD Cache Invalidation Steps
- Deployment Cache Invalidation

## AI Agent Notes

- Rollback planning is as important as deployment planning. Test rollback monthly.
- OpCache file cache format is PHP-version-specific. Rolling back PHP requires deleting the file cache.
- Octane rollback requires worker restart — workers hold persistent state from the new code.
- Schema changes should be additive (backward-compatible) to enable fast code rollback without schema revert.
- Automated rollback on health check failure is the industry best practice.

## Verification

- [ ] Rollback procedure documented for each service
- [ ] One-click rollback implemented in CI/CD pipeline
- [ ] OpCache version mismatch handling documented (file cache deletion)
- [ ] Octane worker restart included in rollback procedure (if applicable)
- [ ] Database schema changes backward-compatible for one release
- [ ] Rollback tested in staging after each deployment
- [ ] Rollback time documented and within acceptable limits
- [ ] Load balancer drain included in rollback sequence
- [ ] Cache validation step in rollback procedure
