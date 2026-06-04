# Skill: Configure OpCache for Laravel Production

## Purpose
Configure PHP OpCache with Laravel-appropriate settings to cache compiled PHP opcodes in shared memory, eliminating 100-300ms of PHP file re-compilation overhead per request.

## When To Use
- Every production PHP environment serving HTTP requests (FPM, Octane, RoadRunner, FrankenPHP)
- After deploying or modifying PHP files
- When setting up a new production server or container

## When NOT To Use
- Local development with `validate_timestamps=0` — code changes won't be reflected
- Systems with very limited memory (e.g., some shared hosting) — allocate at least 128MB
- When using `opcache.file_cache_only` without shared memory — file-based caching is slower

## Prerequisites
- PHP OpCache extension installed (`zend opcache` enabled in `php.ini`)
- Access to PHP configuration file
- Knowledge of total PHP file count in the project

## Inputs
- PHP configuration file (`php.ini` or `opcache.ini`)
- Total PHP file count (via `find . -name "*.php" | wc -l`)

## Workflow
1. Enable OpCache: `opcache.enable=1` and `opcache.enable_cli=1`
2. Set memory: `opcache.memory_consumption=256` (128-256MB for Laravel)
3. Set max files: `opcache.max_accelerated_files=20000` (above total file count)
4. Set `opcache.interned_strings_buffer=32`
5. Disable timestamp validation: `opcache.validate_timestamps=0` and `opcache.revalidate_freq=0`
6. Set `opcache.use_cwd=0` for consistent cache hits
7. Set `opcache.fast_shutdown=1` for optimized process termination
8. Set `opcache.max_wasted_percentage=10`
9. Disable status page: `opcache.status=0`
10. For Octane: configure `opcache.preload` with stable framework files
11. Restart PHP-FPM or Octane to apply configuration
12. Verify with `php -i | grep opcache` and `opcache_get_status()`

## Validation Checklist
- [ ] `opcache.enable=1` confirmed via `php -i`
- [ ] `opcache.memory_consumption` set to at least 256MB
- [ ] `opcache.max_accelerated_files` >= total PHP file count
- [ ] `opcache.validate_timestamps=0` in production configuration
- [ ] `opcache.fast_shutdown=1` enabled
- [ ] OpCache hit ratio > 95% monitored via `opcache_get_status()`
- [ ] Status page disabled (`opcache.status=0`) in production
- [ ] OpCache reset or PHP restart included in deployment script

## Common Failures
- Default `memory_consumption` (64-128MB) too small for Laravel — causes cache evictions and thrashing
- `validate_timestamps=1` with `revalidate_freq` — unnecessary stat() overhead
- No OpCache reset after deploy — stale opcodes continue serving with `validate_timestamps=0`
- `max_accelerated_files` below file count — some PHP files never cached
- OpCache status page exposed publicly — information disclosure
- Preloading application code that changes frequently — requires server restart on every deploy

## Decision Points
- **validate_timestamps=0 vs 1**: `=0` for maximum production performance (requires deploy-time reset); `=1` only for development
- **opcache.preload**: Use only for Octane with stable framework/vendor files; avoid for application code that changes between deployments
- **Memory allocation**: Start at 256MB; monitor with `opcache_get_status()` and adjust

## Performance Considerations
- Without OpCache: PHP compiles every file on every request — 100-300ms overhead per request
- With OpCache (default settings): ~30-50ms overhead for shared memory lookup
- With OpCache + preload: ~5-10ms — compilation cost fully eliminated
- Cache hit ratio must be 95%+ in production — lower indicates insufficient memory or max_files
- OpCache memory usage: 128-256MB for a typical Laravel application

## Security Considerations
- Stale OpCache can serve old, vulnerable code after a security patch — always reset after patching
- `opcache.preload` loads files with server user's permissions — ensure preloaded files are not writable by untrusted users
- OpCache status page (`opcache.status=1`) reveals file paths and compilation statistics — disable in production
- Preloaded files cannot be hot-patched — server restart required to update preloaded code

## Related Rules
- Allocate sufficient OpCache memory for Laravel
- Disable `validate_timestamps` in production
- Reset OpCache after every deployment
- Set `max_accelerated_files` above PHP file count
- Use `opcache.preload` only for stable framework files
- Never expose OpCache status endpoint in production
- Monitor OpCache hit ratio and memory usage
- Use fast shutdown for clean process termination

## Related Skills
- Optimize Composer Autoloader for Production
- Reset OpCache After Deployment
- Execute Optimize in Deployment Sequence

## Success Criteria
- OpCache hit ratio > 95% in production
- No stale opcode issues after code deployment
- PHP compilation overhead eliminated (files compiled once, cached permanently)
- Configuration scales with application growth (adequate memory and file limits)
