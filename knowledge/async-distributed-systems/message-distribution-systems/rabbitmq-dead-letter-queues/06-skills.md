# Skill: Configure RabbitMQ Dead-Letter Queues

## Purpose
Configure RabbitMQ dead-letter exchanges (DLX) on production queues so rejected, expired, or exceeded-delivery-limit messages are routed to a dead-letter queue for inspection and reprocessing.

## When To Use
Production queues where data loss from rejected messages is unacceptable; TTL-based message cleanup with preservation; per-message ack for guaranteed processing.

## When NOT To Use
Loss-tolerant scenarios (auto-ack simpler); application-level DLQ already adequate; development environments.

## Prerequisites
- RabbitMQ queue with exchange type configured
- DLX exchange name and routing key determined

## Inputs
- Queue name for DLX configuration
- DLX exchange name
- Optional: separate routing keys for retryable vs fatal errors

## Workflow
1. Configure DLX on the queue: `'x-dead-letter-exchange' => 'orders.dlx'`
2. Set `'x-dead-letter-routing-key' => 'orders.failed'` for DLQ routing
3. Set `'x-delivery-limit' => 3` to prevent infinite delivery loops
4. Set `'x-max-length' => 100000` and `'x-overflow' => 'reject-publish'` for backpressure
5. Create and bind a queue to the DLX for consumer inspection
6. Use separate routing keys for retryable vs fatal errors
7. Monitor DLQ depth and oldest message age with alerts
8. Use per-message ack (`basic.nack` with `requeue=false`) for non-retryable failures

## Validation Checklist
- [ ] DLX configured on production queues via `x-dead-letter-exchange`
- [ ] `x-delivery-limit` set (prevents infinite delivery loops)
- [ ] `x-max-length` and `x-overflow` configured (backpressure)
- [ ] DLQ queue bound to DLX (consumer attached)
- [ ] Separate routing keys for retryable vs fatal errors
- [ ] DLQ depth and age monitored with alerts
- [ ] Per-message ack used (not auto-ack)
- [ ] `basic.nack` with `requeue=false` for non-retryable failures

## Common Failures
- No DLX on production queue — rejected messages silently dropped
- `basic.reject` with `requeue=true` — infinite requeue loop for poison messages
- No monitoring on DLQ — failures pile up unnoticed until disk full
- DLQ with auto-ack consumer — messages deleted without inspection
- No `x-delivery-limit` — infinite delivery cycles

## Decision Points
- Retryable failure: route to retry queue with TTL
- Fatal failure: route to human-inspection queue
- Expired message: route to DLX automatically via TTL

## Related Rules
- Rule 1: configure-dlx-for-failed-messages
- Rule 2: set-max-length-before-dlx
- Rule 3: route-dead-lettered-to-named-queue
- Rule 4: separate-dlx-retry-from-fatal

## Related Skills
- Select RabbitMQ Exchange Type for Queue Routing
- Implement a Dead-Letter Queue for Permanently Failed Jobs
- Schedule Pruning of Failed Jobs

## Success Criteria
DLX configured on all production queues, `x-delivery-limit` prevents infinite loops, DLQ is monitored with alerts, and retryable vs fatal failures use separate routing.
