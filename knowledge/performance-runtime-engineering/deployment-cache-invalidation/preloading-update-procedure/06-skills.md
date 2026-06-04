# Skill: Update Preloading Script with Full PHP-FPM Restart and Verification

## Purpose
Update the PHP preloading script with full PHP-FPM restart (not reload — the only mechanism that re-executes `opcache.preload`), coordinate load balancer drain to prevent connection drops, verify preloading state via `opcache_get_status()['preload_statistics']`, test changes in staging first, batch preloading updates to minimize restart frequency, and include preloading refresh in the rollback plan — preventing stale preloaded class definitions from persisting across deployments.

## When To Use
- After any change to the preloading script (preload.php or similar)
- After any change to preloaded class files
- PHP version upgrades (preload format may differ)
- Scheduled preloading refresh as part of maintenance windows

## When NOT To Use
- Routine code deployments that don't affect preloaded classes (use graceful reload)
- Development environments (restarts are less impactful)
- Emergency hotfixes to non-preloaded files (use opcache_reset() or per-file invalidation)

## Prerequisites
- Understanding that opcache_reset() does NOT refresh preloading
- Load balancer drain capability
- Staging environment for preload testing
- PHP-FPM systemd service or supervision

## Inputs
- Preloading script file path (opcache.preload setting)
- List of preloaded class files
- Load balancer target group ARN
- Verification script for preload statistics

## Workflow

### 1. Test Preloading Changes in Staging
- Apply preload changes to staging environment
- Full PHP-FPM restart in staging
- Verify: `opcache_get_status(false)['preload_statistics']` shows expected classes
- A bad preload script prevents PHP-FPM from starting entirely
- Never deploy untested preloading changes to production

### 2. Drain from Load Balancer
- Signal load balancer to stop sending new connections to the instance
- Wait for in-flight requests to complete (30s drain timeout)
- Prevents connection drops during the restart window
- Required because full restart (stop + start) terminates all workers immediately

### 3. Execute Full PHP-FPM Restart
- `systemctl stop php8.x-fpm && systemctl start php8.x-fpm`
- Full restart re-executes the preload script during php_module_startup()
- Graceful reload (SIGUSR2) does NOT refresh preloading — only full restart works
- opcache_reset() also does NOT refresh preloading (preloaded classes are GC_IMMUTABLE)

### 4. Verify Preloading After Restart
- Run: `php -r 'print_r(opcache_get_status(false)["preload_statistics"]);'`
- Confirm preload script executed: functions, classes, and scripts arrays populated
- Check PHP-FPM logs for preloading errors
- Silent preloading failure means the app runs without preloading benefits

### 5. Warm OpCache and Rejoin
- Run warm-up script hitting all critical endpoints
- Verify OpCache hit rate >95%
- Verify health check passes (DB, workers, listen queue)
- Signal load balancer to rejoin: register the instance as active

### 6. Batch Preloading Updates
- Collect preloading changes for larger, less frequent releases
- Each preloading update requires full restart with load balancer drain
- Frequent restarts increase operational risk
- Balance preloading freshness against restart cost

### 7. Include Preloading in Rollback Plan
- Rollback must include full restart to restore previous preloaded classes
- Rolling back code files without restart leaves new preloaded classes in memory
- Rollback sequence: drain → code revert → full restart → warm → health check → rejoin

## Validation Checklist
- [ ] Preloading changes tested in staging before production
- [ ] Load balancer drained before full restart
- [ ] Full PHP-FPM restart executed (not reload, not reset)
- [ ] Preloading state verified after restart
- [ ] OpCache warmed after restart before rejoining
- [ ] Preloading updates batched to minimize restart frequency
- [ ] Rollback plan includes full PHP-FPM restart

## Related Rules
- Full restart for preloading changes (`05-rules.md:5`)
- Drain before restart (`05-rules.md:33`)
- Verify preloading after restart (`05-rules.md:65`)
- Minimize preloading changes (`05-rules.md:102`)
- Test in staging first (`05-rules.md:129`)
- Include preloading in rollback (`05-rules.md:159`)

## Related Skills
- OpCache Reset Strategies
- PHP-FPM Graceful Reload Patterns
- Deployment Cache Invalidation
- Rollback Planning and Version Mismatch

## Success Criteria
- Preloading changes applied with full restart (not reload or reset)
- Load balancer drain prevents connection drops during restart
- Preloading state verified with opcache_get_status() after restart
- Changes tested in staging before production
- Preloading updates batched to minimize restart frequency
- Rollback procedure includes full restart to restore previous preloaded classes
