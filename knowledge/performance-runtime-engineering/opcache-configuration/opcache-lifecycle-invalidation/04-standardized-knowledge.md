# OpCache Lifecycle and Invalidation - opcache_reset(), opcache_invalidate(), PHP-FPM Graceful Reload

| Metadata | |
|----------|--|
| Domain | Performance & Runtime Engineering |
| Subdomain | OpCache Configuration & Preloading |
| Knowledge Unit | OpCache Lifecycle and Invalidation - opcache_reset(), opcache_invalidate(), PHP-FPM Graceful Reload |
| Difficulty | Foundation |
| Last Updated | 2026-06-02 |

## Overview

OpCache invalidation clears stale opcodes after code deployment. Three mechanisms exist: opcache_reset() (clears entire cache), opcache_invalidate() (clears specific file), and PHP-FPM graceful reload (clears OpCache as workers restart). With validate_timestamps=0, explicit invalidation is required after every deployment.

## Core Concepts

- opcache_reset(): Atomically clears entire OpCache. All files recompiled on next access. Must be called on every PHP-FPM worker (or via web endpoint). Executes in <1ms.
- opcache_invalidate($filepath): Removes specific file from cache. Used during development or partial deployments.
- PHP-FPM graceful reload: kill -USR2 <master_pid> or systemctl reload php8.x-fpm. Master restarts workers one-by-one. Each new worker has empty OpCache.
- opcache.file_cache invalidation: Both memory and file cache must be invalidated. File cache requires deleting cache files.

## When To Use

- After every code deployment to production.
- During development when testing file changes with OpCache enabled.
- When diagnosing OpCache-related issues.

## When NOT To Use

- Between requests in normal operation (except during deployments).
- For single-file updates in development (use opcache_invalidate instead).

## Best Practices (WHY)

| Practice | WHY |
|----------|-----|
| Always warm cache after opcache_reset() | First request recompiles all files (2-5s latency spike). |
| Use PHP-FPM graceful reload for preloading changes | Preloading scripts survive opcache_reset(). Restart needed. |
| Include opcache_reset() in deployment scripts | Ensures consistent state. |

## Architecture Guidelines

- opcache_reset() marks all cached entries as stale, not deallocates memory immediately.
- preloading scripts re-execute on PHP-FPM restart, not on opcache_reset().
- file cache requires separate invalidation (delete directory contents).

## Performance Considerations

- opcache_reset() is nearly instantaneous (<1ms). The cost is recompilation of files on subsequent requests.
- First request after reset: 2-5s for large applications if preloading is not used.
- Preloaded classes are NOT affected by opcache_reset(). Must restart PHP-FPM to refresh preloaded classes.

## Security Considerations

- opcache_reset() should be restricted to admin-level access only.
- Never expose opcache_reset() via public web endpoint without authentication.

## Common Mistakes

| Mistake | Description | Consequence | Better Approach |
|---------|-------------|-------------|----------------|
| opcache_reset() without warming | First request recompiles all files. | 2-5s latency spike. | Warm cache after reset. |
| Not restarting PHP-FPM when preloading changes | Preloaded classes from old deployment persist. | Mixed old/new class definitions. | Always restart PHP-FPM when preloading script changes. |

## Anti-Patterns

- Calling opcache_reset() on every deployment without warming: Creates latency spikes.
- Relying on opcache_reset() to clear preloaded classes: Use PHP-FPM restart instead.

## Examples

```bash
# Deployment script
php artisan down
git pull
php artisan migrate --force
opcache_reset()   # via PHP CLI or web endpoint
php artisan up

# For preloading changes
systemctl restart php8.3-fpm
```

## Related Topics

- PHP-FPM Graceful Reload Patterns
- OpCache Reset Strategies
- Deployment Cache Invalidation

## AI Agent Notes

- opcache_reset() is NOT sufficient for preloading changes - must restart PHP-FPM.
- Always warm after reset. 2-5s first request is unacceptable for user-facing apps.
- In containers, opcache_reset() is unnecessary (new container = fresh state).
- For Laravel Forge: built-in OpCache reset functionality in dashboard.

## Verification

- [ ] Implement deployment script with opcache_reset().
- [ ] Verify cache warmup after reset.
- [ ] Test PHP-FPM graceful reload.
- [ ] Document invalidation procedure for your deployment.
- [ ] Monitor first-request latency after invalidation.