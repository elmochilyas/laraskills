# Skill: Select and Execute OpCache Reset Strategy by Deployment Type

## Purpose
Select the appropriate OpCache invalidation strategy — `opcache_reset()` with cachetool for fast code rollouts (microsecond execution, no preloading refresh), `opcache_invalidate()` for single-file hotfixes, or full PHP-FPM restart when preloading changes (only mechanism that refreshes preloaded classes) — each followed by cache warm-up, endpoint security, and hit rate verification to prevent stale-code serving and cold-start latency.

## When To Use
- Deploying code to production PHP-FPM environments
- Applying single-file emergency hotfixes
- Changing preloading script or preloaded class files
- CI/CD pipeline cache invalidation step

## When NOT To Use
- Development environments (use validate_timestamps=1)
- Containerized deployments with pre-warmed file cache (invalidation is inherent)
- Systems without cachetool or SSH access

## Prerequisites
- cachetool installed (Composer global or project dependency)
- OpCache reset web endpoint secured (auth + IP restriction)
- Warm-up script for post-reset population
- Understanding of preloading lifecycle

## Inputs
- Deployment type: code-only, preloading change, single-file hotfix, PHP version change
- Server access method: HTTP endpoint or SSH

## Workflow

### 1. Determine Deployment Type
- Code-only (no preloading changes): use `opcache_reset()` via cachetool
- Preloading script changed: use full PHP-FPM restart (opcache_reset() doesn't refresh preloading)
- Single-file hotfix: use `opcache_invalidate('/path/to/file.php')` for targeted recompilation
- PHP version upgrade: full PHP-FPM restart + delete OpCache file cache directory

### 2. Execute Reset with cachetool
- For HTTP access: `cachetool opcache:reset --web --web-path=http://localhost/opcache.php`
- For SSH access: `cachetool opcache:reset --ssh --user=deploy --host=web1`
- For multi-instance: `cachetool opcache:reset --all`
- Verify: check `opcache_get_status()['hit_rate']` dropped to 0

### 3. Secure the Reset Endpoint
- Protect `/opcache.php` with authentication middleware
- Add rate limiting: 1 request per 60 seconds
- Restrict to internal network or specific IPs
- Exposed reset endpoint is a DoS attack vector

### 4. Combine with Warm-Up
- After any reset, OpCache is completely empty
- Run warm-up script hitting all critical endpoints
- Each request populates OpCache for that endpoint's code path
- Without warm-up: first 10-30 users experience 2-5s latency

### 5. Verify OpCache State After Reset
- Query `opcache_get_status(false)` to confirm:
  - `reset` cleared (hit_rate == 0 immediately after reset)
  - After warm-up: hit_rate > 99%
  - preload_statistics populated (if preloading used)
- Never assume reset succeeded based on command exit code alone

### 6. Handle Preloading Changes with Full Restart
- opcache_reset() does NOT re-execute the preload script
- Preloaded classes are flagged GC_IMMUTABLE and survive reset
- Only full PHP-FPM restart (systemctl stop + start) refreshes preloading
- Coordinate with load balancer: drain → restart → warm → rejoin

## Validation Checklist
- [ ] Reset strategy selected based on deployment type
- [ ] cachetool used for automated reset (not manual SSH)
- [ ] Reset endpoint secured (auth + IP restriction + rate limit)
- [ ] OpCache state verified after reset (hit_rate == 0)
- [ ] Warm-up executed after reset before accepting user traffic
- [ ] Preloading changes handled with full restart (not just reset)
- [ ] Hit rate >99% confirmed after warm-up

## Related Rules
- Use cachetool, never manual SSH (`05-rules.md:1`)
- Always warm after reset (`05-rules.md:26`)
- Full restart for preloading changes (`05-rules.md:53`)
- Secure the reset endpoint (`05-rules.md:78`)

## Related Skills
- PHP-FPM Graceful Reload Patterns
- Preloading Update Procedure
- Deployment Cache Invalidation
- CI/CD Cache Invalidation Steps

## Success Criteria
- Correct reset strategy selected per deployment type
- cachetool automates all production resets
- Reset endpoint secured against unauthorized access
- Warm-up prevents cold-start latency for users
- Full restart used when preloading changes (never reset alone)
- OpCache state verified after every reset and warm-up
