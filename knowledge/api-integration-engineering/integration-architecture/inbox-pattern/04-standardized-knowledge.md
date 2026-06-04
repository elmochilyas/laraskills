# ECC Standardized Knowledge — Inbox Pattern

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | event-sourcing-integrations |
| Knowledge Unit ID | ku-05 |
| Knowledge Unit | Inbox Pattern |
| Difficulty | Advanced |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K034, K011, K018 |

## Overview (Engineering Value)
The inbox pattern ensures reliable, exactly-once processing of incoming webhooks by first storing the webhook payload in an inbox table and then processing it asynchronously. The webhook ID (from the provider) serves as a unique constraint, preventing duplicate processing even if the provider sends the same webhook multiple times (due to retries). Processing reads from the inbox, executes business logic, and marks the record as processed — all within a transaction that ensures exactly-once semantics. This is the receiver-side complement to the outbox pattern.

## Core Concepts
- **Inbox Table**: Store incoming webhook payload with unique constraint on provider webhook ID
- **Exactly-Once Semantics**: Unique constraint prevents duplicate processing even with provider retries
- **Async Processing**: Inbox record created in HTTP request; processing done by queue job
- **Idempotency Enforcement**: Same webhook ID → duplicate key violation → skip processing
- **Dead Letter Inbox**: Records that fail processing repeatedly flagged for manual review

## When To Use
- Payment webhooks where duplicate processing would cause double charges
- Any webhook from providers with at-least-once delivery semantics
- Systems requiring idempotent processing without relying on business logic
- Compliance environments needing processing guarantees

## When NOT To Use
- Idempotent webhook events where duplicates are harmless
- Providers that guarantee exactly-once delivery
- Very high-volume webhooks where inbox table write is a bottleneck

## Best Practices
- Use webhook ID + provider name as the unique constraint (different providers may have colliding IDs)
- Create inbox record before dispatching the processing job
- Process inbox records in FIFO order per provider for predictable behavior
- Implement inbox monitoring: alert on stuck unprocessed records

## Architecture Guidelines
- Inbox table: `webhook_inbox` with columns `id`, `provider`, `webhook_id`, `payload`, `headers`, `status`, `processed_at`
- Unique index on `(provider, webhook_id)` for deduplication
- Process via queue job dispatched from the HTTP receiving endpoint
- Dead letter queue after max retries exceeded
- TTL-based cleanup of processed records

## Performance Considerations
- Inbox INSERT with unique constraint: ~5-10ms for first insert, <1ms for duplicate detection
- Async processing removes processing time from HTTP response path
- Index on `(provider, webhook_id)` ensures fast duplicate detection
- Inbox table pruning for processed records prevents growth

## Related Topics
- **Prerequisites**: Unique constraints, queue processing
- **Closely Related**: Outbox pattern (ku-04), webhook receiving (incoming), idempotency keys
- **Advanced**: Distributed transaction coordination, saga pattern (ku-06)
- **Cross-Domain**: Message deduplication, at-least-once delivery

## Verification
- [ ] Inbox table has unique constraint on (provider, webhook_id)
- [ ] Duplicate webhook ID from same provider is rejected
- [ ] Processing job reads inbox record and marks as processed
- [ ] Stuck unprocessed records trigger alerting
- [ ] Processed records cleaned up after retention period
