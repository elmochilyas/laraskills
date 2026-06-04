# Skill: Execute PHP-FPM Graceful Reload for Zero-Downtime Deployments

## Purpose
Execute PHP-FPM graceful reload (SIGUSR2 via `systemctl reload`) for zero-downtime worker rotation — old workers drain in-flight requests while new workers start with fresh OpCache — with `process_control_timeout` configured to prevent hanging reloads, comprehensive warm-up after reload, listen queue monitoring during transition, and full restart reserved for preloading changes (which reload cannot refresh).

## When To Use
- All production PHP-FPM deployments requiring zero-downtime code updates
- Configuration changes requiring worker restart (pool settings, php.ini)
- Scheduled worker recycling to prevent memory drift
- CI/CD pipeline worker refresh step

## When NOT To Use
- Development environments (simple restart is fine)
- When preloading script has changed (use full restart)
- Emergency security patches requiring immediate termination

## Prerequisites
- Systemd or process supervision for PHP-FPM
- `process_control_timeout` configured in pool (30-60s)
- Load balancer integration for connection draining
- Warm-up script for post-reload OpCache population

## Inputs
- PHP-FPM master PID or service name
- OpCache warm-up endpoint list
- Listen queue monitoring threshold

## Workflow

### 1. Configure process_control_timeout
- Set in pool configuration: `process_control_timeout = 30s`
- Never leave at default 0 (waits forever for workers to finish)
- Without this, long-running requests prevent reload completion
- Worker that exceeds timeout is terminated (preferred over indefinite hang)

### 2. Execute Graceful Reload (SIGUSR2)
- `systemctl reload php8.x-fpm` or `kill -USR2 <master_pid>`
- This is NOT the same as `systemctl restart` (SIGTERM)
- Reload: old workers drain, new workers start — zero dropped connections
- Restart: all workers killed immediately — drops in-flight requests

### 3. Monitor Listen Queue During Reload
- New workers start accepting connections immediately
- Old workers drain gradually (up to process_control_timeout)
- Brief listen queue buildup is normal; sustained buildup indicates problem
- Alert if listen queue exceeds pm.max_children count during reload

### 4. Warm OpCache After Reload (Mandatory)
- New workers start with empty OpCache
- Run comprehensive warm-up hitting all critical endpoints
- Verify OpCache hit rate >95% after warm-up
- Never declare deployment complete without warm-up

### 5. Verify Worker Count After Reload
- Confirm new worker count matches pool configuration
- Check logs for worker termination failures
- If new workers failed to start, reload may succeed with fewer workers
- Run `ps aux | grep php-fpm` to count active workers

### 6. Batch Configuration Changes
- Collect multiple config changes and apply in a single reload
- Each reload triggers OpCache cold-start and warm-up cycle
- Frequent reloads = repeated warm-up overhead
- Emergency changes are the exception

## Validation Checklist
- [ ] Reload used (SIGUSR2), not restart (SIGTERM)
- [ ] process_control_timeout configured (30-60s)
- [ ] OpCache warmed after reload before declaring complete
- [ ] Listen queue monitored during transition
- [ ] Worker count verified matches configuration
- [ ] Preloading changes handled with full restart (not reload)
- [ ] Configuration changes batched to minimize reload frequency

## Related Rules
- Always use reload not restart (`05-rules.md:5`)
- Set process_control_timeout (`05-rules.md:31`)
- Warm OpCache after reload (`05-rules.md:57`)
- Full restart for preloading changes (`05-rules.md:88`)
- Monitor listen queue during reload (`05-rules.md:116`)
- Batch config changes to minimize reloads (`05-rules.md:150`)

## Related Skills
- OpCache Reset Strategies
- Preloading Update Procedure
- Zero-Downtime Deployment OpCache
- Multi-Instance Cache Coordination

## Success Criteria
- Graceful reload executed with zero dropped connections
- process_control_timeout prevents hanging reloads
- OpCache warmed before deployment is declared complete
- Listen queue monitored and below threshold during transition
- Preloading changes handled with full restart (not reload)
- Configuration changes batched to minimize warm-up cycles
