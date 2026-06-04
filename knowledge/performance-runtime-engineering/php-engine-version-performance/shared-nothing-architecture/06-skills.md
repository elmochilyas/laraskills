# Skill: Optimize Within the Shared-Nothing Architecture

## Purpose

Maximize throughput in PHP-FPM's shared-nothing model by reducing per-request bootstrap overhead through OpCache, preloading, and Composer optimization.

## When To Use

- Running PHP-FPM in production and cannot migrate to memory-resident architecture yet
- Per-request bootstrap time exceeds 30% of total request time
- Preparing to evaluate whether memory-resident architecture is worth the migration effort

## When NOT To Use

- When bootstrap time is <20% of request time (optimization impact is minimal)
- When the team is already migrating to Octane (focus efforts on migration instead)
- For legacy applications where composer.json cannot be modified

## Prerequisites

- OpCache enabled and monitored
- Profiling data showing bootstrap time proportion
- Access to php.ini configuration
- Composer installed and accessible

## Inputs

- Current OpCache configuration (php.ini)
- Current Composer autoloader configuration
- Profiling data showing bootstrap vs execution time breakdown
- File count in the application directory

## Workflow (numbered steps)

1. Profile the application to measure bootstrap time as percentage of wall time
2. Enable OpCache with `opcache.enable=1` if not already enabled — this is the highest-ROI single change
3. Size OpCache memory: count PHP files, multiply by 10KB average compiled size, add 20% headroom
4. Set `opcache.max_accelerated_files` to 1.5x the PHP file count (rounded to nearest prime)
5. Set `opcache.validate_timestamps=0` in production to eliminate stat() syscalls
6. Configure Composer autoloader optimization: `composer install --optimize-autoloader --classmap-authoritative`
7. Enable preloading: identify frequently-loaded classes from profiling and create a preload script
8. Set `opcache.preload=/path/to/preload.php` in php.ini
9. Benchmark before/after each optimization to measure individual impact
10. Document the optimized configuration and expected bootstrap time reduction

## Validation Checklist

- [ ] OpCache enabled and hit rate >99%
- [ ] OpCache memory sized correctly (free >20% after warm-up)
- [ ] `validate_timestamps=0` configured in production
- [ ] Composer autoloader optimized (`--classmap-authoritative`)
- [ ] Preloading configured and verified
- [ ] Bootstrap time measured and compared before/after
- [ ] Deployment automation includes opcache_reset() step

## Common Failures

- **Not sizing OpCache for the application**: Default 128MB is insufficient for Laravel/Symfony — causes cache full and eviction
- **Skipping preloading**: Preloading the top 100 classes saves 1-3ms per request, often overlooked
- **Not optimizing Composer autoloader**: Default PSR-4 autoloader does filesystem lookups on every class load
- **Forgetting deployment automation**: validate_timestamps=0 requires explicit opcache_reset() after every deploy

## Decision Points

- If bootstrap time is 20-50% of request time: shared-nothing optimization (OpCache + preloading) provides significant improvement
- If bootstrap time is >50%: memory-resident architecture (Octane) may be worth the migration effort
- If bootstrap time is <20%: focus optimization efforts on application logic and I/O instead

## Performance Considerations

- OpCache provides 2-4x throughput improvement over OpCache-disabled
- Preloading reduces cold-start autoloading by 1-3ms per request
- Composer --classmap-authoritative eliminates filesystem autoloader lookups (0.5-1ms savings)
- These optimizations do not eliminate bootstrap overhead — they reduce it within the shared-nothing model

## Security Considerations

- validate_timestamps=0 requires deployment automation — stale code serves until explicit reset
- Preloading script runs with full privileges — only trusted code should be preloaded
- OpCache file cache directory must not be publicly accessible

## Related Rules (from 05-rules.md)

- Never Share State Across PHP-FPM Workers via Shared Memory
- Choose Memory-Resident Architecture When Bootstrap Exceeds 20%
- Always Optimize Bootstrap Within Shared-Nothing Model
- Never Treat Shared-Nothing as a Performance Optimization

## Related Skills

- OpCache Configuration and Sizing
- Preloading Script Design Patterns
- Composer Autoloader Optimization

## Success Criteria

- Bootstrap time reduced by 40-60% through OpCache + preloading + Composer optimization
- Throughput improvement measured and documented (typically 1.5-3x)
- Deployment automation includes cache invalidation
- Decision documented: stay on FPM or migrate to memory-resident based on remaining bootstrap overhead
