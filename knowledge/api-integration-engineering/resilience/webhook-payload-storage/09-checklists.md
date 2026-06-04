# Webhook Payload Storage for Reprocessing — Checklist

## Metadata
- **Domain:** API Integration Engineering
- **Subdomain:** Idempotency
- **Knowledge Unit:** Webhook Payload Storage for Reprocessing
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Understand Eloquent models and JSON columns
- [ ] Familiarity with idempotency key patterns
- [ ] Knowledge of queue processing and retry workflows

## Implementation Checklist
- [ ] Raw payload stored before processing
- [ ] Processing status tracked for each webhook (pending, processing, completed, failed)
- [ ] Admin UI or command for reprocessing
- [ ] Idempotency check on reprocessing
- [ ] Retention policy scheduled (90 days typical)
- [ ] Index on `event_id` for idempotency lookup
- [ ] Payload stored as JSON/text column with headers and signature

## Verification Checklist
- [ ] Reprocessing with same payload works correctly
- [ ] Idempotency prevents duplicate side effects on replay
- [ ] `WebhookEntry` model with JSON columns for flexibility

## Security Checklist
- [ ] Compliant with PCI DSS, SOC 2 audit trail requirements
- [ ] Storage access-controlled and encrypted at rest
- [ ] Retention policy respects data privacy regulations

## Performance Checklist
- [ ] Payload storage as JSON column adds ~5ms per insert
- [ ] JSON column supports indexing for performance
- [ ] Storage cost proportional to payload size × retention period

## Production Readiness Checklist
- [ ] Payload stored before any validation (preserve evidence)
- [ ] `WebhookEntry` model with processing status enum
- [ ] Artisan command for batch reprocessing of failed webhooks
- [ ] Retention policy via scheduled job (delete after 90 days)

## Common Mistakes to Avoid
- [ ] Avoid not storing payload before processing (no reprocess option)
- [ ] Avoid storing payload in same table as business data (coupling)
- [ ] Avoid relying on file storage with no backup strategy
- [ ] Avoid no retention policy (unbounded table growth)
- [ ] Avoid manual reprocessing without idempotency check (duplicate side effects)
- [ ] Avoid no status tracking for failed vs completed webhooks
