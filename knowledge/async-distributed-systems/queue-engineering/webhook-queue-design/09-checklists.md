# Metadata
**Domain:** Async & Distributed Systems
**Subdomain:** Queue Engineering / Billing Webhook Queues
**Knowledge Unit:** Webhook Queue Design for Billing Systems
**Generated:** 2026-06-22

# Quick Checklist (10-20 derived items)
- [ ] Webhook signature validated via `Stripe\Webhook::constructEvent()` before any processing
- [ ] Raw webhook payload persisted to `stripe_events` table before job dispatch
- [ ] Webhook job dispatched with `afterCommit()` to ensure event record exists
- [ ] Idempotency enforced via `ShouldBeUnique` or `StripeEvent.processed_at` check
- [ ] Dedicated `webhooks` queue configured with 1-2 workers
- [ ] `WithoutOverlapping` serializes processing per team/subscription
- [ ] `maxExceptions` set to 3-5 with exponential backoff
- [ ] `failed()` handler writes to dead-letter table for manual replay
- [ ] Stripe webhook secret stored in environment, never in code

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **Webhook controller**: Validate signature, persist raw payload, dispatch job. No business logic.
- **Webhook job**: Check idempotency, apply business logic, mark as processed. Retry on transient failure.
- **Queue topology**: `webhooks` queue (1-2 workers) → `billing` queue → `notifications` queue. Never combined.
- **Idempotency layer**: `StripeEvent` model with `processed_at` column as gate. `ShouldBeUnique` as backup.
- **Dead-letter table**: Separate from `failed_jobs` — human-readable JSON payload for manual replay.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] `StripeWebhookController`: signature validation → persist → dispatch → 200 response
- [ ] `StripeEvent` model: `stripe_event_id` (unique), `type`, `payload` (JSON), `processed_at`, `status`
- [ ] `ProcessStripeWebhook` job: `#[Tries(5)]`, `#[Backoff([...])]`, `ShouldBeUnique`
- [ ] Job `middleware()`: `WithoutOverlapping` keyed on team/subscription ID
- [ ] Job `failed()`: write to `DeadLetter` table with full context
- [ ] `DeadLetter` model: `source`, `source_id`, `error`, `payload` (JSON), `attempts`
- [ ] Horizon supervisor: `webhooks-supervisor` with `maxProcesses=1-2`, `balance=simple`

# Performance Checklist
- Single webhook worker at 500ms per webhook handles ~120/minute. Add workers if volume exceeds this.
- `WithoutOverlapping` uses Redis cache locks — ensure Redis is fast and reliable.
- `stripe_events` table grows unboundedly: partition by month or archive events older than 90 days.
- Webhook redelivery backlog: if queue depth grows, workers can't keep up — add workers or optimize handlers.

# Security Checklist
- [ ] Stripe webhook signature validated on every request — never process unverified payloads
- [ ] `STRIPE_WEBHOOK_SECRET` stored in environment variable, separate keys for test/production
- [ ] `stripe_events` table treated as sensitive data (contains customer IDs, amounts, payment details)
- [ ] Webhook processing errors never exposed to end users — operational concern, not user-facing

# Reliability Checklist
- [ ] Idempotency enforced at every level: unique constraint on `stripe_event_id`, `processed_at` check, `ShouldBeUnique`
- [ ] Retry with backoff: `[5, 15, 30, 60, 120]` — gives Stripe time to recover from transient issues
- [ ] `maxExceptions(5)`: after 5 failures, stop retrying and alert a human
- [ ] Dead-letter table enables manual replay without direct database access
- [ ] Subscription reconciliation job runs daily to catch drift from webhook failures

# Testing Checklist
- [ ] Test webhook signature validation rejects invalid signatures (400 response)
- [ ] Test duplicate webhook is idempotent (200 response, no state change)
- [ ] Test webhook processing retries on transient failure
- [ ] Test `failed()` handler writes to dead-letter table
- [ ] Test `WithoutOverlapping` serializes concurrent webhooks for same team
- [ ] Test webhook replay from dead-letter table works correctly

# Maintainability Checklist
- [ ] Webhook controller, job, and event model are in a dedicated `Modules/Billing` or `Billing` namespace
- [ ] `StripeEvent` payload column uses JSON cast for queryability
- [ ] Dead-letter table has indexes on `source`, `source_id`, `created_at` for support queries
- [ ] Stripe webhook secret rotation procedure is documented

# Anti-Pattern Prevention Checklist
- [ ] Prevent: Synchronous webhook processing in controller (timeout risk, no retry)
- [ ] Prevent: Fire-and-forget without persisting raw payload (payload lost on failure)
- [ ] Prevent: Single queue for webhooks, emails, and reports (contention blocks billing)
- [ ] Prevent: No retry limit (infinite retries on permanent failures)
- [ ] Prevent: Global rate limiting on all webhook events equally

# Production Readiness Checklist
- [ ] Dedicated `webhooks` queue with 1-2 workers running in production
- [ ] Horizon supervisor `maxProcesses=1-2`, `balance=simple` for webhooks
- [ ] `stripe_events` table has unique index on `stripe_event_id`
- [ ] Dead-letter table exists and is monitored
- [ ] Webhook processing alerts configured: failure rate > 1%, P95 latency > 10s
- [ ] Stripe webhook secret set in production environment
- [ ] Webhook endpoint URL registered in Stripe dashboard matches production
- [ ] Failed webhook replay procedure documented and tested

# Final Approval Checklist
- [ ] Architecture review completed
- [ ] Security review completed (signature validation, secret storage, error exposure)
- [ ] Performance impact assessed (worker capacity vs. webhook volume)
- [ ] Testing coverage adequate (signature, idempotency, retry, dead-letter, replay)
- [ ] Anti-patterns reviewed and prevented
- [ ] Production readiness confirmed

# Related Rules/Skills/Trees/Anti-Patterns
## Rules
- Always Persist Raw Webhook Payload Before Processing
- Never Process Webhooks Synchronously in the Controller
- Enforce Idempotency on Every Webhook Job
- Serialize Webhook Processing Per Entity with WithoutOverlapping
- Set a Finite Retry Limit with maxExceptions and a failed() Handler
## Anti-Patterns
- Synchronous webhook processing
- Single queue for everything
- Fire-and-forget webhook processing
- No dead-letter table
- Global rate limiting on webhook processing
