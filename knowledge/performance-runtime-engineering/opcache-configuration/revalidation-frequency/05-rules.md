---
## Rule Name

Set validate_timestamps to 0 in Production

## Category

Performance

## Rule

Always set `opcache.validate_timestamps=0` in production environments. Never use timestamp validation in production.

## Reason

Timestamp validation requires a `stat()` syscall for every cached file on every access check, consuming 1–3% CPU. In production, code changes are deployed deliberately and the cache can be explicitly reset via `opcache_reset()`.

## Bad Example

```ini
; Production — wasting 1–3% CPU on stat() calls
opcache.validate_timestamps=1
opcache.revalidate_freq=2
```

## Good Example

```ini
; Production — zero stat() overhead
opcache.validate_timestamps=0
opcache.revalidate_freq=0
```

## Exceptions

Environments where deployment automation cannot reliably call `opcache_reset()` and code changes must take effect automatically within minutes.

## Consequences Of Violation

1–3% wasted CPU on stat() syscalls at all times, unnecessary overhead at scale (100+ req/s).

---

## Rule Name

Automate opcache_reset in Deployment Pipeline

## Category

Reliability

## Rule

Never set `validate_timestamps=0` without adding an automated `opcache_reset()` call to the deployment pipeline.

## Reason

With `validate_timestamps=0`, OpCache never checks file modification times. Without an explicit reset, old opcodes serve indefinitely after deployment, meaning security patches, bug fixes, and features never take effect.

## Bad Example

```bash
# Deploy script with no cache reset
git pull origin main
# OpCache still serves old compiled code
```

## Good Example

```bash
# Deploy script with automated cache reset
git pull origin main
php -r 'opcache_reset();'
# Or via PHP-FPM reload
sudo systemctl reload php8.5-fpm
```

## Exceptions

No common exceptions. Every deployment must invalidate the cache.

## Consequences Of Violation

Stale code serving indefinitely, security patches not applied, bug fixes invisible, silent deployment failure.

---

## Rule Name

Never Set revalidate_freq to 0 in Production

## Category

Performance

## Rule

Never set `opcache.revalidate_freq=0` in production when `validate_timestamps=1` is enabled.

## Reason

With `revalidate_freq=0`, OpCache checks file timestamps on every single request, causing 5–15% CPU overhead from stat() calls. This is the worst of both worlds — CPU wasted on checks that should not exist in production.

## Bad Example

```ini
opcache.validate_timestamps=1
opcache.revalidate_freq=0  # Stat() on every request — 15% CPU overhead
```

## Good Example

```ini
; Production
opcache.validate_timestamps=0
; Development
opcache.validate_timestamps=1
opcache.revalidate_freq=2
```

## Exceptions

Temporary debugging sessions where immediate code changes must be visible and the developer accepts the performance cost.

## Consequences Of Violation

5–15% CPU overhead from stat() on every request, unnecessary load on filesystem, degraded throughput.

---

## Rule Name

Use validate_timestamps=1 Only in Development

## Category

Maintainability

## Rule

Set `opcache.validate_timestamps=1` with `revalidate_freq=2` in development environments to allow code changes to take effect without manual cache reset.

## Reason

In development, code changes frequently and immediate feedback is essential. Timestamp checking ensures that a file change within the last 2 seconds triggers recompilation on the next access, without requiring manual cache management.

## Bad Example

```ini
; Development with validate_timestamps=0
opcache.validate_timestamps=0
; Developer must call opcache_reset() after every code change
```

## Good Example

```ini
; Development — changes visible within 2 seconds
opcache.validate_timestamps=1
opcache.revalidate_freq=2
```

## Exceptions

No common exceptions. Development environments should always use timestamp validation.

## Consequences Of Violation

Frustrating development experience where code changes are invisible without manual cache reset, encouraging developers to disable OpCache entirely.

---

## Rule Name

Disable revalidate_path

## Category

Performance

## Rule

Always leave `opcache.revalidate_path=0` (default) in all environments.

## Reason

Enabling `revalidate_path` causes OpCache to check file timestamps even for files that have not changed at the cache lookup level, adding unnecessary stat() overhead. It was designed for edge cases with include path variations and should not be enabled in modern applications.

## Bad Example

```ini
opcache.revalidate_path=1  # Unnecessary stat() overhead
```

## Good Example

```ini
opcache.revalidate_path=0  # Default — skip redundant checks
```

## Exceptions

Applications that dynamically change the include path and rely on the exact file path for cache matching (extremely rare in modern PHP).

## Consequences Of Violation

Unnecessary CPU overhead from redundant stat() calls, no measurable benefit for typical applications.

---

## Rule Name

Use validate_timestamps=0 in Containerized Environments

## Category

Architecture

## Rule

Always set `validate_timestamps=0` in containerized environments where the filesystem is immutable after container build.

## Reason

Container images are immutable — files never change during the container's lifetime. Every stat() check is unconditionally wasted because the cached opcodes are always valid. Eliminating these checks saves CPU and improves performance.

## Bad Example

```dockerfile
# Container with timestamp validation — wasted stat() overhead
COPY . /var/www/html
# php.ini still has validate_timestamps=1
```

## Good Example

```dockerfile
# Container with validate_timestamps=0
COPY . /var/www/html
# php.ini: opcache.validate_timestamps=0
```

## Exceptions

Development containers where code is mounted as a volume and changes during execution.

## Consequences Of Violation

1–3% CPU wasted on stat() calls that always return "no change" in immutable container filesystems.

---

## Rule Name

Test Deployment Procedure After Switching to validate_timestamps=0

## Category

Reliability

## Rule

Always verify the deployment pipeline's cache invalidation step after changing `validate_timestamps` from 1 to 0.

## Reason

The operational contract changes fundamentally — code is no longer automatically detected. If the `opcache_reset()` call in the deployment pipeline fails silently, the system serves stale code indefinitely until manual intervention.

## Bad Example

```bash
# Switched to validate_timestamps=0 but deployment script has a typo
php -r 'opcache_reset();'  # Error: function name misspelled
# No output — failure is silent, cache is not cleared
```

## Good Example

```bash
# Verify reset works after deployment
php -r '
if (opcache_reset()) {
    echo "OpCache cleared successfully\n";
} else {
    echo "ERROR: OpCache reset failed\n";
    exit(1);
}
'
```

## Exceptions

Environments where PHP-FPM is restarted as part of deployment (restart implicitly clears the cache).

## Consequences Of Violation

Silent deployment failure where new code appears to be deployed but old code continues to serve, causing confusion and delayed bug fixes.
