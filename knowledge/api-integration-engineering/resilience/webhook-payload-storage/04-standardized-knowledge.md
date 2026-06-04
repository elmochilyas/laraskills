# ECC Standardized Knowledge — Webhook Payload Storage for Reprocessing

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | resilience-patterns |
| Knowledge Unit ID | ku-43 |
| Knowledge Unit | Webhook Payload Storage for Reprocessing |
| Difficulty | Intermediate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K017, K003, K004, K015 |

## Overview (Engineering Value)
Storing incoming webhook payloads enables reprocessing when initial handling fails due to bugs, downstream unavailability, or data issues. The raw payload is persisted (typically JSON column in database) before processing, allowing operators to replay webhooks after fixes. Combined with idempotency keys, this provides reliable exactly-once processing semantics.

## Core Concepts
- **Raw Payload Storage**: Store unmodified incoming webhook before any processing
- **Payload Model**: Eloquent model with JSON column for headers, body, metadata
- **Reprocessing**: Retry with same payload after fixing processing logic
- **Processing Status**: pending, processing, completed, failed
- **Triage**: Manual review of failed payloads via admin UI
- **Retention Policy**: Time-based cleanup of processed payloads

## When To Use
- Business-critical webhooks (payments, account changes)
- Any integration needing auditing or reprocessing capability
- Compliance requirements (PCI DSS, SOC 2 audit trails)
- High-volume webhooks where some failures are expected

## When NOT To Use
- Non-critical webhooks (analytics, notifications)
- Low-volume webhooks where failures are rare
- When payload size is very large (store reference instead)
- Real-time processing requiring no persistence

## Best Practices
- Store payload before validation (preserve evidence of what was received)
- Store as JSON/text column with headers and signature
- Use polymorphic relationship for different payload types
- Implement idempotency via unique key on event_id
- Provide admin UI for manual reprocessing with one-click replay
- Implement automatic retry with exponential backoff

## Architecture Guidelines
- WebhookEntry model with JSON columns for flexibility
- Processing status enum: pending, processing, completed, failed
- Artisan command for batch reprocessing of failed webhooks
- Retention policy via scheduled job (delete after 90 days)
- Index on event_id for idempotency lookup

## Performance Considerations
- Payload storage as JSON column adds ~5ms per insert
- JSON column supports indexing for performance
- Storage cost proportional to payload size × retention period
- Reprocessing overhead: additional request per replayed webhook

## Common Mistakes
- Not storing payload before processing (no reprocess option)
- Storing payload in same table as business data (coupling)
- Relying on file storage with no backup strategy
- No retention policy (unbounded table growth)
- Manual reprocessing without idempotency check (duplicate side effects)
- No status tracking for failed vs completed webhooks

## Related Topics
- **Prerequisites**: Eloquent models, JSON columns
- **Closely Related**: Idempotency keys, queue processing
- **Advanced**: Reprocessing strategies, data retention
- **Cross-Domain**: Data engineering, auditing

## Verification
- [ ] Raw payload stored before processing
- [ ] Processing status tracked for each webhook
- [ ] Admin UI or command for reprocessing
- [ ] Idempotency check on reprocessing
- [ ] Retention policy scheduled (90 days)
- [ ] Index on event_id for idempotency
