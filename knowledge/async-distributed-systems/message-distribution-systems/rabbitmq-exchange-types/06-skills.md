# Skill: Select RabbitMQ Exchange Type for Queue Routing

## Purpose
Choose the correct RabbitMQ exchange type (direct, fanout, topic, headers) based on the message routing pattern required for the queue topology.

## When To Use
When using RabbitMQ as a queue driver in Laravel; when designing a message distribution topology for multi-consumer systems.

## When NOT To Use
Simple queue backends (Redis, database) where exchanges don't apply; when direct exchange suffices for most Laravel queue use cases.

## Prerequisites
- RabbitMQ broker running
- `vyuldashev/laravel-queue-rabbitmq` package installed (or similar)
- Understanding of routing key and binding concepts

## Inputs
- Number of consumers and their message access patterns
- Routing key convention
- Exchange durability requirements

## Workflow
1. Determine routing pattern:
   - One consumer, one queue: Direct exchange
   - All consumers need all messages: Fanout exchange
   - Consumers need message subsets by pattern: Topic exchange
   - Routing by multiple attributes: Headers exchange
2. Always set `durable = true` in production
3. Use direct exchange for point-to-point job dispatch
4. Use fanout for broadcast events that all consumers need
5. Use topic for selective routing with wildcard patterns (`*`, `#`)
6. Use headers for multi-attribute routing with `x-match = all` or `any`
7. Monitor bindings — orphaned bindings accumulate after queue deletion

## Validation Checklist
- [ ] Exchange type matches routing pattern (direct/fanout/topic/headers)
- [ ] `durable = true` in production
- [ ] Direct exchange used for point-to-point dispatch
- [ ] Fanout used for broadcast (all consumers)
- [ ] Topic used for pattern-based selective routing
- [ ] Routing key conventions standardized for topic exchanges
- [ ] No orphaned bindings accumulated
- [ ] Headers exchange uses `x-match = all` or `any`

## Common Failures
- Topic exchange with exact routing keys — unnecessary pattern matching overhead
- Non-durable exchange — lost on broker restart
- Binding key mismatch — messages dropped or misrouted
- Fanout when selective routing is needed — all queues see all messages

## Decision Points
- One-to-one dispatch: Direct
- Broadcast to all: Fanout
- Pattern-based subset: Topic
- Multi-attribute routing: Headers

## Related Rules
- Rule 1: use-direct-exchange-for-point-to-point
- Rule 2: use-fanout-exchange-for-broadcast-events
- Rule 3: use-topic-exchange-for-selective-routing
- Rule 4: bind-queue-to-header-with-x-match

## Related Skills
- Configure RabbitMQ Dead-Letter Queues
- Configure Redis Streams as Queue Backend
- Implement Amazon SQS with Visibility Timeout

## Success Criteria
Exchange type matches the routing pattern, durability is enabled for production, bindings are clean, and routing key conventions are standardized.
