# Anti-Patterns — Webhook Payload Storage for Reprocessing

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | resilience-patterns |
| Knowledge Unit | Webhook Payload Storage for Reprocessing |
| Version | 1.0 |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. Process-Then-Store Payload Loss
2. Transformed Payload Signature Breakage
3. Application-Level Duplicate Check Race
4. Status-Less Reprocessing Blindness
5. Unbounded Payload Table Growth

---

## 1. Process-Then-Store Payload Loss

### Category
Reliability

### Description
Processing the webhook payload before storing it to the database, losing the raw payload if processing fails and eliminating reprocessing capability.

### Why It Happens
The natural code flow is: receive request → validate → process → store. The developer stores the webhook entry after successful processing, assuming the entry is only needed for completed operations. The validation step comes first because it seems logical to check data before persisting anything. The consequence is invisible until a production bug causes processing to fail and there's no record of what was received.

### Warning Signs
- Webhook entry created after processing logic
- No record of webhooks that failed validation or processing
- Reprocessing impossible for failed webhooks
- Manual recovery requires provider log review

### Why Harmful
When a bug causes processing to fail (e.g., a schema change in the webhook payload, a null reference error), the raw payload is lost forever. Operators cannot reprocess the webhook after fixing the bug because no record exists. The team must request the provider to re-send the webhook, which may not be possible for past events. Every processing failure is a permanent data loss event.

### Consequences
- Permanent data loss on processing failure
- No reprocessing capability for failed webhooks
- Dependency on provider re-delivery for recovery
- Audit trail gaps for failed events

### Alternative
Store the raw payload before any validation or processing, preserving it for reprocessing regardless of outcome.

### Refactoring Strategy
1. Move webhook entry creation to the beginning of the handler
2. Store `headers`, `raw_body`, `signature` as received
3. Set initial status to `pending`
4. Process after storage is confirmed
5. Update status to `completed` or `failed` after processing

### Detection Checklist
- [ ] Payload stored before validation
- [ ] Payload stored before business logic
- [ ] Failed webhooks have records for reprocessing
- [ ] Initial status is `pending` or `received`

### Related Rules
Store Payload Before Validation or Processing

### Related Skills
Store Webhook Payloads with Idempotency Tracking

### Related Decision Trees
Payload Storage Strategy

---

## 2. Transformed Payload Signature Breakage

### Category
Security

### Description
Parsing, transforming, or re-encoding the webhook payload before storage, causing signature verification to fail on reprocessing because the stored payload differs from the original.

### Why It Happens
The developer parses the incoming JSON, manipulates it (adding metadata, normalizing fields, removing sensitive data), and stores the transformed version. The original raw payload is discarded. When reprocessing occurs, the stored payload is re-sent to the processing pipeline, and signature verification fails because the signature was computed over the original (different) payload.

### Warning Signs
- Webhook body stored as parsed/transformed JSON, not raw string
- Payload stored after validation/data modification
- Signature verification fails on reprocessing
- Reprocessing rejects previously received webhooks

### Why Harmful
Webhook signatures are computed over the exact raw body received over HTTP. Any transformation — even whitespace normalization, key sorting, or field removal — produces a different payload that won't match the original signature. When the stored (transformed) payload is reprocessed, signature verification fails because the HMAC doesn't match. The reprocessing attempt is rejected, defeating the purpose of storing payloads.

### Consequences
- Signature verification fails on reprocessing
- Reprocessed webhooks rejected as invalid
- Payload integrity cannot be verified on retry
- Reprocessing capability is broken

### Alternative
Store the original raw payload exactly as received (before parsing) alongside headers and signature for later verification.

### Refactoring Strategy
1. Use `$request->getContent()` to capture raw body before parsing
2. Store raw body as-is in a `raw_body` text column
3. Store headers separately as JSON (including signature header)
4. Do not modify raw body after capture
5. On reprocessing, reconstruct the original request from stored raw body

### Detection Checklist
- [ ] Raw payload stored before transformation
- [ ] Signature header preserved in storage
- [ ] Reprocessing can verify signature against stored payload
- [ ] No transformation of stored raw payload

### Related Rules
Persist Full Headers and Signature with Payload

### Related Skills
Store Webhook Payloads with Idempotency Tracking

### Related Decision Trees
Payload Storage Strategy

---

## 3. Application-Level Duplicate Check Race

### Category
Reliability

### Description
Using `WebhookEntry::where('event_id', $eventId)->exists()` for duplicate detection without a database unique constraint, allowing concurrent webhook deliveries to bypass deduplication.

### Why It Happens
The application-level check `if (!exists) { create }` pattern is natural and works in testing. The developer doesn't consider atomicity. A unique constraint seems redundant when the application already checks for duplicates. The race condition window between the SELECT and INSERT is invisible until concurrent production traffic triggers it.

### Warning Signs
- Duplicate detection uses `exists()` before `create()`
- No unique constraint on `event_id` column
- Duplicate processing observed under concurrent webhook delivery
- Test suite doesn't cover concurrent duplicate delivery

