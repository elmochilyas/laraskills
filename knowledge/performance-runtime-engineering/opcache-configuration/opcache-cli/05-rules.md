---
## Rule Name

Enable OpCache for Long-Running CLI Daemons Only

## Category

Performance

## Rule

Enable `opcache.enable_cli=1` only for long-running CLI processes (queue workers, Octane, Swoole servers). Keep it disabled for short-lived CLI scripts.

## Reason

Short-lived CLI scripts (cron jobs, one-off commands) execute once and exit — OpCache's shared memory setup provides zero benefit and adds overhead. Long-running daemons process thousands of jobs per process lifetime and benefit from eliminating recompilation for every job.

## Bad Example

```ini
; Global php.ini — enabled for all CLI scripts
opcache.enable_cli=1
; One-off cron jobs also try to use shared memory — wasted overhead
```

## Good Example

```ini
; Default (disabled) — opt-in for daemons only
opcache.enable_cli=0
# Enable per-daemon: php -d opcache.enable_cli=1 artisan queue:work
```

## Exceptions

CI/CD environments where the same test suite runs frequently and benefits from caching across runs.

## Consequences Of Violation

For short-lived scripts: unnecessary shared memory setup overhead. For long-running daemons: 50–75% CPU wasted on recompilation for every job.

---

## Rule Name

Use php -d opcache.enable_cli=1 for Daemon Processes

## Category

Performance

## Rule

Pass `-d opcache.enable_cli=1` as a per-command flag to long-running CLI daemons rather than enabling it globally.

## Reason

Global `opcache.enable_cli=1` affects all CLI scripts, including short-lived ones that do not benefit. Per-command flag ensures only the intended daemons get OpCache, avoiding unnecessary shared memory operations for other CLI invocations.

## Bad Example

```ini
; php.ini — globally enabled
opcache.enable_cli=1
```

## Good Example

```bash
# Queue worker — OpCache explicitly enabled
php -d opcache.enable_cli=1 artisan queue:work --queue=high,default
# Cron job — OpCache not enabled (using default)
php artisan schedule:run
```

## Exceptions

Servers dedicated exclusively to running long-running PHP daemons where no short-lived scripts execute.

## Consequences Of Violation

Unnecessary CPU overhead on short-lived scripts, shared memory segment allocated when not needed.

---

## Rule Name

Always Include opcache_reset in Deployment Scripts

## Category

Reliability

## Rule

Always include `php -r 'opcache_reset();'` in deployment scripts to clear the OpCache after code changes.

## Reason

CLI `opcache_reset()` clears the shared memory cache used by web workers. Without this step, stale opcodes serve after deployment when `validate_timestamps=0`.

## Bad Example

```bash
# Deployment script with no cache reset
git pull origin main
# OpCache still serves old compiled code
```

## Good Example

```bash
# Deployment script with cache reset
git pull origin main
php -r '
if (opcache_reset()) {
    echo "OpCache reset successful\n";
} else {
    echo "ERROR: OpCache reset failed\n";
    exit(1);
}
'
```

## Exceptions

Deployments where PHP-FPM is restarted as part of the process (restart implicitly clears the cache).

## Consequences Of Violation

Stale code serving after deployment, security patches not applied, debugging confusion.

---

## Rule Name

Run opcache_reset on Each Web Server Individually

## Category

Reliability

## Rule

Run `php -r 'opcache_reset();'` on each individual web server. Never assume a remote call clears the cache across all servers.

## Reason

`opcache_reset()` only clears the shared memory segment on the server where it executes. In a multi-server deployment, each server has its own OpCache and must be reset individually.

## Bad Example

```bash
# Called reset on one server — others still serve stale code
ssh web01 "php -r 'opcache_reset();'"
# web02, web03, web04 still have old cache
```

## Good Example

```bash
# Reset on every server in the fleet
for server in web01 web02 web03 web04; do
    ssh "$server" "php -r 'opcache_reset();'"
done
```

## Exceptions

Single-server deployments.

## Consequences Of Violation

Stale code serving from servers that missed the reset, inconsistent behavior across the fleet, difficult-to-diagnose intermittent issues.

---

## Rule Name

Disable CLI OpCache in Development

## Category

Maintainability

## Rule

Never enable `opcache.enable_cli=1` in development environments.

## Reason

CLI OpCache caches compiled files across invocations, meaning code changes do not take effect until the cache is reset. This leads to confusing "my code change didn't work" scenarios and wasted debugging time.

## Bad Example

```bash
# Development with CLI OpCache — code changes invisible
php -d opcache.enable_cli=1 artisan test
# Changed a class — run again
php -d opcache.enable_cli=1 artisan test
# Still executing old code — must reset cache manually
```

## Good Example

```bash
# Development — no CLI OpCache, fresh compilation every time
php artisan test
# Code changes take effect immediately
```

## Exceptions

No common exceptions. Development environments need immediate code feedback.

## Consequences Of Violation

Frustrating development experience, wasted debugging time on "code changes not taking effect," developers disabling OpCache entirely.

---

## Rule Name

Do Not Use OpCache to Speed Up composer install

## Category

Performance

## Rule

Never enable CLI OpCache for Composer operations or other disk/network-bound CLI tools.

## Reason

Composer operations are disk I/O (reading packages) and network (downloading packages) bound — not CPU-bound. OpCache optimizes CPU compilation, which is a negligible fraction of Composer's execution time. Adding OpCache adds shared memory overhead with zero benefit.

## Bad Example

```bash
php -d opcache.enable_cli=1 composer install
# Zero benefit — Composer is disk and network bound
```

## Good Example

```bash
composer install  # Default — no CLI OpCache needed
```

## Exceptions

No common exceptions.

## Consequences Of Violation

Unnecessary shared memory allocation, no measurable performance improvement, wasted memory.
