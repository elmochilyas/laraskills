# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 04-resilience
**Knowledge Unit:** webhook-payload-storage
**Generated:** 2026-06-03

---

# Decision Inventory

1. Payload Storage Strategy (Store Before vs After Processing)
2. Retention and Cleanup Strategy
3. Reprocessing Workflow Strategy

---

# Architecture-Level Decision Trees

---

## Payload Storage Strategy

---

## Decision Context

Choosing when and how to store webhook payloads.

---

## Decision Criteria

* reliability
* security

---

## Decision Tree

Does the webhook trigger financial or critical business operations?
↓
YES → Store raw payload BEFORE any processing (audit trail)
  ↓
  Does payload contain sensitive data (PII, tokens)?
  ↓
  YES → Redact sensitive fields before storage; encrypt payload column
  NO → Store full payload; no redaction needed
NO → Is debugging support the primary goal?
  ↓
  YES → Store payload before processing for reprocess capability
  NO → Store only metadata; payload is ephemeral
  ↓
  Need to preserve payload even if processing succeeds?
  ↓
  YES → Store before processing; retain for audit period
  NO → Store only on failure; delete on success

---

## Rationale

Storing before processing preserves the original payload for reprocessing if the business logic fails or has bugs. Redaction protects sensitive data while maintaining the audit trail.

---

## Recommended Default

**Default:** Store raw payload before processing with 30-day retention
**Reason:** Enables reprocessing; bounded storage; adequate debug window

---

## Risks Of Wrong Choice

Storing after processing loses the payload if the processing code corrupts it. No redaction exposes sensitive data in storage. No storage makes debugging impossible.

---

## Related Rules

Store Payload Before Validation, Provide Admin UI for Manual Reprocessing

---

## Related Skills

Implement Secure Incoming Webhook Processing with Spatie

---

## Retention and Cleanup Strategy

---

## Decision Context

Determining how long to store webhook payloads and when to clean up.

---

## Decision Criteria

* maintainability
* compliance

---

## Decision Tree

Are there compliance or regulatory retention requirements?
↓
YES → 90-day retention with archive to cold storage before delete
  ↓
  Is payload volume high (>10000/day)?
  ↓
  YES → Partition by month; archive oldest before delete
  NO → Daily cleanup of records beyond retention period
NO → Is debugging the primary retention driver?
  ↓
  YES → 30-day retention; daily cleanup job
  NO → 7-day retention for basic traceability
  ↓
  Need to store payloads in separate database?
  ↓
  YES → Separate webhook_payloads table or database for isolation
  NO → Same database with scheduled cleanup

---

## Rationale

Retention period should balance debugging utility against storage cost. Daily scheduled cleanup prevents unbounded table growth. Archiving preserves compliance records.

---

## Recommended Default

**Default:** 30-day retention with daily scheduled cleanup
**Reason:** Adequate debugging window; bounded storage; simple maintenance

---

## Risks Of Wrong Choice

No cleanup causes unbounded table growth and slow queries. Too-short retention prevents debugging late-discovered issues. No archiving loses compliance records.

---

## Related Rules

Implement Automatic Retry with Exponential Backoff, Implement Idempotency via Unique Key on Event ID

---

## Related Skills

Implement Secure Incoming Webhook Processing with Spatie

---

## Reprocessing Workflow Strategy

---

## Decision Context

Designing the workflow for re-processing failed webhook payloads.

---

## Decision Criteria

* maintainability
* reliability

---

## Decision Tree

Is manual reprocessing of failed webhooks needed?
↓
YES → Create admin UI or Artisan command for one-click reprocessing
  ↓
  Does reprocessing need to preserve original event order?
  ↓
  YES → Sequential reprocessing in original order
  NO → Batch reprocessing with concurrency for speed
NO → Is automatic reprocessing with backoff sufficient?
  ↓
  YES → Queue-based retry with exponential backoff (10 attempts)
  NO → Manual intervention only; no automatic retry
  ↓
  Need idempotency check during reprocessing?
  ↓
  YES → Check idempotency key before processing; skip if already done
  NO → Risk of duplicate side effects on reprocessing

---

## Rationale

Admin UI enables operators to re-process failed webhooks after fixing the root cause. Idempotency check prevents duplicate side effects on reprocessing.

---

## Recommended Default

**Default:** Artisan command for batch reprocessing with idempotency check
**Reason:** Operator-controlled recovery; safe against duplicate side effects

---

## Risks Of Wrong Choice

No reprocessing capability means failed webhooks are lost forever. Reprocessing without idempotency causes duplicate side effects. Automatic reprocessing without backoff creates load spikes.

---

## Related Rules
Implement Automatic Retry with Exponential Backoff, Implement Idempotency via Unique Key on Event ID

---

## Related Skills
Implement Reliable Outgoing Webhook Dispatch with Spatie
