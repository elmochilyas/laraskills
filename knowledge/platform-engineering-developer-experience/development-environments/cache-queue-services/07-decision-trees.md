# 07-Decision Trees: Cache and Queue Services

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | development-environments |
| **Knowledge Unit** | cache-queue-services |
| **Domain** | platform-engineering-developer-experience |

## Decision Inventory

| Decision ID | Title | Description | Key Question |
|-------------|-------|-------------|--------------|
| D01 | Cache Driver Selection | Choosing cache backend for development | Does the app need shared cache state or is file/array cache sufficient? |
| D02 | Queue Driver Selection | Choosing queue backend for development | Does the app need async job processing during development? |
| D03 | Redis DB Index Strategy | How to organize Redis databases | Are we using Redis for multiple purposes (cache, queue, sessions, rate limiting)? |
| D04 | Driver Engine | Redis vs Valkey vs alternatives | Do we prefer Redis original or a fork/drop-in replacement? |

## Architecture-Level Decision Trees

### D01: Cache Driver Selection

```
START: What cache driver should we use in development?
│
├── File cache (simple apps, no queue needs)
│   ├── Config: CACHE_DRIVER=file
│   ├── Pro: zero setup, works out of the box
│   ├── Pro: no additional service needed
│   ├── Con: not shared across containers (per-container cache)
│   ├── Con: slower than Redis for cache-heavy apps
│   └── Best for: simple apps, prototypes, minimal caching
│
├── Array cache (testing)
│   ├── Config: CACHE_DRIVER=array in phpunit.xml
│   ├── Pro: fastest possible, no I/O
│   ├── Pro: isolated per-test, no cross-test contamination
│   └── Best for: test environment
│
├── Redis cache (recommended for most apps)
│   ├── Config: CACHE_DRIVER=redis, REDIS_HOST=redis
│   ├── Pro: shared across containers, fast
│   ├── Pro: single service handles cache + queue + sessions
│   ├── Need: Redis container running (Sail default)
│   └── Best for: most Laravel apps, multi-container setups
│
└── Database cache (fallback)
    ├── Config: CACHE_DRIVER=database
    ├── Pro: no additional service needed
    ├── Con: slower than Redis, adds DB load
    └── Best for: when Redis is not available
```

### D02: Queue Driver Selection

```
START: What queue driver should we use in development?
│
├── Sync queue (no async processing)
│   ├── Config: QUEUE_CONNECTION=sync
│   ├── Pro: jobs execute immediately in same request
│   ├── Pro: zero setup, no worker needed
│   ├── Con: doesn't test async behavior
│   ├── Con: blocks response until job completes
│   └── Best for: simple apps, testing (no async assertions)
│
├── Redis queue (async processing)
│   ├── Config: QUEUE_CONNECTION=redis
│   ├── Pro: true async testing, matches production
│   ├── Pro: fast, reliable
│   ├── Need: Redis container running + queue worker started
│   ├── Worker: sail artisan queue:work
│   └── Best for: apps using queues in production
│
├── Database queue (simple async)
│   ├── Config: QUEUE_CONNECTION=database
│   ├── Pro: no Redis needed, zero additional services
│   ├── Pro: jobs visible in database for debugging
│   ├── Con: slower than Redis for high throughput
│   └── Best for: projects without Redis, simple queue needs
│
└── Start queue worker for async drivers
    ├── sail artisan queue:work (single process)
    ├── sail artisan queue:listen (auto-reload on code changes)
    └── For Horizon: use sail horizon (requires Supervisord in Docker)
```

### D03: Redis DB Index Strategy

```
START: How should we segment Redis databases?
│
├── Single Redis database (db0)
│   ├── Use: Redis for cache only (no queue/sessions)
│   ├── Simple, no configuration needed
│   └── Safe when only using one Redis feature
│
├── Separate databases per feature (recommended)
│   ├── db0: cache (CACHE_DRIVER=redis)
│   ├── db1: queue (QUEUE_CONNECTION=redis, REDIS_QUEUE=default)
│   ├── db2: sessions (SESSION_DRIVER=redis)
│   ├── db3: rate limiting
│   ├── Config per db in config/database.php redis section
│   ├── Pro: feature isolation, one eviction policy doesn't affect others
│   └── Best for: apps using Redis for multiple features
│
└── Implementation
    ├── Edit config/database.php → redis.connections
    ├── Add separate connection for cache, queue, session
    ├── Point each feature config to its dedicated connection
    └── Verify: sail redis redis-cli MONITOR to see traffic
```

### D04: Driver Engine

```
START: Should we use Redis, Valkey, or another engine?
│
├── Redis (original)
│   ├── Pros: most widely used, extensive docs, Laravel ecosystem assumes Redis
│   ├── License: Redis Source Available License (RSAL) since 7.4
│   ├── Sail default: redis:alpine image
│   └── Best for: most projects, no reason to switch
│
├── Valkey (Redis fork)
│   ├── Pros: Apache 2.0 license, API-compatible drop-in
│   ├── Pros: Linux Foundation governance, community-driven
│   ├── Migration: change Docker image from redis:alpine to valkey/valkey
│   ├── No code changes needed (compatible API)
│   └── Best for: projects preferring fully open-source licensing
│
└── Decision factors
    ├── License preference → risk assessment of RSAL vs Apache 2.0
    ├── Ecosystem support → both are API-compatible
    ├── Migration effort → zero (container image change only)
    └── Recommendation: stay with Redis unless license concerns require migration
```
