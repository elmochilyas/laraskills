# Redis Memory Optimization

## Metadata
- **ID**: KU-15-REDIS-MEMORY
- **Subdomain**: cache-layer-optimization
- **Domain**: cost-resource-optimization
- **Topic**: Redis Memory Optimization
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: High

## Overview
Redis memory optimization directly reduces ElastiCache node costs. Hash grouping for objects saves 40-70% memory vs flat string keys. Compression reduces memory usage 50-80%. Enabling listpack encoding, setting TTLs on all keys, and enabling active defragmentation can serve the same workload on a node 2-3 sizes smaller, directly cutting cache infrastructure costs by 50-70%.

## Core Concepts
- **Hash grouping**: Store object fields in a single hash key — 40-70% less memory than individual string keys
- **Compression**: Compress values > 1KB — 50-80% memory reduction for large values
- **Listpack encoding**: Redis 7+ auto-encodes small hashes/lists/sets as listpacks — 30-60% less memory
- **TTL management**: Set expiry on all keys; prevents indefinite key accumulation
- **Eviction policy**: Use allkeys-lru for cache, volatile-ttl for session data
- **Active defrag**: Redis 7+ defragments memory automatically, reducing RSS overhead

## When To Use
- Any production Redis deployment (optimization applies universally)
- High-memory workloads where ElastiCache node cost is significant
- Applications storing large objects in Redis (cached views, API responses)
- Teams looking to reduce cache infrastructure without losing capacity

## Best Practices
- **Use hash structures for related object fields**: Store user data as hash fields, not individual string keys (WHY: Redis stores hashes more efficiently than strings for small-to-medium objects; hash encoding uses shared dictionary, saving 40-70% memory; Laravel's cache tags use hashes internally)
- **Compress values over 1KB before storing**: Use gzip or lz4 compression (WHY: large values (cached views, API responses, serialized models) compress 50-80%; decompression overhead is <1ms on modern CPU; reduces memory and network bandwidth proportionally)
- **Set TTL on every cache key**: Never cache indefinitely without expiry (WHY: indefinite keys accumulate until memory full, triggering evictions; TTL ensures stale data is removed; promotes temporal locality; prevents "memory leak" from forgotten cached data)
- **Enable active defragmentation in Redis 7+**: Set activedefrag yes (WHY: Redis memory fragmentation increases RSS by 10-30% over time; active defrag reduces this to <5%; critical for long-running Redis instances storing variable-size data)
- **Monitor used_memory vs maxmemory weekly**: Track utilization percentage (WHY: overallocation is the #1 cost driver; if used_memory is consistently <60% of maxmemory, downsize to smaller node; right-sizing typically reduces node size 1-2 tiers, saving 50-70%)

## Related Topics
- ElastiCache Graviton Savings (ku-16)
- Cache Hit Ratio Optimization (ku-11)
- Memo Cache Driver (ku-49)

## AI Agent Notes
- Default: use hash structures, compression, TTLs on all keys
- Default: enable active defragmentation
- Monitor used_memory vs maxmemory; downsize if <60% utilization
- An optimized Redis can serve workload on 2-3 sizes smaller node
