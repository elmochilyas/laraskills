# ECC Anti-Patterns — Spatie Laravel Webhook Server Package

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | api-integration-engineering |
| **Subdomain** | 03-webhooks |
| **Knowledge Unit** | Spatie Laravel Webhook Server Package |
| **Generated** | 2026-06-03 |

## Anti-Pattern Inventory

1. Synchronous Webhook Dispatch via dispatchSync()
2. Shared Signing Secret for All Subscribers
3. No Tags on Webhook Calls (No Categorization)
4. No Cleanup of Old WebhookCall Records
5. No Delivery Failure Monitoring
6. No Subscriber URL Verification

## Repository-Wide Anti-Patterns

- Silent Failure
- Hidden Configuration
- Premature Optimization

---

## Anti-Pattern 1: Synchronous Webhook Dispatch via dispatchSync()

### Category
Performance | Reliability

### Description
Calling `dispatchSync()` from an HTTP controller to send outgoing webhooks. Blocks the HTTP response until the subscriber responds.

### Why It Happens
`dispatchSync()` is simpler and doesn't require a queue worker. Developers use it during development and never switch to queue dispatch.

### Warning Signs
- `dispatchSync()` in controllers
- HTTP response time correlates with subscriber response time
- Worker exhaustion under concurrent webhook dispatch

### Why It Is Harmful
A subscriber with 5s response time blocks the PHP worker for 5 seconds. Under 10 concurrent orders, 10 workers are blocked. Other users experience delays. If the subscriber times out at 30s, the entire order creation fails. No automatic retry on transient failure.

### Preferred Alternative
Use queue-based `dispatch()` with dedicated webhook queue.

### Refactoring Strategy
1. Replace `dispatchSync()` with `onQueue('webhooks')->dispatch()`
2. Configure webhooks queue worker
3. Test that controller returns immediately regardless of subscriber speed

### Related Rules
Always Dispatch Via Queue (05-rules.md)

### Related Skills
Send Outgoing Webhooks with Spatie Laravel Webhook Server (06-skills.md)

### Related Decision Trees
Webhook Dispatch Method (07-decision-trees.md)

---

## Anti-Pattern 2: Shared Signing Secret for All Subscribers

### Category
Security

### Description
Using the default config secret for all subscribers instead of per-subscriber secrets via `useSecret()`.

### Why It Happens
The default configuration uses a single secret. Adding `useSecret()` is an extra step.

### Warning Signs
- No `useSecret()` call on WebhookCall
- All subscribers receive webhooks signed with same secret
- `config('webhook-server.secret')` used directly

### Why It Is Harmful
Any subscriber can forge webhooks impersonating another subscriber. If one subscriber's secret leaks (compromised endpoint), all subscribers are affected. Cannot rotate secrets per subscriber.

### Preferred Alternative
Call `useSecret($subscriber->webhook_secret)` per WebhookCall.

### Refactoring Strategy
1. Add `webhook_secret` column to subscriber model (encrypted)
2. Generate unique secret on subscriber creation
3. Pass via `useSecret()` on every dispatch
4. Remove default secret from config

### Related Rules
Use Per-Subscriber Signing Secrets (05-rules.md)

---

## Anti-Pattern 3: No Tags on Webhook Calls (No Categorization)

### Category
Maintainability | Observability

### Description
Dispatching webhooks without tags. Cannot filter, query, or monitor webhooks by event type or subscriber group.

### Why It Happens
Tags seem optional. Without them, the webhook still works.

### Warning Signs
- `WebhookCall::create()->url()->payload()->dispatch()` with no `->tag()`
- Cannot query webhooks by event type in database

### Why It Is Harmful
When debugging a subscriber complaint ("we didn't receive the payment webhook"), you can't easily find the relevant WebhookCall record. You must search by URL or payload content. Per-subscriber delivery metrics are impossible. Cannot selectively reprocess failed webhooks for a specific subscriber.

### Preferred Alternative
Add tags for event type, subscriber ID, and priority.

### Refactoring Strategy
1. Add `->tag('event:' . $event->type())` to all dispatches
2. Add `->tag('subscriber:' . $subscriber->id)`
3. Use tags in monitoring queries and reprocessing commands

### Related Rules
Use Tags for Subscriber-Grouped Notifications (05-rules.md)

---

## Anti-Pattern 4: No Cleanup of Old WebhookCall Records

### Category
Maintainability | Performance

### Description
No scheduled cleanup of old WebhookCall records. Table grows unboundedly.

### Why It Happens
The table usage is invisible. Developers notice only when queries slow down months later.

### Warning Signs
- WebhookCall table with 500K+ records
- Slow `SELECT` queries on WebhookCall
- No scheduled cleanup command

### Why It Is Harmful
Each webhook dispatch creates a record with payload and response data. 10,000 dispatches/day × 30 days = 300,000 records. After a year: 3.6M records. Queries slow, backups grow, storage costs rise. Database maintenance operations take longer.

### Preferred Alternative
Schedule daily cleanup of records older than retention period.

### Refactoring Strategy
1. Add `$schedule->call(function () { WebhookCall::where('created_at', '<', now()->subDays(30))->delete(); })->daily()`
2. Monitor table size trending
3. Archive to cold storage before delete if regulatory retention needed

### Related Rules
Implement Cleanup Strategy for Old WebhookCall Records (05-rules.md)

---

## Anti-Pattern 5: No Delivery Failure Monitoring

### Category
Observability | Reliability

### Description
Not listening to webhook delivery events (`WebhookCallFailedEvent`, `FinalWebhookCallFailedEvent`) for monitoring.

### Why It Happens
Developers dispatch webhooks and assume they arrive. No feedback loop is implemented.

### Warning Signs
- No event listeners for delivery events
- No metrics on success/failure ratio
- Delivery failures discovered only when subscriber complains

### Why It Is Harmful
A subscriber endpoint goes down. All webhooks fail delivery and exhaust retries. No notification is sent. The subscriber doesn't know about the outage. When the subscriber asks "why didn't we get the event?", there's no delivery failure data to investigate.

### Preferred Alternative
Listen to delivery events and monitor success/failure rates.

### Refactoring Strategy
1. Register listener for `WebhookCallFailedEvent`
2. Register listener for `FinalWebhookCallFailedEvent`
3. Increment metrics counters and send alerts
4. Track per-subscriber delivery success rate

### Related Rules
Monitor Delivery Failure Rates (05-rules.md)

---

## Anti-Pattern 6: No Subscriber URL Verification

### Category
Security

### Description
Accepting subscriber webhook URLs without sending a verification challenge. Any URL is stored and receives deliveries.

### Why It Happens
URL verification adds friction to subscriber onboarding. Developers skip it for speed.

### Warning Signs
- Subscriber URL stored immediately without verification
- No `WebhookVerificationService` in codebase
- Failed delivery to non-existent URLs accepted silently

### Why It Is Harmful
A typo'd URL (`https://example.cmo` instead of `.com`) sends webhooks to an unclaimed domain. If a malicious actor registers that domain, they receive all webhook payloads with sensitive data. Internal service URLs accepted as subscriber endpoints leak internal infrastructure information.

### Preferred Alternative
Send a verification challenge before accepting subscriber URLs.

### Refactoring Strategy
1. Generate a verification token
2. Send challenge request to subscriber URL
3. Only store URL after successful verification response
4. Schedule periodic re-verification

### Related Rules
Verify Subscriber URLs Before Adding to System (05-rules.md)
