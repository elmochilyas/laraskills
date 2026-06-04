# Metadata

Domain: Data & Storage Systems
Subdomain: Schema Design & Migration Engineering
Knowledge Unit: 1.9 Migration isolation (isolated option, cache lock)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

The `--isolated` option prevents multiple servers from running migrations concurrently. It acquires an atomic cache lock — only the first server acquires the lock; subsequent attempts exit gracefully. This is essential for load-balanced, multi-server deployments where concurrent migration execution causes race conditions, partial migration states, and deployment failures.

---

# Core Concepts

- **Problem**: In multi-server deployments, all servers may attempt `php artisan migrate` simultaneously. Both servers apply the same migration, causing duplicate schema errors.
- **Solution**: `php artisan migrate --isolated` uses the application's cache driver to acquire an atomic lock before executing migrations.
- **Lock timeout**: The lock is held for the migration duration. Configurable via `MIGRATION_LOCK_TIMEOUT` (default 30 seconds).
- **Exit behavior**: Servers that fail to acquire the lock exit with success code (0) — they don't fail the deployment.

---

# Mental Models

`--isolated` is a mutex for migration execution. Only one process can hold the mutex at a time. All other processes skip migration when they see the mutex is held.

---

# Internal Mechanics

When `php artisan migrate --isolated` is invoked:
1. Laravel attempts to acquire a lock via `Cache::lock('migration', timeout)`.
2. If the lock is acquired: run migrations normally, release lock after completion.
3. If the lock is not acquired: print a message, exit with code 0.
4. The lock uses the default cache driver (Redis, Memcached, file, database).
5. Lock timeout prevents permanent locks if the holding process crashes.

---

# Patterns

**Always use --isolated in deploy scripts**: For any multi-server deployment, `--isolated` should be the default. The overhead of a cache lock is negligible.

**Combine with horizon:terminate**: After the isolated migration completes, terminate Horizon workers so they reconnect with the updated schema.

**Monitor lock acquisition**: Add logging to track which server acquired the migration lock and for how long.

---

# Architectural Decisions

| Decision | When | When Not |
|----------|------|----------|
| --isolated | Multi-server deployments | Single-server or zero-downtime deploy strategies |
| No isolation | Single-server deployments | Risk of manual duplicate execution |

---

# Tradeoffs

Benefit | Cost | Consequence
--------|-----|------------
Prevents race conditions | Cache dependency | Deployment fails if cache is down
Graceful skip for non-lockers | Potential for cached lock after crash | Lock timeout setting is critical
Zero config change for app code | Requires cache driver that supports atomic locks | File/database cache may not work reliably

---

# Performance Considerations

- Cache lock overhead is negligible (< 5ms).
- Migration time is unchanged — only one server runs migrations anyway.
- Lock timeout should exceed the expected longest migration time. Default 30 seconds may be too short for large data backfill migrations.

---

# Production Considerations

- **Cache driver compatibility**: Redis and Memcached support atomic locks. File and database cache drivers may not — test before relying on `--isolated`.
- **Lock timeout tuning**: If a migration takes > 30 seconds, the lock expires and a second server may acquire it, causing concurrent migration. Set `MIGRATION_LOCK_TIMEOUT` (or custom config) to a value exceeding your longest migration.
- **Horizon/Swoole/Octane**: After migrations, restart queue workers to ensure they use the updated schema. Add `php artisan horizon:terminate` after `migrate --isolated`.
- **Failed migration handling**: If the server holding the lock crashes during migration, the lock eventually times out. The migration state may be partial — manual recovery is needed.

---

# Common Mistakes

**Not using --isolated in multi-server deployments**: Two servers run the same migration simultaneously. The second server encounters "table already exists" or "duplicate column" errors, failing the deployment.

**Lock timeout too short**: A migration takes 45 seconds but the lock timeout is 30. The lock expires, a second server acquires it, and both run the migration concurrently.

**Assuming single-server safety**: Even on a single server, manual `php artisan migrate` from two terminal sessions can cause the same race. --isolated prevents this.

---

# Failure Modes

- **Cache down**: If the cache driver is unavailable, `--isolated` cannot acquire the lock. Migration either fails or runs without isolation depending on configuration.
- **Lock holder crash**: The process holding the lock crashes mid-migration. The lock eventually expires. The migration state may be partially applied, requiring manual inspection and recovery.
- **Simultaneous schema:dump conflicts**: Running `schema:dump` from multiple servers simultaneously can produce corrupted dump files.

---

# Ecosystem Usage

Laravel Forge includes `--isolated` in its deploy script by default. Docker/Kubernetes deployment scripts should always pass `--isolated`. Horizon's deployment recommendations include `--isolated` as a required step.

---

# Related Knowledge Units

1.7 Migration batch tracking | 1.25 Rollback strategy | 1.21 Multi-tenant migration orchestration

---

# Research Notes

The `--isolated` option is one of Laravel's most important production features that teams discover only after a migration race condition incident. The lock timeout is the most common misconfiguration — teams forget that data backfill migrations may run for minutes, not seconds.
