# 04-Standardized Knowledge: Cache and Queue Services

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | development-environments |
| **Knowledge Unit** | cache-queue-services |
| **Domain** | platform-engineering-developer-experience |
| **Maturity** | Mature |
| **Difficulty** | Foundation |
| **Dependencies** | laravel-sail, docker-compose-for-laravel, database-services |
| **Framework/Language** | Laravel, Redis, Valkey, Docker, Sail |

## Overview

Cache and queue services in Laravel dev environments are typically provided by Redis/Valkey as Docker containers within Sail or custom Docker Compose. Support: cache drivers (Redis, file, database, array), queue drivers (Redis, database, SQS, sync), session storage (Redis, database, file), rate limiting storage (Redis). In Sail, Redis is default cache and queue service in `docker-compose.yml`. Valkey (Redis fork) is API-compatible drop-in.

## Core Concepts

- **Redis**: in-memory data store for cache backend, queue driver, session store, rate limiter
- **Valkey**: Linux Foundation Redis fork; API-compatible drop-in replacement
- **phpredis Extension**: compiled C extension for Redis communication (recommended over predis)
- **Cache Driver Config**: `config/cache.php` defines stores; default uses Redis in production, file locally
- **Queue Driver Config**: `config/queue.php` defines connections; Redis provides async queue
- **Session Driver Config**: `config/session.php`; Redis provides fast, persistent cross-instance storage
- **Sail Service Container**: Redis runs as service in `docker-compose.yml` with port 6379, volume, health checks

## When to Use

- Applications needing async queue processing
- Multi-server deployments requiring shared cache/session state
- Rate limiting with Redis backend
- Real-time features (broadcasting) using Redis

## When NOT to Use

- Simple apps where file/database cache is sufficient
- Testing environment (use array/sync drivers for speed)
- Development without queue processing needs

## Best Practices (WHY)

- **Separate Redis DB indexes**: db0 for cache, db1 for queue, db2 for sessions, db3 for rate limiting
- **Use phpredis extension**: 5-10x faster than predis (pure PHP)
- **Disable persistence in development**: volatile queue data is acceptable; eliminates RDB/AOF overhead
- **Start queue worker**: `php artisan queue:work` must run for job processing
- **Valkey as drop-in**: change image from `redis:alpine` to `valkey/valkey` with no code changes
- **Use Redis CLI**: `sail redis redis-cli` for direct cache/queue inspection

## Architecture Guidelines

- Use different queue connection names per environment (not same name with different configs)
- Handle Redis connection failures gracefully — fall back to file cache
- Configure health checks in docker-compose.yml
- For production-matching dev, use same Redis version

## Performance Considerations

- Redis ops: <1ms per operation (same machine)
- Queue throughput limited by PHP worker speed, not Redis
- Memory: 10-50MB typical dev Redis instance
- Persistence disabled = zero overhead in development

## Security Considerations

- No authentication on Redis in Sail (no `requirepass`)
- Use array cache + sync queue in testing for isolation
- For shared dev environments, add Redis password

## Common Mistakes

| Mistake | Description | Consequence | Better Approach |
|---------|-------------|-------------|-----------------|
| Sync queue for async testing | Jobs execute immediately in same process | Doesn't test async flow | Use Redis queue + worker |
| Same queue connection name, different config | Dev/prod mismatch | Unexpected deploy behavior | Separate connection names |
| Not starting worker | Jobs dispatched but never processed | Silent failures | Start worker process |
| Database cache for multi-container | File sessions don't share across containers | Session loss | Use Redis for sessions |

## Anti-Patterns

- **File cache in multi-container setups**: file cache is per-container; use Redis for shared state
- **Ignoring queue worker**: dispatching jobs without running the worker

## Examples

```php
// config/queue.php - Separate Redis DB indexes
'redis' => [
    'driver' => 'redis',
    'connection' => 'default',
    'queue' => env('REDIS_QUEUE', 'default'),
],
```

## Related Topics

- laravel-sail — Sail's Redis integration
- docker-compose-for-laravel — Docker Compose service configuration
- database-services — database service setup

## AI Agent Notes

- Default queue config in new Laravel projects should use database driver for simplicity
- Redis queue requires running `queue:work` as a separate process

## Verification

- [ ] Redis container running
- [ ] Queue worker started
- [ ] Cache driver configured
- [ ] Session driver configured for multi-server if needed
- [ ] phpredis extension installed
- [ ] Separate DB indexes if using multiple Redis features
