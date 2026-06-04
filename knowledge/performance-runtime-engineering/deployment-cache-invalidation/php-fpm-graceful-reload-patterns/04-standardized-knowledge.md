# Standardized Knowledge: PHP-FPM Graceful Reload Patterns

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | Deployment & Cache Invalidation |
| Knowledge Unit | PHP-FPM Graceful Reload Patterns |
| Difficulty | Intermediate |
| Lifecycle | Deploy, Operate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

PHP-FPM graceful reload (kill -USR2 <master_pid> or systemctl reload php8.x-fpm) restarts workers one at a time without dropping connections. The master process: reads updated configuration, spawns new worker pool, new workers start accepting connections, old workers finish current requests and exit. During transition, both old and new workers coexist seamlessly.

## Core Concepts

- **USR2 Signal**: Instructs FPM master to reload. Master forks new workers with new config/OpCache. Old workers finish in-flight requests up to process_control_timeout.
- **Sequence**: Signal → Master reads pool config → Spawns new children → New children start accepting from listen socket → Old children finish requests → Old children exit when idle.
- **Zero-Downtime Guarantee**: The listen socket remains open during reload. New connections go to new workers. Old workers drain existing requests. No request is dropped unless it exceeds process_control_timeout.
- **OpCache Reset Correlation**: Graceful reload does NOT reset OpCache per se. Each new worker starts with an empty OpCache and compiles files on demand. Preloading runs automatically if configured.

## When To Use

- All production PHP-FPM deployments requiring zero-downtime code updates
- Configuration changes that require worker restart (pool settings, php.ini changes)
- Scheduled worker recycling to prevent memory drift
- CI/CD pipeline worker refresh step

## When NOT To Use

- Development environments where simple restart is acceptable
- When preloading script has changed (use full restart instead)
- Emergency security patches where immediate termination is required
- Systems without process supervision (systemd/Supervisor)

## Best Practices

- **Always use reload, not restart**: systemctl reload vs systemctl restart. Reload sends SIGUSR2 (graceful). Restart sends SIGTERM (immediate kill, drops connections).
- **Set process_control_timeout**: Configures max wait for old workers to finish (e.g., 30s). Without it, workers with persistent connections never exit, preventing reload completion.
- **Verify reload completion**: Monitor worker count after reload. Old worker count should drop to 0, new workers should match pool configuration.
- **Coordinate with cache warming**: After reload, OpCache is cold. Run warm-up requests before signaling deployment complete.
- **Monitor listen queue during reload**: The transition window may cause brief queue buildup. Alert if listen queue exceeds threshold during reloads.

## Architecture Guidelines

- **Reload vs Restart**: Reload (SIGUSR2) forks new workers and lets old ones drain. Restart (SIGTERM) kills all workers immediately. Reload is for zero-downtime. Restart is for emergencies or preloading changes.
- **Worker Memory Isolation**: Each new worker starts with fresh memory. Memory leaks from old workers don't carry over. Reload is an implicit memory management tool.
- **Configuration Reload**: Reload re-reads the pool configuration file. Changed settings (pm.*, request_terminate_timeout, etc.) take effect without full restart.
- **Socket Persistence**: The listen socket (TCP or Unix) is opened by the master and inherited by new children. Old children continue listening on the same socket until they exit.

## Performance Considerations

- Reload duration: typically 1-5 seconds for all old workers to drain
- CPU spike during reload: all new workers compile OpCache simultaneously. Stagger warm-ups if possible.
- Memory usage peaks: old workers + new workers coexist briefly, doubling memory during transition
- process_control_timeout default is 0 (wait forever). Set to 30-60s for predictable reloads.

## Security Considerations

- SIGUSR2 signal requires appropriate permissions. PHP-FPM master should run under a dedicated user.
- process_control_timeout prevents worker hangs from blocking reload indefinitely.
- Listen socket permissions must allow new workers to bind after restart.
- Reload logs should be monitored for worker termination failures or timeout warnings.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| SIGTERM instead of SIGUSR2 | Not knowing the difference | In-flight requests dropped, users see 502 errors | Use systemctl reload (SIGUSR2) for zero-downtime |
| No process_control_timeout | Default configuration | Workers with long-running requests prevent reload completion | Set process_control_timeout = 30-60s |
| Skipping verification after reload | Assuming reload always succeeds | Unknown worker count mismatch, some workers still on old code | Verify new worker count matches configuration |
| No OpCache warm after reload | Not accounting for cold start | Slow first requests on new workers | Run warm-up script immediately after reload |

## Anti-Patterns

- **Reloading for every config change**: Frequent reloads cause repeated OpCache cold starts. Batch config changes when possible.
- **Relying on reload for preloading changes**: Reload does not refresh preloading. Always use full restart when preloading changes.
- **Ignoring failed workers**: If a new worker fails to start (e.g., OpCache memory full), reload may succeed with fewer workers. Monitor worker count.
- **Reload during peak traffic**: Even graceful reload adds overhead. Schedule reloads during low-traffic windows when possible.

## Examples

```bash
# Graceful reload
kill -USR2 $(cat /var/run/php-fpm.pid)
# or
systemctl reload php8.3-fpm

# Verify
ps aux | grep php-fpm | wc -l
tail -f /var/log/php-fpm.log

# Monitor listen queue during reload
watch -n 1 'curl -s http://localhost/status?json | jq ."listen queue"'
```

## Related Topics

- OpCache Reset Strategies
- Deployment Cache Invalidation Landscape
- Preloading Update Procedure
- Zero-Downtime Deployment OpCache

## AI Agent Notes

- Reload (SIGUSR2) is zero-downtime. Restart (SIGTERM) is not. Always use reload for production deployments.
- Reload does NOT refresh preloading. Preloading requires full restart.
- Set process_control_timeout to prevent reload from hanging on long-running requests.
- Old and new workers coexist during reload, briefly doubling memory usage.

## Verification

- [ ] Deployment uses reload (SIGUSR2), not restart (SIGTERM)
- [ ] process_control_timeout configured (30-60s)
- [ ] OpCache warm-up script configured after reload
- [ ] Worker count monitored after reload
- [ ] Listen queue monitored during reload window
- [ ] Preloading changes handled with full restart (not reload)
- [ ] Reload logs verified after each deployment
