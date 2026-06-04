# Anti-Patterns — Idempotency Keys for API Write Operations

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | resilience-patterns |
| Knowledge Unit | Idempotency Keys for API Write Operations |
| Version | 1.0 |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. Retry Loop Key Regeneration
2. Application-Level Deduplication Race
3. TTL-Provider Retry Window Mismatch
4. Inconsistent Duplicate Response
5. Unbounded Key Storage

---

## 1. Retry Loop Key Regeneration

### Category
Reliability

### Description
Generating the idempotency key inside the retry loop instead of once per operation, giving each retry attempt a different key and defeating the purpose of idempotency.

### Why It Happens
The natural code structure places key generation close to the HTTP call: `Http::retry(3)->withHeader('Idempotency-Key', Str::uuid())`. The developer writes the idempotency key header inline without considering that each retry regenerates the UUID. The mistake is invisible in testing because retries rarely trigger.

### Warning Signs
- Key generation inline in the HTTP call arguments
- `Str::uuid()` called inside `withHeader()` or `retry()` callback
- Duplicate side effects observed during retry scenarios
- Idempotency keys in logs don't repeat across retries

### Why Harmful
Each retry attempt sends a different idempotency key to the server. The server treats each attempt as a unique operation. Instead of deduplicating, the server processes each retry independently, causing duplicate charges, duplicate orders, or duplicate side effects. The idempotency layer provides zero protection.

### Consequences
- Duplicate processing on every retry attempt
- Financial impact from double charges
- Data corruption from duplicate write operations
- False confidence in idempotency protection

### Alternative
Generate the idempotency key once before the retry loop and reuse the same key for all attempts.

### Refactoring Strategy
1. Move key generation outside the retry loop: `$key = (string) Str::uuid();`
2. Reference the pre-generated key in all retry attempts
3. Verify in logs that the same key appears in all retry requests
4. Test with forced retries to confirm idempotency

### Detection Checklist
- [ ] Idempotency key generated once per operation
- [ ] Same key used across all retry attempts
- [ ] Retry logs show consistent idempotency key
- [ ] No duplicate side effects during retry testing

### Related Rules
Generate Key Once Per Operation (Outside Retry Loop)

### Related Skills
Implement Idempotency Keys for Safe API Call Retries

### Related Decision Trees
Key Generation Strategy (Client vs Server)

---

## 2. Application-Level Deduplication Race

### Category
Reliability

### Description
Using application-level existence checks (`if (!exists) { create }`) for idempotency key deduplication without a database unique constraint, allowing race conditions under concurrent requests.

### Why It Happens
The developer writes a SELECT → check → INSERT pattern that works perfectly in single-threaded testing. The race condition window between the SELECT check and the INSERT is tiny — often microseconds. The risk of concurrent requests arriving in that window seems negligible and is discovered only after a production incident.

### Warning Signs
- Idempotency check uses `if (!IdempotencyKey::where(...)->exists())` before insert
- No unique constraint on the idempotency key column
- Concurrent test requests with the same key produce duplicate records
- Production incidents involving duplicate processing under load

### Why Harmful
Two concurrent requests with the same idempotency key both execute the existence check at the same time. Both see "key not found." Both proceed to process the operation and insert the key. The second insert succeeds because there's no unique constraint, resulting in two completed operations for one key.

### Consequences
- Duplicate processing under concurrent request delivery
- Data corruption from duplicate write operations
- Exactly-once guarantee violated
- Hard to reproduce and debug due to race condition nature

### Alternative
Add a unique constraint on the idempotency key column and catch the unique constraint violation to handle duplicates.

### Refactoring Strategy
1. Add database migration with unique index on idempotency key column
2. Replace check-then-insert with try-insert-catch pattern
3. On `UniqueConstraintViolationException`, return the cached response
4. Remove application-level existence checks

### Detection Checklist
- [ ] Unique constraint on idempotency key column
- [ ] Try-insert-catch pattern instead of check-then-insert
- [ ] Concurrent requests with same key serialized correctly
- [ ] No race condition in deduplication logic

### Related Rules
Add Unique Constraint on Idempotency Key Column

### Related Skills
Implement Idempotency Keys for Safe API Call Retries

### Related Decision Trees
Key Lifecycle Management (TTL vs Event-Based Expiry)

---

## 3. TTL-Provider Retry Window Mismatch

### Category
Architecture

### Description
Setting idempotency key TTL shorter than the upstream provider's maximum retry window, allowing late retries to bypass idempotency and create duplicate operations.

### Why It Happens
Developers set idempotency key TTL to a convenient round value (1 hour, 6 hours) without checking the provider's documented retry window. The assumption is that retries happen quickly. Stripe retries for up to 24 hours, PayPal for 48 hours — a 1-hour TTL leaves a 23-47 hour gap where late retries bypass idempotency.

### Warning Signs
- Idempotency key TTL set to 1h or 6h without provider-specific justification
- Late retries (hours after first attempt) create duplicate operations
- Provider documentation shows longer retry window than configured TTL
- Duplicate charges from "late" retries

