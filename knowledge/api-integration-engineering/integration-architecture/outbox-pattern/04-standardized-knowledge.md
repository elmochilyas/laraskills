# ECC Standardized Knowledge — Outbox Pattern

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | event-sourcing-integrations |
| Knowledge Unit ID | ku-04 |
| Knowledge Unit | Outbox Pattern |
| Difficulty | Advanced |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K034, K012, K018 |

## Overview (Engineering Value)
The outbox pattern ensures reliable webhook delivery by first storing the webhook payload as an outbox record in the local database (within the same transaction as the triggering business operation), then a separate process reads and delivers outbox records. This guarantees exactly-once delivery semantics: either both the business operation and the webhook outbox record are committed, or neither is. This pattern prevents the common failure mode where a business operation succeeds but the webhook dispatch fails or is lost.

## Core Concepts
- **Transactional Outbox**: Webhook payload stored in outbox table within the same DB transaction as the source operation
- **Outbox Relay**: Separate process (queue job, scheduler, or CDC) reading outbox and dispatching webhooks
- **At-Least-Once Delivery**: Outbox ensures delivery is attempted at least once; idempotency handles duplicates
- **Outbox Cleanup**: Processed records archived or deleted after successful delivery confirmation
- **Change Data Capture (CDC)**: Relaying outbox via database replication logs for zero-poll overhead

## When To Use
- Critical webhook delivery where reliability is paramount (payment confirmations, account changes)
- Systems requiring transactional guarantees between business logic and webhook dispatch
- High-volume systems where in-memory dispatch risks losing webhooks on process crash

## When NOT To Use
- Non-critical notifications where occasional loss is acceptable
- Low-volume systems where queue-level reliability suffices
- Systems already using reliable message brokers (RabbitMQ, Kafka)

## Best Practices
- Always create outbox record in the same database transaction as the triggering operation
- Use a dedicated outbox table, not piggybacking on business tables
- Implement idempotency key on outbox records for safe relay processing
- Index outbox table on `status` and `created_at` for efficient relay queries

## Architecture Guidelines
- Outbox table: `webhook_outbox` with columns `id`, `event_type`, `payload`, `headers`, `status`, `attempts`, `scheduled_at`
- Use Spatie webhook-server as the relay dispatcher
- Process outbox records via scheduled Artisan command or queue worker
- Implement batch processing: relay 100 outbox records per cycle
- Archive processed records or use soft deletes with TTL

## Performance Considerations
- Outbox write is a DB INSERT within the transaction (~2-5ms)
- Relay processing: batch of 100 records per worker iteration
- Archive/pruning of processed records to prevent table growth
- Index `status` and `scheduled_at` for efficient relay queries

## Related Topics
- **Prerequisites**: Database transactions, queue basics
- **Closely Related**: Inbox pattern (ku-05), webhook dispatching (outgoing), event sourcing
- **Advanced**: CDC-based relay (Debezium), transactional messaging
- **Cross-Domain**: Distributed transactions, event-driven architecture

## Verification
- [ ] Outbox record created in same transaction as business operation
- [ ] Relay processes outbox records and dispatches webhooks
- [ ] Process crash before relay does not lose outbox records
- [ ] Idempotency prevents duplicate delivery from relay reprocessing
- [ ] Processed records archived or cleaned up on schedule
