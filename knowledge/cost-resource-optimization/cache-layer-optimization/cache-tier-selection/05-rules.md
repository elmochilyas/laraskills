# Cache Tier Selection Rules

## Rule 1: Default to Redis with Graviton Nodes
- **Category**: Architecture
- **Rule**: Default to ElastiCache Redis with Graviton (r7g/m7g) node types for production Laravel applications
- **Reason**: Redis supports cache tags, sessions, queues, and rich data structures; Graviton nodes are 20% cheaper than x86 with identical performance
- **Bad Example**: Choosing Memcached for a Laravel app that needs cache tags, then needing to migrate to Redis later
- **Good Example**: Selecting r7g.large Redis from the start with Graviton, supporting all application caching needs
- **Exceptions**: Budget-constrained apps under $15/month cache budget may use memo + database query cache instead
- **Consequences Of Violation**: Missing cache tags, atomic operations, or multi-purpose Redis usage; migration cost later

## Rule 2: Right-Size by Monitoring Utilization
- **Category**: Cost Management
- **Rule**: Start with a smaller Redis node, monitor used_memory vs maxmemory for 2 weeks, and scale up only if needed
- **Reason**: Over-provisioning is the #1 cost driver for ElastiCache; allocating 2x+ needed memory doubles cost with zero benefit; right-sizing based on data saves 50-70%
- **Bad Example**: Starting with cache.r7g.xlarge ($200/month) as a "safety margin" when workload only needs cache.r7g.micro ($15/month)
- **Good Example**: Starting with cache.t4g.small ($30/month), monitoring used_memory for 2 weeks, and scaling to r7g.micro only if needed
- **Exceptions**: Known traffic growth (product launch) may justify initial over-provisioning
- **Consequences Of Violation**: Paying 2-10x more for cache infrastructure than necessary

## Rule 3: Enable Memo Driver on Laravel 13+
- **Category**: Performance
- **Rule**: Always enable the memo cache driver in Laravel 13+ applications
- **Reason**: Memo reduces Redis GET calls by 50-80% with zero configuration; it serves repeated lookups from local memory (0ns) instead of querying Redis
- **Bad Example**: Running Laravel 13+ with only Redis cache driver; every repeated config lookup queries Redis
- **Good Example**: Configuring `'default' => 'memo'` in config/cache.php with Redis store underneath
- **Exceptions**: Laravel versions before 13.x that do not support the memo driver
- **Consequences Of Violation**: 50-80% more Redis calls than necessary; higher connection pool pressure

## Rule 4: Use Multi-Purpose Redis
- **Category**: Architecture
- **Rule**: Share a single Redis cluster across cache, sessions, and queues using separate Redis database numbers
- **Reason**: A Redis node can serve multiple purposes safely via database separation, reducing node count and overall infrastructure cost
- **Bad Example**: Running three separate ElastiCache clusters—one for cache, one for sessions, one for queues
- **Good Example**: Single Redis cluster with config: cache (db 1), sessions (db 2), queues (db 3) in `config/database.php`
- **Exceptions**: High-traffic apps where queue throughput may compete with cache latency
- **Consequences Of Violation**: 3x the number of ElastiCache nodes; unnecessary infrastructure cost

## Rule 5: Choose Memcached Only for Simple Key-Value Cache
- **Category**: Architecture
- **Rule**: Use Memcached only when the application needs a simple key-value cache with no persistence, tags, or atomic operations
- **Reason**: Memcached is simpler and cheaper than Redis but lacks data structures, persistence, cache tags, and multi-purpose capability
- **Bad Example**: Choosing Memcached for a Laravel application, then discovering cache tags are unsupported and needing to migrate to Redis
- **Good Example**: Using Memcached only for a simple API response cache where key expiry is the only requirement
- **Exceptions**: Applications that exclusively use Memcached-compatible features and do not need Redis-specific functionality
- **Consequences Of Violation**: Inability to use cache tags, sessions, or queues in the same cache layer; migration cost later
