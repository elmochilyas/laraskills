# Anti-Patterns — Dispatching Webhooks

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | webhook-systems-outgoing |
| Knowledge Unit | Dispatching Webhooks |
| Version | 1.0 |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. Synchronous Dispatch in Request Lifecycle
2. Unsigned Payload Delivery
3. Hardcoded Subscriber Endpoints
4. Missing Idempotency Identifier
5. Unversioned Payload Schema

---

## 1. Synchronous Dispatch in Request Lifecycle

### Category
Performance

### Description
Dispatching webhooks synchronously using `dispatchSync()` within the HTTP request lifecycle, blocking the response until the subscriber acknowledges the webhook.

### Why It Happens
Synchronous dispatch is the simplest API — `dispatch()` (which dispatches on the queue synchronously in some configurations) or `dispatchSync()` requires no queue setup. Developers in early development stages skip queue configuration for speed. The performance impact only becomes apparent under load when slow subscribers consume PHP workers.

### Warning Signs
- Webhook dispatched with `dispatchSync()` or without `->onQueue()`
- HTTP response time correlates with subscriber response time
- PHP-FPM workers exhausted during webhook bursts
- Application timeout errors during slow subscriber responses

### Why Harmful
A subscriber taking 10 seconds to respond blocks the PHP worker for 10 seconds. With 10 concurrent PHP workers, 10 slow subscribers can exhaust the pool, causing all other requests to queue. The application becomes unavailable because of subscriber latency. This couples application availability to subscriber endpoint reliability.

### Consequences
- Application availability tied to subscriber endpoint performance
- PHP worker pool exhausted by slow subscriber responses
- User-facing requests delayed by webhook delivery
- Cascading failures when subscriber is slow or down

### Alternative
Use queue-based dispatch via `->onQueue('webhooks')->dispatch()` to move delivery to a background worker.

### Refactoring Strategy
1. Replace `dispatchSync()` with `->onQueue('webhooks')->dispatch()`
2. Configure queue driver (Redis, SQS) if not already
3. Start queue workers for the webhooks queue
4. Verify HTTP response time no longer depends on subscriber response time
5. Test under load to confirm worker pool protection

### Detection Checklist
- [ ] All webhooks dispatched via queue in production
- [ ] No `dispatchSync()` calls in webhook dispatching code
- [ ] HTTP response time independent of subscriber response time
- [ ] PHP worker pool not exhausted by webhook delivery

### Related Rules
Always Use Queue-Based Dispatch in Production

### Related Skills
Dispatch Outgoing Webhooks to External Subscribers

### Related Decision Trees
Dispatch Method (Synchronous vs Queue)

---

## 2. Unsigned Payload Delivery

### Category
Security

### Description
Sending webhook payloads without HMAC signing or with `doNotSign()`, allowing any intermediary to forge or tamper with webhook payloads.

### Why It Happens
Signing adds complexity — generating the signature, sending it in custom headers, and coordinating the secret with the subscriber. In early integration phases, signing is skipped for simplicity. The assumption is that HTTPS provides sufficient security, ignoring that HTTPS only protects transport, not end-to-end integrity.

### Warning Signs
- Webhook dispatch uses `doNotSign()` or omits `useSecret()`
- No signature header in outgoing webhook requests
- Subscriber cannot verify webhook authenticity
- Security audit flags unsigned webhook payloads

### Why Harmful
Without signing, any party that intercepts the HTTP request (compromised intermediary, DNS hijack, man-in-the-middle) can modify the payload without detection. The subscriber has no way to verify the webhook came from your system. A compromised intermediary can send fraudulent webhooks to your subscribers, potentially triggering financial transactions or data changes.

### Consequences
- Webhook payload forgeable by any intermediary
- Subscriber cannot verify payload authenticity
- End-to-end security compromised
- Compliance violations for integrity requirements

### Alternative
Always sign webhook payloads with `useSecret($subscriber->webhook_secret)` using per-subscriber secrets.

### Refactoring Strategy
1. Ensure every subscriber has a unique webhook secret stored securely
2. Add `->useSecret($subscriber->webhook_secret)` to every webhook dispatch
3. Remove `doNotSign()` calls or default unsigned configurations
4. Inform subscribers of the signing scheme and provide verification example
5. Verify signature header is present in outgoing webhook requests

### Detection Checklist
- [ ] All webhooks signed with subscriber-specific secrets
- [ ] No `doNotSign()` calls in codebase
- [ ] Signature header present in outgoing requests
- [ ] Subscribers can verify webhook authenticity

### Related Rules
Sign Every Webhook with a Subscriber-Specific Secret

### Related Skills
Dispatch Outgoing Webhooks to External Subscribers

### Related Decision Trees
Dispatch Method (Synchronous vs Queue)

---

## 3. Hardcoded Subscriber Endpoints

### Category
Maintainability

### Description
Storing subscriber webhook URLs in configuration files or environment variables instead of a database, requiring code deployments to add, update, or remove subscribers.

### Why It Happens
During initial development, webhook URLs are stored in `config/webhooks.php` or `.env` for simplicity. The application has one or two hardcoded subscribers. As the subscriber base grows, the deployment burden of changing URLs becomes apparent, but refactoring to database storage is deprioritized.

### Warning Signs
- Subscriber webhook URLs in `config/` files or `.env`
- Adding a subscriber requires a code deployment
- URL changes require config file modification and redeployment
- No self-service subscriber management

