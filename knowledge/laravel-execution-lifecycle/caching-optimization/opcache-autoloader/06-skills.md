# Skill: Configure OpCache for Laravel Production

## Purpose
Configure PHP OpCache with Laravel-appropriate settings to cache compiled PHP opcodes in shared memory, eliminating 100-300ms of PHP file re-compilation overhead per request.

## When To Use
- Every production PHP environment serving HTTP requests (FPM, Octane, RoadRunner)
- After deploying or modifying PHP files
- When setting up a new production server

## When NOT To Use
- Local development with `validate_timestamps=0` — code changes won't be reflected
- Systems with extreme memory constraints (<512MB RAM)
- When `opcache.file_cache_only` without shared memory is the only option

## Prerequisites
- PHP OpCache extension installed (`zend opcache` in `php.ini`)
- Access to PHP configuration (`php.ini` or `opcache.ini`)
- Production server or container

## Inputs
- PHP configuration file (`php.ini` or `opcache.ini`)
- Total PHP file count in the project (for `max_accelerated_files`)

## Workflow
1. Enable OpCache: `opcache.enable=1` and `opcache.enable_cli=1`
2. Set `opcache.memory_consumption=256` (monitor and increase if hit ratio < 95%)
3. Set `opcache.max_accelerated_files=20000` (or above total PHP file count)
4. Set `opcache.interned_strings_buffer=32`
5. Set `opcache.validate_timestamps=0` and `opcache.revalidate_freq=0`
6. Set `opcache.use_cwd=0` for better cache hit consistency
7. Set `opcache.fast_shutdown=1`
8. Set `opcache.max_wasted_percentage=10`
9. Restart PHP-FPM or Octane to apply configuration
10. Verify configuration with `php -i | grep opcache`

## Validation Checklist
- [ ] `opcache.enable=1` confirmed via `php -i`
- [ ] `opcache.memory_consumption` set to at least 256MB
- [ ] `opcache.max_accelerated_files` >= total PHP file count
- [ ] `opcache.validate_timestamps=0` in production
- [ ] `opcache.fast_shutdown=1` enabled
- [ ] OpCache hit ratio > 95% monitored via `opcache_get_status()`
- [ ] Status page disabled (`opcache.status=0`) in production

## Common Failures
- Default `memory_consumption` (64-128MB) too small for Laravel — causes evictions
- `validate_timestamps=1` with `revalidate_freq` — periodic stat() overhead
- No OpCache reset after deploy — stale opcodes continue serving with `validate_timestamps=0`
- `max_accelerated_files` below file count — some files never cached
- OpCache status page exposed publicly — information disclosure

## Decision Points
- **validate_timestamps=0 vs 1**: `=0` for maximum production performance (requires deploy-time reset); `=1` only for development
- **opcache.preload**: Use only for Octane with stable framework files; avoid for frequently-changing application code
- **Memory allocation**: Start at 256MB; monitor usage and adjust based on `opcache_get_status()`

## Performance Considerations
- Without OpCache: PHP compiles every file on every request — 100-300ms overhead
- With OpCache: ~30-50ms overhead for shared memory lookup
- With OpCache + preload: ~5-10ms — compilation cost fully eliminated
- Cache hit ratio must be 95%+ in production — lower indicates insufficient memory
- OpCache memory: 128-256MB for typical Laravel application

## Security Considerations
- Stale OpCache can serve old, vulnerable code after a security patch — always reset after patching
- `opcache.preload` loads files with server user's permissions — ensure preloaded files are not writable by untrusted users
- OpCache status page (`opcache.status=1`) reveals file paths and compilation stats — disable in production
- Preloaded files cannot be hot-patched — server restart required to update preloaded code

## Related Rules
- Enable OpCache with sufficient memory in production
- Disable `validate_timestamps` in production
- Reset OpCache after every deployment
- Set `max_accelerated_files` above your PHP file count
- Preload framework files for Octane deployments
- Monitor OpCache hit ratio in production
- Never expose OpCache status endpoint in production

## Related Skills
- Optimize Composer Autoloader for Production
- Reset OpCache After Deployment

## Success Criteria
- OpCache hit ratio > 95% in production
- No stale opcode issues after deployment
- PHP compilation overhead eliminated (files compiled once, cached permanently)
- Configuration resilient to application growth (adequate memory and file limits)
