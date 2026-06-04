# Redis Memory Optimization Rules

## Rule 1: Use Hash Structures for Related Object Fields
- **Category**: Design
- **Rule**: Store related object fields as Redis hash fields instead of individual string keys
- **Reason**: Redis stores hashes more efficiently than strings for small-to-medium objects; hash encoding uses shared dictionary, saving 40-70% memory compared to flat string keys
- **Bad Example**: Storing `user:123:name`, `user:123:email`, `user:123:role` as three separate string keys
- **Good Example**: Storing all fields in a single hash `user:123` with fields `name`, `email`, `role`
- **Exceptions**: Fields that need independent TTLs must remain separate keys
- **Consequences Of Violation**: 40-70% higher memory usage for the same cached data; larger Redis node required

## Rule 2: Compress Values Over 1KB
- **Category**: Performance
- **Rule**: Compress cache values larger than 1KB using gzip or lz4 before storing in Redis
- **Reason**: Large values (cached views, API responses, serialized models) compress 50-80%; decompression overhead is <1ms on modern CPU; reduces memory and network bandwidth proportionally
- **Bad Example**: Storing a 50KB uncompressed cached API response in Redis, consuming 50KB of memory
- **Good Example**: Compressing the 50KB response with gzip to ~12KB, saving 76% memory
- **Exceptions**: Values under 1KB where compression metadata overhead may exceed savings
- **Consequences Of Violation**: 2-5x higher memory usage for cache values; larger Redis node required than necessary

## Rule 3: Set TTL on Every Cache Key
- **Category**: Maintainability
- **Rule**: Always set an explicit TTL on every cached key; never cache indefinitely
- **Reason**: Indefinite keys accumulate until maxmemory is reached, triggering random evictions; TTL ensures stale data is removed and promotes temporal locality
- **Bad Example**: Storing cached data without TTL; over months the Redis fills with stale entries, causing unpredictable eviction of popular cache items
- **Good Example**: Always passing TTL to `Cache::put($key, $value, $ttl)` with TTL based on data staleness tolerance
- **Exceptions**: Configuration data that is explicitly managed and has a bounded, small number of keys
- **Consequences Of Violation**: Memory full of stale data; popular cache items evicted unpredictably; cache hit ratio drops

## Rule 4: Enable Active Defragmentation
- **Category**: Performance
- **Rule**: Enable active defragmentation (`activedefrag yes`) in Redis 7+ configurations
- **Reason**: Redis memory fragmentation increases RSS by 10-30% over time with variable-size data; active defrag reduces this to <5%, effectively increasing usable memory without resizing the node
- **Bad Example**: Long-running Redis instance with 10GB RSS but only 7GB used_memory; 30% of memory is wasted fragmentation
- **Good Example**: Enabling active defrag with `activedefrag yes`, keeping fragmentation below 5%
- **Exceptions**: Redis 6 or earlier versions that do not support active defragmentation
- **Consequences Of Violation**: 10-30% of allocated Redis memory wasted on fragmentation; effectively paying for memory that cannot be used

## Rule 5: Monitor and Right-Size Redis Nodes
- **Category**: Cost Management
- **Rule**: Monitor used_memory vs maxmemory weekly and downsize when utilization is consistently below 60%
- **Reason**: Overallocation is the #1 cost driver for ElastiCache; if used_memory is consistently <60% of maxmemory, downsize to a smaller node tier, saving 50-70%
- **Bad Example**: Paying for a cache.r7g.xlarge ($200/month) when used_memory is only 3GB out of 13GB maxmemory (23% utilization)
- **Good Example**: Downsizing to cache.r7g.large ($100/month) after confirming 90th percentile memory usage is under 6GB
- **Exceptions**: Applications with spiky memory usage patterns may need headroom for peaks
- **Consequences Of Violation**: Paying 2-3x more for Redis infrastructure than necessary
