# Skill: Configure OpCache Revalidation for Production Deployments

## Purpose

Set `opcache.validate_timestamps` and `opcache.revalidate_freq` appropriately for production (disable timestamp checks) with deployment automation for explicit cache invalidation.

## When To Use

- Production OpCache configuration
- Moving from development to production environment
- Auditing existing OpCache configuration

## When NOT To Use

- For development environments where file changes must be immediately visible
- When deployment pipeline cannot automate opcache_reset()
- For shared hosting where php.ini cannot be configured

## Prerequisites

- OpCache enabled and memory sized
- Deployment pipeline that can run post-deploy scripts
- Understanding that validate_timestamps=0 requires explicit cache management

## Inputs

- Current validate_timestamps and revalidate_freq values
- Deployment pipeline capabilities
- Hosting environment type (dedicated, shared, container)

## Workflow (numbered steps)

1. Set `opcache.validate_timestamps=0` in php.ini for production — eliminates stat() syscall overhead
2. Set `opcache.revalidate_freq=0` (ignored when validate_timestamps=0, but good practice)
3. Restart PHP-FPM to apply the configuration
4. Add `opcache_reset()` call to the deployment pipeline — must run after code is deployed
5. For PHP-FPM: use `cachetool opcache:reset --all` or `php -r "opcache_reset();"` on each server
6. For multiple servers, execute opcache_reset() on every server in sequence
7. For containerized deployments: fresh containers start with empty OpCache (no reset needed, but warm-up is required)
8. Verify after deployment: check `opcache_get_status()['opcache_statistics']['hit_rate']` — should start low and climb
9. Document the deployment cache invalidation procedure
10. Set up monitoring alert if hit rate drops below 95%

## Validation Checklist

- [ ] validate_timestamps=0 configured in php.ini
- [ ] PHP-FPM restarted after configuration
- [ ] opcache_reset() added to deployment pipeline
- [ ] Multi-server deployment handles all servers
- [ ] Container deployment includes cache warm-up
- [ ] Hit rate monitoring alert configured (<95% threshold)
- [ ] Deployment cache invalidation procedure documented

## Common Failures

- **validate_timestamps=0 without deployment automation**: New code never executes — users see stale pages
- **Race condition with in-place deploys**: Files partially updated when opcache_reset() runs — use atomic symlink swaps
- **Not invalidating across all servers**: Load balancer distributes to servers running old code
- **Using revalidate_freq=2 for production**: Adds stat() syscall overhead and still has race conditions

## Decision Points

- If deployment pipeline supports post-deploy scripts: validate_timestamps=0 (recommended)
- If deployment pipeline cannot run scripts: validate_timestamps=1 with revalidate_freq=2 (suboptimal but functional)
- For containers: validate_timestamps=0 (fresh container = fresh cache)
- For development: validate_timestamps=1 with revalidate_freq=0 (immediate visibility)

## Performance Considerations

- validate_timestamps=0 saves 1-3% CPU by eliminating stat() syscalls per file per request
- For an app with 20000 files, that's 20000 fewer stat() calls per request
- Stat() syscall costs ~1-3µs each — 20K files × 1µs = 20ms saved per request
- The CPU savings are proportional to the number of files accessed per request

## Security Considerations

- validate_timestamps=0 means PHP never checks for file changes — if deployment automation fails, old code runs indefinitely
- Implement deployment verification: after deploy, check that a new feature/version string is visible
- Always test the deployment pipeline in staging before production

## Related Rules (from 05-rules.md)

- Automate opcache_reset() in Every Deployment Pipeline
- Never Rely on validate_timestamps=1 for Deployment Cache Invalidation

## Related Skills

- OpCache Reset Strategies
- PHP-FPM Graceful Reload Patterns
- CI/CD Cache Invalidation Steps
- Zero-Downtime Deployment

## Success Criteria

- validate_timestamps=0 configured in production
- Deployment pipeline includes opcache_reset() on all servers
- No stale-code serving after deployments
- Hit rate monitoring alerts configured
- Procedure documented and tested in staging
