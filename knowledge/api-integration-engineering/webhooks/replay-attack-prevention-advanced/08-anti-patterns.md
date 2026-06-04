# Anti-Patterns — Replay Attack Prevention (Timestamp + Nonce Windows)

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | webhook-systems-incoming |
| Knowledge Unit | Replay Attack Prevention (Timestamp + Nonce Windows) |
| Version | 1.0 |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. Timestamp-Only Delusion
2. Unbounded Nonce Accumulation
3. Shared Nonce Namespace
4. Crypto-First Ordering
5. Replay Detection Blindness

---

## 1. Timestamp-Only Delusion

### Category
Security

### Description
Relying solely on timestamp validation for replay attack prevention without nonce deduplication, leaving a window of vulnerability for replay within the tolerance period.

### Why It Happens
Timestamp validation is simple to implement — check if the webhook is recent, reject if too old. The developer assumes this is sufficient because an attacker cannot replay an old request. The scenario of replay within the tolerance window (e.g., same webhook replayed 5 times within 5 minutes) is not considered.

### Warning Signs
- Replay prevention checks only timestamp, no nonce or idempotency key
- Same webhook ID visible in logs multiple times within the tolerance window
- No Redis or cache check for previously processed webhook IDs
- Tolerance window is the only replay defense mechanism

### Why Harmful
An attacker who intercepts a legitimate webhook can replay it any number of times within the timestamp tolerance window. For a standard 5-minute window, this means the attacker can cause duplicate processing for 5 minutes. Each replay triggers the same business logic, potentially creating multiple charges, notifications, or data entries.

### Consequences
- Duplicate processing of replayed webhooks within tolerance window
- Multiple charges, order fulfillments, or notifications from a single legitimate event
- Attacker can cause exactly timed duplicate effects
- False sense of security from having "replay prevention"

### Alternative
Combine timestamp validation with nonce deduplication. Timestamp rejects old requests cheaply; nonce prevents replay within the window.

### Refactoring Strategy
1. Add nonce store (Redis cache) for tracking processed webhook IDs
2. Implement nonce check after timestamp validation but before signature verification
3. Scope nonce keys by provider to prevent collisions
4. Set nonce TTL to match the maximum retry window (24h default)
5. Verify that same webhook ID replayed within the window is rejected

### Detection Checklist
- [ ] Both timestamp and nonce checks implemented
- [ ] Nonce store prevents replay within tolerance window
- [ ] Same webhook ID replayed within window is rejected
- [ ] Nonce keys scoped by provider

### Related Rules
Combine Timestamp + Nonce for Defense in Depth

### Related Skills
Prevent Incoming Webhook Replay Attacks

### Related Decision Trees
Replay Prevention Mechanism (Timestamp vs Nonce vs Both)

---

## 2. Unbounded Nonce Accumulation

### Category
Reliability

### Description
Storing nonces in a database table or unbounded data structure without TTL, causing the store to grow indefinitely and degrade performance over time.

### Why It Happens
Developers use a database table to store processed webhook IDs for durable deduplication. The table has a unique constraint and works perfectly. High-volume providers add thousands of records daily. A cleanup job is planned but never implemented. The table grows to millions of rows, slowing inserts and lookups.

### Warning Signs
- Nonces stored in database table with no TTL or cleanup mechanism
- Nonce store size grows monotonically
- Cache or database table lacks expiration column
- No scheduled job for purging expired nonces
- Application performance degrades over time

### Why Harmful
Without TTL, every processed webhook ID is stored permanently. A high-volume provider sending 10,000 webhooks per day generates 300,000 records per month. After a year, the nonce store has millions of records. Every lookup becomes slower, storage costs increase, and the store provides no benefit for events older than the retry window.

### Consequences
- Linear growth of nonce store over time
- Degraded lookup performance
- Increased database storage costs
- Unnecessary retention of data with no security value

### Alternative
Use Redis-backed nonce store with automatic TTL expiration set to the maximum retry window (24 hours). For durability requirements, use a database table with a TTL column and a scheduled cleanup job.

### Refactoring Strategy
1. Move nonce storage to Redis with 24-hour TTL using `Cache::add()`
2. If database storage is required for compliance, add a `processed_at` column
3. Create a scheduled Artisan command to purge nonces older than the retry window
4. Run the cleanup job daily via Laravel scheduler
5. Monitor nonce store size to verify cleanup is effective

### Detection Checklist
- [ ] Nonce store has TTL or automated expiration
- [ ] Redis-backed nonces use TTL for automatic expiry
- [ ] Database nonces have cleanup job running on schedule
- [ ] Nonce store size remains stable over time

### Related Rules
Use Redis-Backed Nonce Store with TTL

### Related Skills
Prevent Incoming Webhook Replay Attacks

### Related Decision Trees
Nonce Storage Strategy

---

## 3. Shared Nonce Namespace

### Category
Code Organization

### Description
Using a single namespace for all provider nonces without scoping by provider, causing event ID collisions between different providers.

### Why It Happens
The nonce key is implemented as `webhook:{event_id}` without considering the provider. The event IDs from different providers are assumed to be globally unique. This assumption holds for some providers (Stripe uses UUIDs) but fails for others that use sequential IDs or shared ID formats.

