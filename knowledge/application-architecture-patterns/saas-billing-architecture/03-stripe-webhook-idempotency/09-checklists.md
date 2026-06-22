# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** SaaS Billing Architecture
**Knowledge Unit:** Stripe Webhook Idempotency & Event Deduplication
**Generated:** 2026-06-22

---

# Quick Checklist

- [ ] Webhook signature verified via `Webhook::constructEvent()` on every incoming webhook
- [ ] StripeEvent model has unique index on `stripe_event_id`
- [ ] Webhook controller uses `firstOrCreate` within `DB::transaction()` for deduplication
- [ ] ProcessStripeEvent job implements `ShouldBeUnique`
- [ ] Webhook controller returns 200 within 2 seconds — processing is fully asynchronous
- [ ] All webhook handlers use `updateOrCreate`/`upsert` — never plain `create()`
- [ ] UniqueConstraintViolationException caught for concurrent race conditions
- [ ] Retry logic configured on ProcessStripeEvent (3 tries, 10s backoff)

---

# Architecture Checklist

- [ ] `stripe_events` table with columns: stripe_event_id (unique), type, payload (json), status, processed_at, error_message
- [ ] Indexes on status, type, and created_at for admin queries
- [ ] Dedicated `ProcessStripeEvent` job per event type (or pattern-match dispatch)
- [ ] One handler class per event type — not a monolithic switch statement
- [ ] Handler resolution via match() or a registry pattern
- [ ] ShouldBeUnique lock keyed by `stripe_event_id`
- [ ] Webhook controller in its own route group with no CSRF middleware

---

# Implementation Checklist

- [ ] Webhook signature verification with proper error handling for both SignatureVerificationException and UnexpectedValueException
- [ ] firstOrCreate for deduplication — only dispatch job when `wasRecentlyCreated` is true
- [ ] UniqueConstraintViolationException caught for concurrent webhooks
- [ ] ProcessStripeEvent checks for already-processed status before handling
- [ ] ProcessStripeEvent marks event as 'processing' before handler execution
- [ ] ProcessStripeEvent marks event as 'processed' on success, 'failed' on error
- [ ] Failed events re-throw exception to trigger Laravel's retry mechanism
- [ ] Unknown event types logged and skipped gracefully
- [ ] Webhook secret loaded from environment variable
- [ ] IP logging for failed signature verification attempts

---

# Testing Checklist

- [ ] Same webhook sent twice → only one subscription created (idempotency)
- [ ] Concurrent webhooks for same event → no duplicate processing (race condition)
- [ ] Invalid signature → 400 response, no event processing
- [ ] Malformed payload → 400 response, no event processing
- [ ] Webhook for unknown event type → logged, not processed
- [ ] Failed event retries up to 3 times
- [ ] Event marked as failed after exhausting retries
- [ ] Already-processed event (replay) → handler does nothing
- [ ] Handler failure on first attempt → retry succeeds on second attempt

---

# Production Readiness Checklist

- [ ] Webhook secret rotated with zero-downtime strategy (accept old + new during transition)
- [ ] Stripe webhook IP ranges optionally whitelisted for defense-in-depth
- [ ] Webhook endpoint excluded from CSRF protection
- [ ] Webhook endpoint excluded from rate limiting (Stripe bursts during invoice runs)
- [ ] Queue connection configured for low-latency job dispatch (Redis recommended)
- [ ] Monitoring: alert on webhook signature verification failure rate > 0
- [ ] Monitoring: alert on event processing failure rate > 5%
- [ ] Monitoring: alert on duplicate event rate anomaly (spike may indicate replay attack)
- [ ] StripeEvent table pruned on schedule (keep 90 days for processed events)
- [ ] StripeEvent table treated as sensitive data (contains PII in payloads)

---

# Final Approval Checklist

- [ ] Architecture requirements satisfied: signature verification, deduplication, async processing, handler isolation
- [ ] Security requirements satisfied: signature enforcement, secret protection, PII-aware storage
- [ ] Performance requirements satisfied: fast webhook response, async job processing, indexed queries
- [ ] Testing requirements satisfied: idempotency, concurrency, retry, error handling tested
- [ ] Anti-pattern checks passed: no synchronous processing, no create() in handlers, no monolithic handler
- [ ] Production readiness verified: secret rotation strategy, pruning, monitoring, queue capacity

---

# Related References

- AAP-SAAS-001 (Plan-Feature-Entitlement Model) — Entitlement cache invalidation triggered by webhooks
- AAP-SAAS-004 (Webhook Audit & Replay) — Audit log and replay mechanism built on StripeEvent
- AAP-SAAS-005 (Subscription Drift Reconciliation) — Reconciliation catches events missed by webhooks
- AAP-SAAS-006 (Billing Failure States) — Webhook handlers drive state machine transitions