### Why Harmful
Each subscriber addition or URL change requires a full deployment cycle — code review, CI/CD, release. This slows subscriber onboarding from minutes (self-service) to hours or days (deployment cycle). URLs in config files are also exposed in version control history, creating a security leak of subscriber endpoint addresses.

### Consequences
- Slow subscriber onboarding (deployment cycle required)
- URL changes require redeployment
- Subscriber endpoint URLs exposed in version control
- No self-service subscriber management capability

### Alternative
Store subscriber webhook URLs in a database table with subscriber ID, URL, secret, active status, and health metrics.

### Refactoring Strategy
1. Create a `subscribers` migration with columns for webhook_url, webhook_secret, is_active
2. Create a Subscriber Eloquent model
3. Migrate existing hardcoded subscribers to the database
4. Update dispatch code to read subscriber data from the database
5. Build a subscriber management UI or API for self-service

### Detection Checklist
- [ ] Subscriber URLs stored in database, not config files
- [ ] Adding/updating subscribers doesn't require deployment
- [ ] No subscriber URLs in config files or version control
- [ ] Subscriber management available via UI or API

### Related Rules
Store Subscriber Webhook URLs in Database, Not Config Files

### Related Skills
Dispatch Outgoing Webhooks to External Subscribers

### Related Decision Trees
Delivery Tracking and Audit Strategy

---

## 4. Missing Idempotency Identifier

### Category
Reliability

### Description
Not including a unique `webhook-id` in the webhook payload, preventing subscribers from deduplicating retry deliveries and increasing the risk of duplicate side effects.

### Why It Happens
The webhook payload focuses on event data (order ID, user ID, event type) without an explicit deduplication field. Developers assume that webhook delivery is reliable enough that duplicates are rare. The need for idempotency is only appreciated after a retry cycle causes duplicate charges or notifications.

### Warning Signs
- Webhook payload has no `webhook-id`, `id`, or `event_id` field
- Subscriber reports double processing after retry cycles
- No stable unique identifier in the payload structure
- Payload fields are all business data with no delivery metadata

### Why Harmful
Webhook delivery is at-least-once by nature. Subscribers will receive duplicates during retry cycles, after network interruptions, or due to manual re-delivery. Without a stable unique ID, the subscriber cannot distinguish between a duplicate and a new event. Each retry delivery triggers the same business logic — charging a customer twice, fulfilling an order twice, or sending duplicate notifications.

### Consequences
- Duplicate charges, orders, or notifications on subscriber side
- Subscribers cannot safely implement idempotent processing
- Retry cycles amplify duplicate side effects
- Trust in webhook delivery reliability eroded

### Alternative
Include a unique, stable `webhook-id` (UUID) in every webhook payload for subscriber-side deduplication.

### Refactoring Strategy
1. Add `'webhook-id' => (string) Str::uuid()` to every webhook payload
2. Ensure the ID is stable across retries (generated once at first dispatch, not regenerated)
3. Document the idempotency field for subscribers
4. Verify the same ID is present in all retry attempts of the same webhook

### Detection Checklist
- [ ] Unique `webhook-id` in every webhook payload
- [ ] ID stable across retry attempts
- [ ] Subscribers can use the ID for deduplication
- [ ] Idempotency field documented for subscribers

### Related Rules
Implement Idempotency via webhook-id in Payload

### Related Skills
Dispatch Outgoing Webhooks to External Subscribers

### Related Decision Trees
Payload Versioning and Compatibility Strategy

---

## 5. Unversioned Payload Schema

### Category
Maintainability

### Description
Sending webhook payloads without a version field, making it impossible for subscribers to detect and adapt to payload schema changes.

### Why It Happens
The initial webhook payload is designed for the current application schema. A version field seems unnecessary because the payload is "simple enough." Schema changes are expected to be rare. When the payload inevitably changes (new fields, field renaming, structure change), subscribers break without clear error messages because they can't distinguish between a schema change and a data anomaly.

### Warning Signs
- Webhook payload has no `version` or `schema_version` field
- Subscriber errors after payload changes with no clear cause
- Coordinated deployments required for any payload modification
- No mechanism for subscribers to detect or adapt to changes

### Why Harmful
A payload schema change (e.g., renaming `user_id` to `customer_id`) breaks all subscribers simultaneously. Subscribers cannot distinguish between the intentional change and a bug. Rollback requires redeployment. Subscriber migration must happen in lockstep with the deployment, which is impractical for external subscribers with different update schedules.

### Consequences
- Breaking schema changes affect all subscribers simultaneously
- No graceful migration window for subscribers
- Coordinated deployments required for payload changes
- Subscriber errors during schema transitions

### Alternative
Include a `version` field in every webhook payload, and maintain backward compatibility during schema migration windows.

### Refactoring Strategy
1. Add `'version' => '2026-06-01'` (date-based versioning) to all webhook payloads
2. When changing the payload schema, increment the version
3. Maintain backward compatibility by including old fields alongside new fields during migration
4. Document versioning strategy for subscribers
5. Consider per-subscriber version targeting for longer migration windows

### Detection Checklist
- [ ] Version field in every webhook payload
- [ ] Payload schema changes include version increment
- [ ] Backward compatibility during migration windows
- [ ] Versioning strategy documented for subscribers

### Related Rules
Include Version Field for Subscriber Compatibility

### Related Skills
Dispatch Outgoing Webhooks to External Subscribers

### Related Decision Trees
Payload Versioning and Compatibility Strategy
