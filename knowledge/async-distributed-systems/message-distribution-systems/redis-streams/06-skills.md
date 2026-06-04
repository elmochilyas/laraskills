# Skill: Configure and Manage Redis Streams

## Purpose
Configure Redis Streams as a message distribution backend for Laravel queue processing, with consumer groups for load-balanced message distribution, acknowledgment for reliable processing, pending message claiming for fault tolerance, stream trimming for bounded memory usage, and dead-letter handling for unprocessable messages.

## When To Use
Using Redis as the Laravel queue driver with consumer groups; building fault-tolerant distributed workers with Redis Streams; migrating from basic Redis list queues to stream-based consumer groups; implementing custom stream consumers outside Horizon.

## When NOT To Use
Very high throughput (> 1M msg/s) competing with cache on same Redis; long retention (> 7 days) — use Kafka; exactly-once delivery required across consumer failures — use Kafka with idempotent producers; complex routing patterns — use RabbitMQ or Kafka.

## Prerequisites
- Redis 5.0+ (6.2+ recommended for XAUTOCLAIM)
- Laravel 11+ with `redis` queue driver
- PHP Redis extension (PhpRedis or predis)
- Access to Redis CLI for `XINFO`, `XPENDING` monitoring
- Understanding of stream, consumer group, PEL concepts

## Inputs
- Stream key name (e.g., `orders:queue`)
- Consumer group name
- Consumer name per process instance
- `read_timeout` value (seconds)
- Dead-letter stream key (for unprocessable messages)
- Max retry count before dead-letter routing
- Stream max length for trimming

## Workflow
1. **Create consumer group:**
   - `XGROUP CREATE stream group $ MKSTREAM` (creates stream + group atomically)
   - Or: `XGROUP CREATECONSUMER stream group consumer` (adds consumer to group)
   - For existing streams, decide on last-delivered ID: `$` (only new) or `0` (all pending)

2. **Configure consumer settings:**
   - Set `read_timeout` to 2-5 seconds in queue config
   - Set `block_for` to null (blocking read controlled by read_timeout)
   - Assign unique consumer name per process instance

3. **Implement processing with acknowledgment:**
   - `XREADGROUP GROUP group consumer BLOCK 2000 COUNT 10 STREAMS stream >`
   - Process each message (handle, validate, persist)
   - `XACK stream group [messageId]` after successful processing
   - Implement try/catch with XACK in finally for error cases

4. **Implement dead-letter handling:**
   - Track retry count (message metadata or external counter)
   - After N failures, `XADD stream:dlt * field1 val1 ...` (copy to DL stream)
   - XACK the original message to remove from PEL
   - Set up alerting on DL stream depth

5. **Implement pending message claiming:**
   - For Redis 6.2+: periodic `XAUTOCLAIM stream group consumer minIdleTime 0-0 COUNT 100`
   - For older Redis: `XPENDING stream group - + 100 consumer` + `XCLAIM stream group consumer minIdleTime [ids]`
   - Process claimed messages with same acknowledgment logic

6. **Configure stream trimming:**
   - On production: `XADD stream MAXLEN ~ 100000 * field1 val1 ...`
   - Maintenance: `XTRIM stream MAXLEN ~ 100000`
   - Monitor stream length with `XLEN stream`

7. **Set up monitoring:**
   - `XPENDING stream group` — total pending count
   - `XINFO GROUPS stream` — per-group statistics
   - `XINFO CONSUMERS stream group` — per-consumer pending counts
   - Alert on pending > threshold (e.g., 100 for 5+ minutes)

## Validation Checklist
- [ ] `read_timeout` set in queue configuration (2-5 seconds)
- [ ] Consumer group created for each stream
- [ ] Unique consumer name per process instance (hostname:pid or pod name)
- [ ] `XACK` called after successful message processing
- [ ] Dead-letter stream configured with max retry count
- [ ] Pending message claiming implemented (`XAUTOCLAIM` or `XCLAIM`)
- [ ] Stream trimming active (`XADD MAXLEN ~ N` or periodic `XTRIM`)
- [ ] Consumer group PEL and depth monitoring with alerts
- [ ] Idempotent message handlers for duplicate tolerance
- [ ] Error handling distinguishes retryable vs permanent failures
- [ ] Redis memory monitored for stream data growth
- [ ] TLS/SSL or network isolation for production Redis connections

## Common Failures
- **Worker hangs:** No `read_timeout` — set it to force reconnection
- **Duplicate processing:** Missing `XACK` — acknowledge after processing
- **Message loss:** No pending claiming — implement `XAUTOCLAIM`
- **Out-of-memory:** No stream trimming — add `MAXLEN ~ N` to XADD
- **Poison message loop:** No dead-letter handling — route to DL stream after N failures
- **Consumer name collision:** Duplicate consumer names in same group — use unique names
- **Slow group creation:** Large existing stream — use `0` as last-delivered ID, not `$`

## Decision Points
- `read_timeout`: 2s for most workloads, 5s for slow network
- Max stream length: 100K-1M entries based on throughput and memory budget
- Pending claim idle time: 1 hour for standard, 10 minutes for latency-sensitive
- DL stream max retries: 3 for permanent errors, 5 for flaky dependencies
- Consumer group last-delivered ID: `$` for new stream, `0` for existing

## Related Rules
- set-read-timeout-for-streams (05-rules.md)
- monitor-consumer-group-lag (05-rules.md)
- claim-pending-on-failure (05-rules.md)
- acknowledge-after-processing (05-rules.md)

## Related Skills
- Implement Dead-Letter Queue Pattern
- Set Up Redis Stream Monitoring and Alerting
- Configure Laravel Queue Drivers
- Design Idempotent Message Handlers

## Related Decision Trees
- Stream vs Queue Decision (07-decision-trees.md)
- Redis Stream Consumer Group Setup (07-decision-trees.md)

## Success Criteria
Redis Streams consumer groups are configured with proper read timeouts, unique consumer names, acknowledgment after processing, dead-letter routing for unprocessable messages, periodic pending message claiming for fault recovery, stream trimming for bounded memory, and automated monitoring alerting on PEL growth and consumer health.
