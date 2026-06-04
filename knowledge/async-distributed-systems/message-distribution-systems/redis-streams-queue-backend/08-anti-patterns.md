---
Domain: Async & Distributed Systems
Subdomain: Message Distribution Systems
Knowledge Unit: K040 — Redis Streams as Queue Backend
Knowledge ID: K040
Last Updated: 2026-06-03
---

# Anti-Patterns

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Risk Severity |
|---|---|---|---|
| 1 | Not Acknowledging Messages (No `XACK`) | Reliability | Critical |
| 2 | Using Streams Without Consumer Groups | Architecture | High |
| 3 | Not Trimming Streams — Unbounded Memory Growth | Performance | Critical |
| 4 | Assuming Stream Durability Without AOF | Reliability | Critical |
| 5 | Same Redis Instance for Streams and Cache | Configuration | High |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Domain Relevance | Mitigation |
|---|---|---|
| Missing XACK (PEL Memory Leak) | Critical — PEL grows unbounded, eventually OOM | Mandatory XACK after processing; monitor PEL size |
| No Consumer Groups | High — losing Kafka-like semantics that justify Streams over Lists | Enforce consumer group creation before workers start |
| No Stream Trimming | Critical — memory fills, writes fail, data loss | Default `MAXLENGTH ~ N` on every stream creation |

---

## 1. Not Acknowledging Messages (No `XACK`)

### Category
Reliability

### Description
Consuming messages from a Redis Stream consumer group without calling `XACK` after successful processing. Unacknowledged messages remain in the Pending Entry List (PEL) permanently, causing unbounded memory growth and eventual Redis memory exhaustion.

