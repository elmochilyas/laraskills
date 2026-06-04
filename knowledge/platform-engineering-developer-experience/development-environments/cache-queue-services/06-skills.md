# Skill: Configure Cache and Queue Services in Laravel Dev

## Purpose
Set up Redis/Valkey as the cache backend, queue driver, and session store in Docker-based Laravel development environments with proper DB index separation and performance optimization.

## When To Use
- Multi-container/multi-server Laravel setups needing shared state
- Development environments mimicking production Redis usage
- Projects using queues, caching, and session management

## When NOT To Use
- Simple apps where file/database cache suffices
- Testing (use array cache + sync queue for isolation)
- Single-server projects with no distributed state needs

## Prerequisites
- Laravel Sail or Docker Compose setup
- Redis/Valkey service configured in docker-compose.yml
- phpredis extension (or predis package)

## Inputs
- `docker-compose.yml` — Redis service definition
- `config/database.php` — Redis connection config
- `config/cache.php` — cache store configuration
- `config/queue.php` — queue connection configuration

## Workflow

1. **Verify Redis Service:** In `docker-compose.yml`, ensure Redis (or Valkey) service is defined with image `redis:alpine` (or `valkey/valkey` for fork). Sail includes Redis by default.

2. **Configure phpredis Extension:** Use the compiled C extension for 5-10x faster Redis communication. In Sail, ensure `phpredis` is installed (included by default in PHP images).

3. **Separate Redis DB Indexes:** Configure `config/database.php` to map: `db0` for cache, `db1` for queue, `db2` for sessions. This prevents key collisions and simplifies monitoring.

4. **Configure Cache Driver:** Set `CACHE_DRIVER=redis` in `.env`. Configure the redis store in `config/cache.php` with the correct connection name and prefix.

5. **Configure Queue Driver:** Set `QUEUE_CONNECTION=redis` in `.env`. Configure `config/queue.php` with the Redis connection. Start worker with `php artisan queue:work`.

6. **Configure Session Driver:** Set `SESSION_DRIVER=redis` in `.env` for shared session storage across multiple app instances.

7. **Disable Persistence in Dev:** Set `save ""` in Redis config or don't mount persistent volumes for development. Volatile queue data is acceptable; eliminates RDB/AOF overhead.

8. **Handle Connection Failures Gracefully:** Configure cache fallback to `file` driver when Redis is unavailable. Implement queue connection retry logic in `config/queue.php`.

## Validation Checklist

- [ ] Redis container running and accessible
- [ ] Separate DB indexes for cache, queue, sessions
- [ ] phpredis extension loaded (`php -m | grep redis`)
- [ ] Cache operations succeed (store/retrieve/forget)
- [ ] Queue jobs process correctly (dispatch/worker/complete)
- [ ] Session data persists across requests
- [ ] Graceful fallback when Redis is unavailable

## Common Failures

| Failure | Early Detection |
|---------|----------------|
| phpredis not installed | Redis connection fails; switch to predis |
| DB index collision | Cache keys pollute queue; separate indexes |
| Queue worker not running | Jobs dispatched but never processed |
| Redis connection refused | Fall back to file cache; check container status |

## Decision Points

- **Use Redis for cache, queue, and sessions** in multi-container/multi-server setups
- **Use file/database cache** for simple apps where shared state isn't needed
- **Use array cache + sync queue** in testing for isolation and speed

## Performance/Security Considerations

- **phpredis vs predis:** phpredis is 5-10x faster; use for production and dev
- **DB index separation:** Critical for production to avoid key collisions
- **Persistence:** Disable in dev (volatile); enable in production with RDB/AOF

## Related Rules

- CACHEQ-RULE-001: Separate Redis DB indexes
- CACHEQ-RULE-002: Use phpredis extension
- CACHEQ-RULE-003: Disable persistence in development
- CACHEQ-RULE-004: Start queue worker
- CACHEQ-RULE-005: Valkey as drop-in

## Related Skills

- Configure Laravel Sail
- Set Up Docker Compose for Laravel
- Configure Database Services

## Success Criteria

- Redis serves as cache, queue, and session store with separate DB indexes
- Queue worker processes jobs reliably
- Cache hit/miss operations work correctly
- Sessions persist across requests
