# Skill: Use Redis Streams as Queue Backend

## Purpose
Configure and operate Redis Streams as a queue backend with consumer group semantics, message acknowledgment, and crash recovery via the Pending Entry List (PEL).

## When To Use
Need consumer group semantics (each message to one consumer in a group); need ack-based processing with crash recovery; want Kafka-like features within Redis; multiple consumer groups consuming same stream independently.

## When NOT To Use
Simple single-consumer FIFO (Lists have lower overhead); need Kafka-level durability and long retention; sub-millisecond throughput at massive scale (Streams slightly slower than Lists).

## Prerequisites
- Redis 5.0+ with Stream support
- `predis/predis` or `phpredis` driver
- AOF persistence configured for durability

## Inputs
- Stream key name
- Consumer group name
- Consumer name (per worker instance)

## Workflow
1. Create consumer group: `XGROUP CREATE orders processors $ MKSTREAM`
2. Consumer reads with `XREADGROUP processors worker1 orders > COUNT 1`
3. Process the message payload
4. Acknowledge: `XACK orders processors $MESSAGE_ID`
5. Trim the stream periodically: `XTRIM orders MAXLENGTH ~ 100000`
6. Implement dead consumer detection: periodic `XCLAIM` for consumers idle > 1 hour
7. Monitor PEL size — growing PEL indicates stuck consumers

## Validation Checklist
- [ ] Consumer group created before workers start
- [ ] `XACK` called after each successful message processing
- [ ] Stream trimmed with `MAXLENGTH ~ N` (N appropriate for memory budget)
- [ ] Dead consumer detection running (XCLAIM from idle consumers)
- [ ] AOF persistence enabled
- [ ] Separate Redis instance for streams vs cache
- [ ] PEL size monitored (alert if > threshold)

## Common Failures
- No `XACK` — PEL grows unbounded, memory leak
- Stream not trimmed — Redis memory fills up
- No consumer group — no ack support, no PEL recovery
- AOF disabled — all stream data lost on Redis restart
- Same Redis instance as cache — eviction deletes stream data

## Decision Points
- Partitions via multiple stream keys (Redis Streams are single-node)
- Consumer group per workload type (e.g., processors, notifiers)
- Retention: set `MAXLENGTH` based on throughput × retention window

## Related Rules
- Rule 1: use-consumer-groups-for-stream-processing
- Rule 2: trim-streams-with-maxlength
- Rule 3: implement-dead-consumer-detection
- Rule 4: enable-aof-for-durable-streams

## Related Skills
- Configure Kafka Topics, Partitions, Consumer Groups
- Configure RabbitMQ Exchange Types
- Implement Dead-Letter Queue Pattern

## Success Criteria
Stream consumer group delivers each message to exactly one consumer, PEL provides crash recovery with ack tracking, stream is trimmed within memory budget, and dead consumers are detected and claimed.
