# Knowledge Unit: Cache and Queue Services

## Metadata
- **Subdomain:** Development Environments
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** development-environments/cache-queue-services
- **Maturity:** Mature
- **Related Technologies:** Laravel, Redis, Valkey, Cache, Queue, Docker, Sail

## Executive Summary

Cache and queue services in Laravel development environments are typically provided by Redis or Valkey, running as Docker containers within the development stack (Sail or custom Docker Compose). These services support: cache drivers (Redis, file, database, array), queue drivers (Redis, database, SQS, sync), session storage (Redis, database, file), and rate limiting storage (Redis). In Sail, Redis is the default cache and queue service, configured in docker-compose.yml as a separate container. The choice between Redis and Valkey (a Redis fork) affects development environment configuration but not application code (both use the same PHP extension). Development environment configuration focuses on service availability, persistence settings, connection configuration, and tooling for monitoring (Redis CLI, Laravel Pulse, Telescope).

## Core Concepts

- **Redis:** In-memory data structure store used as cache backend, queue driver, session store, and rate limiter backend for Laravel applications
- **Valkey:** Fork of Redis maintained by the Linux Foundation; API-compatible with Redis, serving as a drop-in replacement in development and production
- **phpredis Extension:** PHP extension for communicating with Redis/Valkey servers; recommended driver for Laravel (predis is the pure-PHP alternative)
- **Cache Driver Configuration:** config/cache.php defines cache stores; default store uses Redis in production, file in local development
- **Queue Driver Configuration:** config/queue.php defines queue connections; Redis connection provides the redis queue driver with configurable queue names and retry limits
- **Session Driver Configuration:** config/session.php defines session storage; Redis provides fast, persistent session storage across multiple application instances
- **Sail Service Container:** Redis (or Valkey) runs as a service in docker-compose.yml with port mapping, volume for persistence, and health checks

## Mental Models

- **Cache/Queue as Infrastructure Services:** Like databases, cache and queue services are infrastructure components that the development environment must provide—they're not part of the application code
- **Redis as Swiss Army Knife:** Redis serves multiple roles (cache, queue, session, rate limiter) from a single server—it's a versatile tool that replaces multiple specialized services
- **Containerized Redis as Disposable Service:** In development, Redis runs in a container that can be stopped, restarted, or reset without affecting the application code

## Internal Mechanics

1. **Redis Container Configuration:** Sail's docker-compose.yml defines a redis service based on the official redis:alpine image, exposing port 6379 with a named volume for data persistence
2. **PHP Extension Loading:** The phpredis extension is compiled into Sail's PHP Docker image; it's loaded by default and available to Laravel's Redis facade
3. **Connection Pooling:** Laravel's Redis manager creates connections to the Redis server based on config/redis.php cluster configuration
4. **Queue Worker Process:** Queue workers (php artisan queue:work) connect to Redis, poll for jobs via BLPOP blocking pop, and process jobs as they arrive
5. **Cache Tag Operations:** Redis supports cache tags natively via Redis Sets; Laravel uses Redis Sets for cache tag operations in tagged cache stores
6. **Session Persistence:** Redis-based sessions persist across application restarts if the Redis container has persistent storage configured (named volumes in docker-compose.yml)

## Patterns

- **Sail Default Config Pattern:** Use Sail's default Redis configuration for most development needs: one Redis container, default port 6379, default database index 0
- **Separate Database Index Pattern:** Use distinct Redis database indexes for different concerns: db0 for cache, db1 for queue, db2 for sessions, db3 for rate limiting
- **Volatile Queue Data Pattern:** In development, use Redis without persistence for queue data; queue jobs are lost on container restart but this is acceptable during development
- **Persistent Cache Pattern:** Configure Redis persistence (RDB snapshots or AOF) for cache data that should survive container restarts—useful for warming caches during development
- **Valkey as Redis Drop-In Pattern:** Replace Redis with Valkey by changing the container image from redis:alpine to valkey/valkey:latest with no application code changes (same PHP extension, same protocol)
- **Redis CLI Pattern:** Use ./vendor/bin/sail redis redis-cli to access the Redis CLI inside the container for direct cache/queue inspection during development
- **Pulse Redis Monitoring Pattern:** Enable Laravel Pulse's Redis card to monitor Redis operations (commands/sec, hit rate, memory usage) during development

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Service choice | Redis vs Valkey vs file vs database | Redis (default in Sail) for most features; file for simple cache-only apps |
| PHP client | phpredis (extension) vs predis (PHP) | phpredis (faster, compiled extension) for production; predis as fallback |
| Persistence | RDB (snapshot) vs AOF (append-only) vs none | None for development (volatile); RDB for production (point-in-time recovery) |
| Queue driver | Redis vs database vs SQS vs sync | Redis for async queue; sync for testing/debugging (immediate execution) |
| Cache driver | Redis vs file vs array | Redis for multi-server setups; file for single-server; array for testing |