### Why Harmful
A webhook provider delivers the same event twice within milliseconds (at-least-once delivery). Both requests arrive concurrently. Both run `exists()` and see `false`. Both proceed to insert and process. The second insert succeeds because there's no unique constraint to reject it. The event processes twice — double payment, double notification, double side effects.

### Consequences
- Duplicate processing on concurrent webhook delivery
- Side effects multiplied despite duplicate check
- Data corruption from duplicate inserts
- Hard-to-reproduce concurrent deduplication failures

### Alternative
Add a unique constraint on `event_id` and use try-catch with `UniqueConstraintViolationException` for atomic duplicate detection.

### Refactoring Strategy
1. Add migration with unique index on `event_id` column
2. Remove application-level existence checks
3. Use try-insert-catch pattern: `WebhookEntry::create(...)` wrapped in try-catch
4. On `UniqueConstraintViolationException`, treat as duplicate and acknowledge
5. Test with concurrent duplicate webhook delivery

### Detection Checklist
- [ ] Unique constraint on `event_id`
- [ ] Try-insert-catch used instead of check-then-insert
- [ ] Concurrent duplicates correctly detected
- [ ] No application-level existence checks

### Related Rules
Implement Idempotency via Unique Constraint on event_id

### Related Skills
Store Webhook Payloads with Idempotency Tracking

### Related Decision Trees
Payload Storage Strategy

---

## 4. Status-Less Reprocessing Blindness

### Category
Maintainability

### Description
Not tracking processing status (pending, completed, failed) on stored webhook payloads, making it impossible to triage, selectively reprocess, or monitor webhook health.

### Why It Happens
The webhook payload table has columns for the data but no status field. The developer assumes processing is always successful — failures are exceptions to handle, not states to track. Without status, operators must examine application logs or database records to determine which webhooks need reprocessing, a manual and error-prone process.

### Warning Signs
- Webhook payload table has no status column
- No way to filter completed vs failed webhooks
- Reprocessing requires manual log review to identify failures
- Failed webhooks are invisible until customers report issues

### Why Harmful
Without status tracking, failed webhooks are invisible. A webhook that fails processing remains in the table indistinguishable from successful ones. Operators don't know which webhooks need reprocessing. Bugs that cause 5% of webhooks to fail go undetected for days. When a customer reports an issue, the team must parse application logs to find failures — a slow, error-prone process.

### Consequences
- Failed webhooks invisible until customer reports
- No selective reprocessing capability
- Degraded monitoring and alerting
- Slow incident response for processing failures

### Alternative
Track processing status with a defined enum (pending, processing, completed, failed) and expose filtering by status.

### Refactoring Strategy
1. Add `status` column with enum or string type to webhook payloads table
2. Set initial status to `pending` or `received` on creation
3. Update to `processing` before business logic execution
4. Update to `completed` or `failed` based on outcome
5. Create an Artisan command to list/reprocess by status

### Detection Checklist
- [ ] Status tracking implemented with enum
- [ ] Status updated at each processing stage
- [ ] Filtering by status possible
- [ ] Failed webhooks visible for triage

### Related Rules
Track Processing Status with Enum

### Related Skills
Store Webhook Payloads with Idempotency Tracking

### Related Decision Trees
Reprocessing Workflow Strategy

---

## 5. Unbounded Payload Table Growth

### Category
Maintainability

### Description
Never deleting or archiving processed webhook payloads, causing unbounded table growth, degraded query performance, and increased storage costs.

### Why It Happens
The storage pattern is implemented without a retention policy. The developer adds the webhook entry creation and processing logic but never considers cleanup. The table grows monotonically with each webhook received. The storage cost seems negligible initially but compounds over months. By the time performance degrades, the table has millions of rows and cleanup is non-trivial.

### Warning Signs
- Webhook payload table has no cleanup mechanism
- Table grows by thousands of rows per day
- Queries against the table become slower over time
- Database size attributed to webhook payload storage

### Why Harmful
A platform processing 10,000 webhooks per day adds 3.6 million rows per year. Query performance degrades as indexes grow deeper and table scans become expensive. Backups take longer and consume more storage. The useful debugging window for most webhooks is 7-90 days — history beyond that provides no value but incurs ongoing costs.

### Consequences
- Linear storage growth with webhook volume
- Degraded query performance over time
- Increased backup duration and storage costs
- Painful cleanup when table size becomes critical

### Alternative
Implement a scheduled retention cleanup job that deletes completed webhook entries older than 90 days (or configurable retention period).

### Refactoring Strategy
1. Add `created_at` index for efficient cleanup queries
2. Create a scheduled Artisan command for cleanup
3. Delete completed entries older than 90 days
4. Archive failed entries to cold storage before deletion if needed for compliance
5. Monitor table size to verify cleanup effectiveness

### Detection Checklist
- [ ] Retention cleanup job scheduled
- [ ] Retention period configured (90 days default)
- [ ] Completed entries deleted within retention window
- [ ] Table size stable over time

### Related Rules
Implement Scheduled Retention Cleanup

### Related Skills
Store Webhook Payloads with Idempotency Tracking

### Related Decision Trees
Retention and Cleanup Strategy