### Warning Signs
- Nonce key format: `webhook:{eventId}` (no provider scope)
- Different providers use the same event ID format
- Valid webhooks from one provider rejected after another provider uses the same ID
- Collision detection requires manual log analysis

### Why Harmful
When two providers use the same event ID (e.g., both use integer IDs that happen to overlap), the first provider's webhook creates a nonce entry that blocks the second provider's legitimate webhook. This causes silent event loss that is difficult to debug because the error looks like a duplicate rather than a cross-provider collision.

### Consequences
- Legitimate webhooks from one provider rejected due to another provider's events
- Silent event loss with no obvious error signature
- Debugging requires correlating nonce keys with provider identity
- Increasing providers increases collision probability

### Alternative
Scope nonce keys by provider: `webhook:{provider_name}:{event_id}`.

### Refactoring Strategy
1. Identify all nonce key generation locations
2. Update key format to include provider name: `webhook:stripe:evt_123`
3. Backfill existing nonce entries with provider-scoped keys if replay prevention after migration is needed
4. Verify no further collisions by testing same event ID across different providers
5. Document key format in the codebase

### Detection Checklist
- [ ] Nonce keys scoped by provider name
- [ ] Same event ID from different providers accepted without collision
- [ ] No cross-provider collisions in production logs
- [ ] Key format documented

### Related Rules
Scope Nonces by Provider

### Related Skills
Prevent Incoming Webhook Replay Attacks

### Related Decision Trees
Nonce Storage Strategy

---

## 4. Crypto-First Ordering

### Category
Performance

### Description
Verifying the cryptographic signature before checking timestamp or nonce, wasting expensive crypto operations on requests that could be cheaply rejected.

### Why It Happens
Developers implement validation steps in the order they appear in documentation or the order that seems most important. Signature verification is the most security-critical step and is often placed first. The performance ordering (cheapest checks first) is not considered during implementation.

### Warning Signs
- Validator computes HMAC before checking timestamp
- Cryptographic operations performed on expired payloads
- High CPU usage on webhook endpoints from unnecessary crypto
- Request rejection rate at timestamp/nonce stage is significant

### Why Harmful
HMAC operations, while fast, are orders of magnitude more expensive than timestamp comparison (integer arithmetic) or nonce lookup (cache read). For requests that will be rejected by timestamp or nonce anyway (replays, old deliveries, duplicate retries), the cryptographic work is wasted. At scale, this unnecessary computation adds up to significant CPU cost.

### Consequences
- Unnecessary cryptographic overhead on replayed or expired requests
- Reduced throughput on webhook receiving endpoints
- Higher CPU utilization and cloud costs
- Higher latency for legitimate requests during replay storms

### Alternative
Order validation steps by computational cost: timestamp (cheapest) → nonce (medium) → signature (most expensive).

### Refactoring Strategy
1. Reorder validator logic: timestamp comparison first, nonce check second, signature verification last
2. Ensure each step returns `false` immediately on failure
3. Verify that no signature computation happens for requests that fail timestamp or nonce
4. Monitor reduction in HMAC operations after reordering

### Detection Checklist
- [ ] Timestamp validated before nonce and signature
- [ ] No signature computation on timestamp-failed or nonce-failed requests
- [ ] Validation steps ordered by computational cost
- [ ] CPU utilization on webhook endpoints reduced

### Related Rules
Validate Timestamp Before Nonce and Signature

### Related Skills
Prevent Incoming Webhook Replay Attacks

### Related Decision Trees
Timestamp Tolerance Configuration

---

## 5. Replay Detection Blindness

### Category
Security

### Description
Silently rejecting replayed webhooks without logging the detection, leaving security teams blind to replay attack attempts.

### Why It Happens
The validation pipeline returns `false` on duplicate detection, and the framework handles the 403 response automatically. The code path for duplicate detection has no logging — it silently rejects the request because that's the expected behavior. Security monitoring is not considered because the validation is working correctly.

### Warning Signs
- Duplicate webhooks rejected without any log entry
- No monitoring for replay detection events
- Security team has no visibility into replay attempt frequency
- Incident response has no forensic data on replay attacks

### Why Harmful
Replay attempts may indicate active attacks: an attacker intercepting webhook traffic and replaying it. Without logging, these attempts are invisible. A sustained replay campaign could indicate a compromised provider webhook endpoint or a network-level interception. The first indication of a problem might be duplicate charges or data corruption — well after the attack started.

### Consequences
- Active replay attacks undetected
- No forensic evidence for incident response
- Compliance violations for security monitoring requirements
- Delayed detection of provider compromise

### Alternative
Log all replay detection events (timestamp rejections and duplicate nonce detections) with provider, event ID, and timestamp for security monitoring.

### Refactoring Strategy
1. Add logging to the timestamp validation failure path
2. Add logging to the nonce duplicate detection path
3. Include provider name, event ID, and source IP in log context
4. Set up alerts for sustained replay attempt rates
5. Create a dashboard showing replay attempt frequency over time

### Detection Checklist
- [ ] Replay detection events logged with provider and event ID
- [ ] Alerts configured for abnormal replay attempt rates
- [ ] Dashboard shows replay attempt trends
- [ ] Forensic data available for incident investigation

### Related Rules
Log Replay Attempts for Security Monitoring

### Related Skills
Prevent Incoming Webhook Replay Attacks

### Related Decision Trees
Replay Prevention Mechanism (Timestamp vs Nonce vs Both)