### Why It Happens
- Developer doesn't know `XACK` is required
- Missing the ack step in the consumer loop
- Exception handling skips `XACK` on errors (should use `XACK` only on success)
- Copying code from Redis Lists (which don't need ack)
- Not monitoring PEL size to detect the issue

### Warning Signs
- PEL size grows continuously (check with `XINFO PENDING`)
- Redis memory usage increases over time without corresponding data growth
- `XINFO STREAM` shows large pending entries count
- Consumer restart causes reprocessing of all unacked messages
- Worker processes messages but memory keeps growing

### Why Harmful
- PEL entries accumulate in memory until Redis runs out
- Each unacked entry stores the full message payload in memory
- `XREADGROUP` performance degrades with large PEL (must scan pending entries)
- No recovery mechanism — messages stay in PEL forever
- Eventual Redis OOM kill or eviction

### Consequences
- Redis OOM — all queues and cache data lost
- Performance degradation as PEL grows
- Memory costs increase linearly with unprocessed message count
- Reprocessing storm on consumer restart (all PEL entries re-delivered)
- Emergency PEL cleanup (may lose messages that weren't actually processed)

### Alternative
- Always call `XACK` after successful processing:
  ```php
  $messages = $redis->xreadgroup('processors', 'worker1', ['orders' => '>'], 1);
  foreach ($messages['orders'] as $id => $data) {
      processOrder($data);          // Process first
      $redis->xack('orders', 'processors', [$id]); // Then ack
  }
  ```
- In error handling: do NOT ack (message will be retried)
- Monitor PEL size with alert threshold

### Refactoring Strategy
1. Audit all consumer code for missing `XACK` calls
2. Add `XACK` after each successful message processing
3. Ensure `XACK` is NOT called on processing failure
4. Implement PEL monitoring: `XINFO PENDING orders processors`
5. Set alert if PEL exceeds threshold (e.g., 1000 pending entries)
6. Clear existing PEL after fix

### Detection Checklist
- [ ] `XACK` called after every successful message processing
- [ ] PEL size is stable (not growing continuously)
- [ ] PEL monitoring with alert threshold
- [ ] Error handling does not ack on failure
- [ ] Consumer restart only reprocesses truly unprocessed messages
- [ ] No OOM incidents from PEL growth

### Related Rules
- use-consumer-groups-for-stream-processing

### Related Skills
- Use Redis Streams as Queue Backend

### Related Decision Trees
- Redis Lists vs Redis Streams for Queue Backend

---

## 2. Using Streams Without Consumer Groups

### Category
Architecture

### Description
Using `XREAD` (without consumer group) to read from Redis Streams instead of `XREADGROUP`. Without consumer groups, there's no ack mechanism, no PEL, no crash recovery — the same behavior as Redis Lists but with more complexity and overhead.

### Why It Happens
- Developer knows `XADD`/`XREAD` from Redis documentation but not consumer groups
- Mistaking `XREAD` for the standard stream consumption pattern
- Not understanding that consumer groups are the primary value of Streams
- Copying code snippets that omit consumer group setup
- Assuming `XREAD` is sufficient (it's not for reliable queue consumption)

### Warning Signs
- Stream code uses `XREAD` instead of `XREADGROUP`
- No consumer group created (`XGROUP CREATE` never called)
- No `XACK` calls in consumer code
- No PEL entries ever created (confirming no consumer group)
- Consumer crash loses messages permanently (no PEL recovery)

### Why Harmful
- `XREAD` has no consumer group semantics — every consumer gets ALL messages (fanout, not work queue)
- No ack mechanism — cannot confirm message processing
- No PEL — crash recovery is impossible, messages are lost
- Using Streams without consumer groups is functionally identical to Lists but slower and more complex
- The main value proposition of Streams is completely unused

### Consequences
- Messages delivered to all consumers (fanout) instead of one consumer per message
- Consumer crash = permanent message loss (no ack, no PEL recovery)
- Higher complexity with zero benefit over Lists
- Resource waste (Streams use more memory than Lists for same data)
- Misleading design — appears to use Streams correctly but doesn't

### Alternative
- Always create a consumer group and use `XREADGROUP`:
  ```php
  $redis->xgroup('CREATE', 'orders', 'processors', '$', true);
  // Then consume:
  $messages = $redis->xreadgroup('processors', 'worker1', ['orders' => '>'], 1);
  ```
- If consumer groups aren't needed, use Redis Lists (simpler, faster)

### Refactoring Strategy
1. Create consumer group for the stream
2. Replace `XREAD` with `XREADGROUP`
3. Add `XACK` after processing
4. Implement PEL monitoring
5. If consumer groups are genuinely not needed: migrate to Redis Lists

### Detection Checklist
- [ ] Consumer group created for the stream
- [ ] `XREADGROUP` used instead of `XREAD`
- [ ] `XACK` present in consumer code
- [ ] PEL entries exist and are tracked
- [ ] Consumer crash recovers unprocessed messages
- [ ] Each message delivered to exactly one consumer in the group

### Related Rules
- use-consumer-groups-for-stream-processing

### Related Skills
- Use Redis Streams as Queue Backend

### Related Decision Trees
- Redis Lists vs Redis Streams for Queue Backend

---

## 3. Not Trimming Streams — Unbounded Memory Growth

### Category
Performance

### Description
Writing messages to a Redis Stream without setting a maximum length (`MAXLENGTH`). The stream grows unbounded — every written message stays in memory until manual intervention. Redis memory fills up, writes fail, and existing data may be evicted.

### Why It Happens
- Not knowing streams must be trimmed
- Assuming Redis handles stream data like a queue (where data is deleted on consumption)
- Forgetting to add `MAXLENGTH` to `XADD` calls
- Relying on consumption to clear data (consumption does not delete from stream)
- Not monitoring Redis memory usage

### Warning Signs
- Redis memory usage grows continuously with message production rate
- `XLEN` shows stream size in hundreds of thousands or millions
- No `XTRIM` or `XADD MAXLENGTH` in code
- Redis maxmemory limit is approached
- `maxmemory-policy` may delete stream keys (if set to allkeys-lru)

### Why Harmful
- Stream entries persist in memory even after successful consumption and ack
- Only `XTRIM` or `XADD MAXLENGTH` removes old entries
- Unbounded growth consumes all available Redis memory
- When `maxmemory` is reached, writes to Redis fail or trigger eviction
- Eviction policies (`allkeys-lru`) may delete stream data unexpectedly

### Consequences
- Redis OOM — service becomes read-only or crashes
- Write failures — queue processing stops
- Data loss if eviction deletes stream keys
- Emergency trim operations cause CPU spikes
- Increased Redis infrastructure costs (need more memory)

### Alternative
- Always set `MAXLENGTH` on `XADD`:
  ```php
  $redis->xadd('orders', '*', $data, 100000); // Keep max 100K entries
  ```
- Or trim periodically: `$redis->xtrim('orders', 100000, true);`
- Use approximate trimming (`~`) for efficiency: `MAXLENGTH ~ 100000`
- Calculate max length: throughput_per_second × retention_seconds

### Refactoring Strategy
1. Add `MAXLENGTH ~ N` to all `XADD` calls
2. For existing streams: run `XTRIM orders MAXLENGTH ~ N` (may be slow for large streams)
3. Calculate appropriate max length based on throughput and retention window
4. Monitor memory usage after trimming — should stabilize
5. Set up alert on Redis memory > 80%

### Detection Checklist
- [ ] All `XADD` calls include `MAXLENGTH`
- [ ] Stream size is stable (not growing continuously)
- [ ] Redis memory usage is stable
- [ ] `XLEN` is within expected range
- [ ] No `maxmemory` or OOM incidents from stream data
- [ ] Retention window is documented

### Related Rules
- trim-streams-with-maxlength

### Related Skills
- Use Redis Streams as Queue Backend

### Related Decision Trees
- Redis Lists vs Redis Streams for Queue Backend

---

## 4. Assuming Stream Durability Without AOF

### Category
Reliability

### Description
Using Redis Streams for queued messages without enabling AOF (Append-Only File) persistence. Streams are fully in-memory by default — a Redis restart (crash, deployment, failover) loses ALL stream data permanently.

### Why It Happens
- Not knowing Redis is in-memory by default
- Confusing Stream persistence with Kafka's disk-based storage
- Assuming RDB snapshots are sufficient (RDB can lose up to the last snapshot interval)
- Not configuring Redis persistence at all
- Copying config from cache-only Redis instances (which typically don't need persistence)

### Warning Signs
- Redis configured with no persistence (RDB disabled, AOF disabled)
- Stream data disappears after Redis restart
- Queue backlog is empty after restart (all pending messages lost)
- `redis.conf` shows `appendonly no` or missing
- No backup strategy for stream data

### Why Harmful
- Streams are in-memory data structures — they ARE Redis memory
- Any Redis restart (planned deploy, crash, failover) destroys all stream entries
- Unacknowledged and pending messages are lost permanently
- No message recovery possible — the data is gone
- Stream consumer groups and offsets are also lost

### Consequences
- Complete loss of all queued messages on Redis restart
- Lost orders, notifications, analytics events — whatever was in the queue
- No reprocessing of failed messages
- Business data loss
- Compliance violation if queued data must be retained

### Alternative
- Enable AOF persistence in Redis config:
  ```ini
  appendonly yes
  appendfsync everysec  # Balance durability and performance
  ```
- Or use RDB with frequent snapshots (less durable but better than nothing)
- Use a separate Redis instance with persistence for queue streams
- Consider Kafka for applications requiring guaranteed durability

### Refactoring Strategy
1. Enable AOF in Redis configuration: `appendonly yes`, `appendfsync everysec`
2. Restart Redis to start AOF
3. Verify AOF file is created and growing
4. Test Redis restart — verify stream data persists
5. Set up AOF backup to external storage

### Detection Checklist
- [ ] AOF enabled (`appendonly yes`) for streams Redis instance
- [ ] `appendfsync everysec` configured
- [ ] Redis restart test confirms stream data persists
- [ ] AOF backup strategy in place
- [ ] No stream data loss after planned or unplanned restarts
- [ ] Separate persistence strategy for queue data vs cache data

### Related Rules
- enable-aof-for-durable-streams

### Related Skills
- Use Redis Streams as Queue Backend

### Related Decision Trees
- Redis Lists vs Redis Streams for Queue Backend

---

## 5. Same Redis Instance for Streams and Cache

### Category
Configuration

### Description
Using the same Redis instance for both queue streams and application cache. Cache eviction policies (`allkeys-lru`, `volatile-ttl`) can delete stream keys under memory pressure, losing queued messages. Conversely, stream data can prevent cache from working effectively by consuming memory.

### Why It Happens
- Convenience — one Redis instance for everything
- Not understanding that cache eviction can delete non-cache keys
- Assuming Redis eviction only touches cache keys
- Using default `noeviction` policy (writes fail before eviction — still problematic)
- Costs saving by consolidating Redis instances

### Warning Signs
- Cache and queue streams share the same Redis endpoint
- `maxmemory-policy` is `allkeys-lru` or `allkeys-random` (can evict streams)
- Memory usage is high and eviction logs show stream keys being evicted
- Queue messages disappear unpredictably
- Cache effectiveness is poor because stream data consumes memory

### Why Harmful
- Cache eviction policies (`allkeys-lru`) treat ALL keys equally — streams can be evicted
- `allkeys-lru` evicts the least recently used keys — stream data that's not actively read may be evicted
- `volatile-ttl` evicts keys with TTL — if streams don't have TTL, they survive but cache suffers
- Even with `noeviction`, stream data fills memory → writes fail → queue processing stops
- Streams and cache compete for the same memory budget

### Consequences
- Lost queue messages due to eviction
- Unreliable queue processing — messages disappear from stream
- Poor cache hit rate — stream data consumes cache memory
- Write failures under load (both cache and queue writes)
- Emergency Redis migration to separate instances

### Alternative
- Use separate Redis instances (or databases) for streams and cache:
  ```php
  // config/database.php
  'redis' => [
      'client' => 'phpredis',
      'options' => [
          'prefix' => env('REDIS_PREFIX', ''),
      ],
      'cache' => [
          'url' => env('REDIS_CACHE_URL'),
          'host' => env('REDIS_CACHE_HOST', '127.0.0.1'),
          'password' => env('REDIS_CACHE_PASSWORD'),
          'port' => env('REDIS_CACHE_PORT', 6379),
          'database' => env('REDIS_CACHE_DB', 1),
      ],
      'queue' => [
          'url' => env('REDIS_QUEUE_URL'),
          'host' => env('REDIS_QUEUE_HOST', '127.0.0.1'),
          'password' => env('REDIS_QUEUE_PASSWORD'),
          'port' => env('REDIS_QUEUE_PORT', 6379),
          'database' => env('REDIS_QUEUE_DB', 2),
      ],
  ],
  ```
- Configure different `maxmemory-policy` for each: cache = `allkeys-lru`, queue = `noeviction`

### Refactoring Strategy
1. Provision a separate Redis instance (or database) for queue streams
2. Update application config to use different Redis connections for cache vs queue
3. Migrate stream data to new instance
4. Verify cache eviction no longer affects queue data
5. Monitor both instances separately

### Detection Checklist
- [ ] Cache and queue streams use different Redis instances (or databases)
- [ ] Queue Redis uses `noeviction` or `allkeys-lfu` policy
- [ ] Cache Redis can use `allkeys-lru` without affecting queues
- [ ] No stream key eviction in Redis logs
- [ ] Queue processing continues under cache memory pressure
- [ ] Separate monitoring for cache and queue Redis instances

### Related Rules
- separate-redis-instance-for-queues

### Related Skills
- Use Redis Streams as Queue Backend

### Related Decision Trees
- Redis Lists vs Redis Streams for Queue Backend