### Why Harmful
The provider retries according to its own schedule, not the application's. If Stripe retries a charge request 23 hours later and the idempotency key expired after 1 hour, the retry is processed as a new charge. The customer is charged twice. The idempotency guarantee was only valid for 1 hour, not the full 24-hour retry window.

### Consequences
- Duplicate charges or orders from late provider retries
- Idempotency guarantee invalid for the full retry window
- Customer-facing financial errors
- Provider-specific TTL management required

### Alternative
Set idempotency key TTL to match the provider's maximum retry window (Stripe: 24h, PayPal: 48h, general: 24h default).

### Refactoring Strategy
1. Document each provider's maximum retry window
2. Set TTL at least as long as the longest provider retry window
3. For multi-provider systems, use per-provider TTL configuration
4. Add buffer (e.g., 24h + 1h) to account for clock skew
5. Monitor late retry events to verify TTL coverage

### Detection Checklist
- [ ] TTL matches or exceeds provider retry window
- [ ] No late retry duplicates in production
- [ ] Per-provider TTL configuration
- [ ] Buffer time included in TTL calculation

### Related Rules
Align TTL with Provider's Maximum Retry Window

### Related Skills
Implement Idempotency Keys for Safe API Call Retries

### Related Decision Trees
Key Lifecycle Management (TTL vs Event-Based Expiry)

---

## 4. Inconsistent Duplicate Response

### Category
Reliability

### Description
Returning a different response for a duplicate idempotency key than the original successful response, breaking the idempotency contract and confusing callers.

### Why It Happens
On duplicate detection, the developer returns a simple acknowledgment ("Already processed", 200) instead of the cached original response. The assumption is that the caller just needs confirmation, not the actual result. The idempotency contract requires identical responses for identical keys.

### Warning Signs
- Duplicate idempotency key returns a different response body or status code
- Caller receives "Already processed" instead of the original response data
- Idempotency-Status header missing or inconsistent
- Caller integration bugs due to unexpected response format on retry

### Why Harmful
Callers implement idempotency to safely retry and get a consistent result. A different response on retry breaks the caller's logic — they may not process the response correctly, may miss critical data (order ID, payment ID), or may treat the retry as a failure. The idempotency contract is violated: same key must mean same response.

### Consequences
- Caller integration broken by inconsistent responses
- Caller cannot rely on retry responses for business logic
- Idempotency contract violated
- Caller-side bugs and support issues

### Alternative
Cache the full response (status code, headers, body) from the first request and return it exactly for all duplicate keys.

### Refactoring Strategy
1. Store the complete HTTP response from the first successful request
2. On duplicate detection, return the cached response exactly
3. Include the response status code, headers, and body
4. Add `Idempotency-Status: Repeated` header for caller visibility
5. Test by verifying duplicate key returns byte-identical response

### Detection Checklist
- [ ] Duplicate key returns identical response to first request
- [ ] Response stored: status code, headers, body
- [ ] No custom "already processed" messages
- [ ] Idempotency-Status header present

### Related Rules
Return Cached Response on Duplicate Detection

### Related Skills
Implement Idempotency Keys for Safe API Call Retries

### Related Decision Trees
Key Validation Strategy (Same vs Different Payload)

---

## 5. Unbounded Key Storage

### Category
Maintainability

### Description
Storing idempotency keys permanently without TTL or cleanup strategy, causing unbounded storage growth and degraded performance over time.

### Why It Happens
The idempotency key table grows with each operation. No TTL or cleanup is configured because the developer focuses on functionality, not maintenance. The storage impact isn't apparent until the table reaches millions of rows and query performance degrades.

### Warning Signs
- Idempotency key table has no TTL column or cleanup process
- Table size grows monotonically with operation count
- Insert/lookup performance degrades over time
- Database size concerns attributed to idempotency keys

### Why Harmful
Each operation stores a row in the idempotency key table. A high-volume application processing 100,000 operations per day adds 36 million rows per year. Queries against the table become slower, storage costs increase, and backups take longer. Most of this data provides no value — keys older than the retry window cannot be reused anyway.

### Consequences
- Linear storage growth with operation volume
- Degraded insert and lookup performance over time
- Increased database storage costs
- Longer backup and restore times

### Alternative
Implement TTL-based key expiration (24h default) with Redis auto-expiry or a scheduled cleanup job for database storage.

### Refactoring Strategy
1. For cache-backed storage: add TTL on key creation (24h default)
2. For database-backed storage: add `created_at` column and scheduled cleanup job
3. Run cleanup daily: delete keys older than (TTL + buffer)
4. Monitor key table size to verify cleanup effectiveness
5. For compliance, archive old keys before deletion

### Detection Checklist
- [ ] Key storage has TTL or cleanup strategy
- [ ] Redis keys have TTL set
- [ ] Database keys have scheduled cleanup
- [ ] Key table size stable over time

### Related Rules
Implement Key Expiry Cleanup Strategy

### Related Skills
Implement Idempotency Keys for Safe API Call Retries

### Related Decision Trees
Key Lifecycle Management (TTL vs Event-Based Expiry)
