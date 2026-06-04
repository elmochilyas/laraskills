# Anti-Patterns — Idempotency Keys

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | idempotency-data-consistency |
| Knowledge Unit | Idempotency Keys |
| Version | 1.0 |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. Concurrent Request Race Window
2. Server-Side Key Generation Dependency
3. Sequential or Predictable Key Choice
4. Exclusive Success Response Caching
5. Key Collision Monitoring Blindness

---

## 1. Concurrent Request Race Window

### Category
Reliability

### Description
Not using distributed locking for idempotency key processing, allowing concurrent requests with the same key to both pass the existence check and execute in parallel, violating at-most-once semantics.

### Why It Happens
The idempotency check appears atomic in single-threaded testing: check cache, it's empty, process, store key. In production with concurrent workers, two requests arrive simultaneously and both see an empty cache. Both proceed to process, creating duplicate side effects. The developer doesn't account for concurrency because the gap is tiny.

### Warning Signs
- Idempotency key check uses simple Cache::has() → Cache::put() without locking
- Duplicate processing occurs under concurrent request load
- Race condition hard to reproduce in testing
- Production incidents during traffic spikes

### Why Harmful
The idempotency check without locking has a time-of-check-to-time-of-use vulnerability. Two concurrent requests both see "key not found" and both proceed. The operation executes twice despite having the same idempotency key. The at-most-once guarantee is violated, potentially causing duplicate charges, duplicate order fulfillment, or duplicate data entries.

### Consequences
- Exactly-once guarantee violated under concurrent load
- Duplicate side effects from simultaneous requests
- Data integrity issues from parallel execution
- Incident that is hard to reproduce and debug

### Alternative
Use `Cache::lock()` to acquire a distributed lock on the idempotency key before processing, ensuring serial execution for the same key.

### Refactoring Strategy
1. Add distributed lock acquisition before idempotency key check
2. Use `Cache::lock("idempotency:$key", 30)->block(10)` to wait if locked
3. Process and store key within the lock scope
4. Release the lock after storing the response
5. Test with concurrent requests using the same key

### Detection Checklist
- [ ] Distributed lock used for idempotency key processing
- [ ] Concurrent requests with same key serialized
- [ ] Lock timeout exceeds expected processing time
- [ ] No duplicate processing under concurrent load

### Related Rules
Combine Distributed Lock with Idempotency Key

### Related Skills
Manage Idempotency Keys Across Distributed Systems

### Related Decision Trees
Concurrent Request Handling Strategy (Lock vs Unique Constraint)

---

## 2. Server-Side Key Generation Dependency

### Category
Architecture

### Description
Relying on server-side idempotency key generation (from request fingerprint) instead of requiring client-generated UUIDs, losing idempotency for identical legitimate requests.

### Why It Happens
Server-side generation is transparent to clients — no API change required. The server computes a hash of the request payload and uses it as the idempotency key. This works for retries of identical payloads but fails for legitimate unique operations with identical payloads, such as charging $10 to two different customers on the same day.

### Warning Signs
- Server generates idempotency key from payload hash
- No `Idempotency-Key` header required from clients
- Identical payloads from different users incorrectly deduplicated
- Support tickets for "missing" operations that were deduplicated

### Why Harmful
Server-side key generation from payload hash cannot distinguish between an identical retry and a genuinely different operation with the same payload. If two customers each purchase an item for $10, both requests have the same payload JSON. The server sees the second request as a duplicate and returns the first customer's response, charging the first customer twice and the second customer zero.

### Consequences
- Legitimate unique operations incorrectly treated as duplicates
- Cross-customer deduplication errors
- Financial and data integrity impact
- Client-side idempotency bypassed without awareness

### Alternative
Require client-generated UUID v4 keys sent in the `Idempotency-Key` header, generated once per operation outside the retry loop.

### Refactoring Strategy
1. Remove server-side key generation from payload hash
2. Require `Idempotency-Key` header from clients
3. Validate key format as UUID v4 pattern
4. Document the client key generation requirement
5. Update SDK or client libraries to generate and send keys

### Detection Checklist
- [ ] Client-generated UUID keys required
- [ ] Server does not generate keys from payload
- [ ] No cross-operation deduplication errors
- [ ] Key format validation implemented

### Related Rules
Generate UUID on Client Side Once Per Operation

### Related Skills
Manage Idempotency Keys Across Distributed Systems

### Related Decision Trees
Key Generation Strategy (Client vs Server)

---

## 3. Sequential or Predictable Key Choice

### Category
Security

### Description
Using sequential IDs, timestamps, or other predictable values as idempotency keys instead of random UUIDs, creating collision risks and security vulnerabilities.

### Why It Happens
Sequential keys are natural — auto-increment IDs, timestamps, or request counters are readily available. UUIDs seem unnecessarily long and complex. The developer assumes uniqueness from the natural key without considering collision probability or security implications.

### Warning Signs
- Idempotency keys are integers, timestamps, or sequential strings
- Key format lacks randomness (no UUID pattern)
- Key collision incidents reported
- Attacker can predict future key values

