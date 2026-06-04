# Rules: Cache and Queue Services

## Metadata
- **Source KU:** cache-queue-services
- **Subdomain:** Development Environments
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- CACHEQ-RULE-001: **Separate Redis DB indexes** — db0 for cache, db1 for queue, db2 for sessions.
- CACHEQ-RULE-002: **Use phpredis extension** — 5-10x faster than predis (pure PHP).
- CACHEQ-RULE-003: **Disable persistence in development** — Volatile queue data is acceptable; eliminates RDB/AOF overhead.
- CACHEQ-RULE-004: **Start queue worker** — `php artisan queue:work` must run for job processing.
- CACHEQ-RULE-005: **Valkey as drop-in** — Change image from `redis:alpine` to `valkey/valkey` with no code changes.
- CACHEQ-RULE-006: **Handle Redis connection failures gracefully** — Fall back to file cache.

## Decision Rules
- CACHEQ-RULE-007: **Use Redis for cache, queue, and sessions** in multi-container/ multi-server setups.
- CACHEQ-RULE-008: **Use file/database cache** for simple apps where shared state isn't needed.
- CACHEQ-RULE-009: **Use array cache + sync queue** in testing for isolation and speed.