## Tradeoffs

- **Redis vs File Cache:** Redis provides faster access and shared state across processes/containers but requires a running Redis server. File cache is simpler (no external service) but slower and not shared across multiple workers.
- **phpredis vs predis:** phpredis is a compiled C extension (faster, lower memory) but requires installation at the PHP level. predis is pure PHP (no extension installation) but slower and uses more memory. phpredis is recommended for Sail and production.
- **Single Index vs Multiple Indexes:** Using a single Redis database index is simpler but mixes cache, queue, and session data. Separate indexes improve organization and monitoring but require explicit configuration.

## Performance Considerations

- **Redis Overhead in Development:** Redis operations add <1ms per operation in development (same machine, no network latency). Cache hits are near-instantaneous.
- **Queue Performance:** Redis queue operations (push, pop) add <1ms per operation. Queue throughput in development is limited by PHP worker process speed, not Redis.
- **Memory Usage:** Redis in Sail runs on the host's RAM. A typical development Redis instance uses 10-50MB. Monitor if running many Docker containers with limited memory allocation.
- **Persistence Overhead:** RDB snapshots and AOF rewrites add periodic CPU/disk I/O overhead. In development, disable persistence to eliminate this overhead.

## Production Considerations

- **Development-Only Configuration:** Use array cache driver (no persistence) and sync queue driver (immediate execution) for testing. These are not suitable for production.
- **Connection Security:** Redis in Sail has no authentication (no requirepass). For shared development environments, add Redis password via docker-compose environment variables.
- **Port Conflicts:** Redis on port 6379 may conflict with other local Redis instances. Use a custom port in docker-compose.yml if 6379 is occupied.
- **Health Checks:** Ensure the application handles Redis connection failures gracefully. If Redis is down, the application should fall back to file cache or display a meaningful error.

## Common Mistakes

- **Using sync queue in development for testing async jobs:** sync queue executes jobs immediately in the same process; doesn't test the actual async queue worker flow. Use Redis queue with a running worker for realistic testing.
- **Not separating development from production queue configuration:** Using the same queue connection name (redis) in both environments but different configurations; unexpected behavior when deploying
- **Redis connection timeout in long-running workers:** Queue workers hold persistent Redis connections; network interruptions cause connection drops. Configure retry logic and connection health checks.
- **Forgetting to start the queue worker:** Jobs are dispatched to Redis but never processed because the queue worker isn't running in the Sail environment
- **Using database cache for session storage in multi-container setups:** File-based session storage doesn't work across multiple containers; use Redis for session storage in containerized development environments

## Failure Modes

- **Redis Container Crash:** The Redis container stops (OOM, crash, restart). All cache/queue data in memory is lost. Mitigate: use persistent storage or restart the container.
- **OOM Killed Redis:** Redis exceeds its maxmemory limit and is OOM-killed by Docker. Mitigate: set maxmemory in redis.conf; allocate sufficient Docker memory.
- **Connection Refused:** The application can't connect to Redis (wrong host, port, or container not running). Mitigate: verify docker-compose.yml service configuration; use health checks.
- **Queue Job Loss on Restart:** Unprocessed queue jobs in Redis are lost when the container restarts. Mitigate: use database queue for persistent jobs; process critical jobs before restarting.

## Ecosystem Usage

- **Laravel Sail:** Redis is the default cache and queue service in Sail; pre-configured in docker-compose.yml and Laravel's default config files
- **Laravel Forge:** Forge provisions Redis server alongside the application; Sail's development setup mirrors Forge's production setup
- **Laravel Vapor:** Vapor uses DynamoDB and SQS for production; local development with Redis simulates the queue/cache behavior
- **Laravel Pulse:** Pulse's Redis card monitors Redis operations directly in the development dashboard
- **Laravel Horizon:** Horizon provides a beautiful dashboard for Redis queues; Horizon requires Redis and is configured via horizon.php

## Related Knowledge Units

- laravel-sail
- docker-compose-for-laravel
- database-services
- search-services

## Research Notes

- Redis 7.x introduced significant performance improvements and new data types (JSON, Bloom filter, Time series) that benefit Laravel applications
- Valkey (forked from Redis 7.2) is API-compatible with Redis and can be used as a drop-in replacement with no code changes in Laravel
- Laravel 11.x improved Redis queue performance with optimized serialization and reduced LUA script roundtrips
- Sail uses the official redis:alpine image for minimal image size (~30MB) and fast startup times
