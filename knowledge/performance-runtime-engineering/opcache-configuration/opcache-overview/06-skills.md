# Skill: Enable and Verify OpCache for a Production PHP Application

## Purpose

Enable OpCache as the first PHP optimization step, verify it is active, and establish baseline metrics for further tuning.

## When To Use

- Initial PHP server setup
- Auditing an existing deployment for OpCache configuration
- Before enabling JIT or preloading (OpCache is the prerequisite)

## When NOT To Use

- For local development environments (disable or enable with validate_timestamps=1)
- For single-execution CLI scripts where OpCache provides no benefit
- When PHP is used in embedded contexts without shared memory support

## Prerequisites

- Access to php.ini configuration
- Ability to restart PHP-FPM
- PHP application deployed and accessible

## Inputs

- Current OpCache configuration (php.ini)
- PHP version
- Application file count

## Workflow (numbered steps)

1. Enable OpCache in php.ini: `opcache.enable=1` and restart PHP-FPM
2. Verify OpCache is active: `php -i | grep 'opcache.enable'` should show "opcache.enable => On"
3. Execute a few requests to populate the cache
4. Check OpCache status: call `opcache_get_status(false)` from a PHP script
5. Verify the hit rate: target >99% — record the initial value
6. Check cache_full indicator: should be false — if true, memory is undersized
7. Set `opcache.validate_timestamps=0` for production to eliminate stat() syscalls
8. Add `opcache_reset()` to the deployment pipeline (required when validate_timestamps=0)
9. Benchmark throughput with OpCache enabled vs disabled to measure the impact
10. Document the initial OpCache configuration and baseline metrics

## Validation Checklist

- [ ] opcache.enable=1 set in php.ini
- [ ] OpCache verified active: `php -i | grep opcache.enable`
- [ ] Hit rate >99% recorded
- [ ] cache_full = false confirmed
- [ ] validate_timestamps=0 configured for production
- [ ] opcache_reset() added to deployment pipeline
- [ ] Before/after benchmark documents OpCache impact
- [ ] Initial configuration documented

## Common Failures

- **Not verifying OpCache is active**: `php -i` may show configuration, but the module must be loaded
- **Running with default settings for large apps**: Default 128MB memory may be insufficient for frameworks
- **validate_timestamps=0 without deployment automation**: Stale code serves until manual reset
- **Assuming OpCache is enabled by default**: Many PHP installations have it disabled

## Decision Points

- If enable is already set: proceed to verify and tune
- If enable is not set: enable immediately (highest-ROI change)
- If hit rate <99%: tuning needed (increase memory or max files)
- If cache_full = true: increase memory_consumption

## Performance Considerations

- OpCache provides 2-4x throughput improvement over OpCache-disabled
- Default settings provide 1.5-2x — tuning provides additional gain
- validate_timestamps=0 saves 1-3% CPU by eliminating stat() syscalls
- Every 1% decrease in hit rate increases CPU ~0.5-1%

## Security Considerations

- validate_timestamps=0 requires deployment automation — stale code serves until reset
- OpCache file cache directory must not be publicly accessible
- OpCache shared memory may be readable by other processes on the same system

## Related Rules (from 05-rules.md)

- Enable OpCache First, Tune Later — Never Run Production Without It
- Never Disable OpCache for Debugging
- Automate opcache_reset() in Every Deployment Pipeline

## Related Skills

- OpCache Memory Sizing
- OpCache Max Accelerated Files Calculation
- OpCache Monitoring and Hit Rate Analysis
- Production Hardening Settings

## Success Criteria

- OpCache enabled and verified active
- Hit rate >99% after cache population
- cache_full = false
- validate_timestamps=0 configured with deployment automation
- Benchmark documents throughput improvement