### Why Harmful
Predictable keys enable two attack scenarios. First, collision: an attacker can intentionally reuse a known key to cause deduplication errors (replaying a successful payment key to get a free charge). Second, pre-generation: an attacker can generate valid keys in advance and monitor which ones are used, deriving business intelligence from key usage patterns.

### Consequences
- Collision-based attacks exploiting key reuse
- Business intelligence leakage from key pattern observation
- Data corruption from intentional key collisions
- Audit/compliance concerns for predictable identifiers

### Alternative
Use UUID v4 for all idempotency keys — 128-bit random, non-sequential, unpredictable.

### Refactoring Strategy
1. Replace sequential/timestamp key generation with UUID v4
2. Use `Str::uuid()` or `Ramsey\Uuid\Uuid::uuid4()` for generation
3. Validate UUID format server-side, reject non-UUID keys
4. Remove any sequential key generation code
5. Migrate existing predictable keys to UUID format if possible

### Detection Checklist
- [ ] All idempotency keys use UUID v4 format
- [ ] No sequential or timestamp-based key generation
- [ ] Key format validated server-side
- [ ] No predictable key patterns in logs

### Related Rules
Generate UUID on Client Side Once Per Operation

### Related Skills
Manage Idempotency Keys Across Distributed Systems

### Related Decision Trees
Key Generation Strategy (Client vs Server)

---

## 4. Exclusive Success Response Caching

### Category
Reliability

### Description
Caching only successful responses indexed by idempotency key, allowing failed operations to be retried with the same key and re-executed after a transient failure.

### Why It Happens
The caching logic stores the response after successful processing: `Cache::put("idem:$key", $response)`. If the operation fails (network error, timeout, validation failure), no response is cached. The client retries with the same key, and the server sees "key not found" and re-executes the operation. The idempotency key only protects against duplicate success, not duplicate failure.

### Warning Signs
- Only successful responses cached under idempotency key
- Failed operations retried with same key are re-executed
- Transient failures followed by retry still result in duplicate on second success
- Idempotency key does not persist errors

### Why Harmful
Consider a payment operation: first attempt fails with a network timeout (no response cached). Client retries with the same key. Server sees no cached response and re-executes the payment. If the second attempt succeeds, the payment is processed twice — the first attempt also succeeded on the server but the response was lost. The idempotency key provided zero protection because the failure was never cached.

### Consequences
- Transient failures can result in duplicate processing on retry
- Idempotency guarantee voided when first attempt fails silently
- Payment operations charged twice despite idempotency
- False confidence in exactly-once semantics

### Alternative
Cache both success and failure responses under the idempotency key. Return the cached failure response on duplicate key, preventing re-execution.

### Refactoring Strategy
1. Ensure all responses (success and failure) are cached after processing
2. Store the complete response including error status and body
3. Return cached failure response on duplicate key
4. Only clear the key if the client explicitly indicates a new attempt
5. Implement manual key clearing for administrative use

### Detection Checklist
- [ ] Both success and failure responses cached
- [ ] Failed operations return cached error on duplicate key
- [ ] No duplicate processing from transient failures
- [ ] Exactly-once semantics maintained for all outcomes

### Related Rules
Cache First Successful Response per Key

### Related Skills
Manage Idempotency Keys Across Distributed Systems

### Related Decision Trees
Key Storage Strategy (Cache vs Database)

---

## 5. Key Collision Monitoring Blindness

### Category
Observability

### Description
Not tracking idempotency key collision rates, leaving security incidents (replay attacks, key generation bugs) undetected.

### Why It Happens
Idempotency keys are infrastructure — they work behind the scenes. Collisions are expected to be rare with UUID v4. No monitoring is implemented because collisions indicate bugs or attacks, not normal operation. The first indication of a problem comes from data corruption or financial impact, not from monitoring.

### Warning Signs
- No metric tracking idempotency key collision rate
- No alerting on collision rate spikes
- Collision incidents discovered through customer complaints
- No visibility into key reuse patterns

### Why Harmful
Elevated collision rates indicate one of three problems: a client-side key generation bug (same key for different operations), an attempted replay attack (attacker resending captured requests), or a systematic collision (predictable key pattern). Without monitoring, any of these scenarios proceeds silently until data corruption occurs. A replay attack could process thousands of duplicate payment operations before detection.

### Consequences
- Replay attacks undetected until financial impact
- Client-side bugs cause data corruption before discovery
- No forensic data for incident investigation
- Compliance violations for monitoring requirements

### Alternative
Track idempotency key collision rate as a security metric and alert on spikes.

### Refactoring Strategy
1. Add collision counter to the idempotency key deduplication logic
2. Log collisions with key prefix, source IP, and endpoint
3. Create a dashboard showing collision rate over time
4. Set up alerts for collision rate > expected baseline (near-zero for UUID v4)
5. Investigate elevated collision rates as security incidents

### Detection Checklist
- [ ] Collision rate tracked as a metric
- [ ] Alerts configured for collision rate spikes
- [ ] Dashboard shows collision trends
- [ ] Collision investigation procedure documented

### Related Rules
Monitor Key Collision Rate

### Related Skills
Manage Idempotency Keys Across Distributed Systems

### Related Decision Trees
Key Storage Strategy (Cache vs Database)
