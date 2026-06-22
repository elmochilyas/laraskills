# Skill: Webhook Queue Design for Billing Systems

## Purpose
Design and implement a dedicated, idempotent, retry-safe webhook processing queue for Stripe billing events. Persist raw payloads before processing, enforce idempotency to handle Stripe's at-least-once delivery, serialize processing per entity with `WithoutOverlapping`, and implement dead-letter tables for permanent failures.

## When To Use
- Building a Laravel SaaS application that processes Stripe webhooks for subscription state
- When webhook volume is high enough that synchronous processing risks Stripe timeouts
- When webhooks can arrive out of order and need serialized processing per team/subscription
- When you need guaranteed exactly-once processing despite Stripe's at-least-once delivery
- When you need manual replay of failed webhooks from a dead-letter queue

## When NOT To Use
- For fewer than 10 webhooks per hour (a single default queue is sufficient)
- For non-billing webhooks with no state-mutation risk (analytics-only events)
- When not using Horizon (basic `queue:work --queue=webhooks` is the fallback, but loses Horizon's monitoring)
- During initial prototyping before webhook handling is needed

## Prerequisites
- Understanding of Stripe webhook signature verification (`Stripe\Webhook::constructEvent`)
- Familiarity with Laravel queue jobs, `ShouldQueue`, `ShouldBeUnique`
- Knowledge of `WithoutOverlapping` middleware for per-entity serialization
- Understanding of `afterCommit()` for deferring job dispatch until the webhook record is persisted
- Familiarity with Horizon supervisor configuration

## Inputs
- The expected webhook volume (events per minute at peak)
- The Stripe event types being handled (`invoice.payment_succeeded`, `customer.subscription.deleted`, etc.)
- Whether webhooks can arrive out of order for the same entity
- Whether read replicas are used (affects retry requirements)
- The concurrency requirements (can multiple webhooks for different teams process in parallel?)

## Workflow
1. **Create a `stripe_events` table** — Store `stripe_event_id` (unique), `type`, `payload` (JSON), `object_id`, `livemode`, `status`, `processed_at`, `processing_started_at`, `error`. This is the idempotency gate and the replay source.
2. **Implement the webhook controller** — Validate Stripe signature, `firstOrCreate` the `StripeEvent` record, return 200 immediately. If the event was already seen (`wasRecentlyCreated` is false), return `duplicate` status. Dispatch the processing job with `->afterCommit()`.
3. **Create the processing job** — Implement `ShouldQueue` with `#[Queue('webhooks')]`, `#[Tries(5)]`, `#[Backoff([5, 15, 30, 60, 120])]`. In `handle()`: fetch the `StripeEvent`, check `processed_at` for idempotency, apply business logic, mark as processed.
4. **Add `WithoutOverlapping` middleware** — Key on the team or subscription ID extracted from the event payload. This prevents two webhooks for the same subscription from processing simultaneously.
5. **Implement a `failed()` handler** — Write to a `dead_letters` table with the `stripe_event_id`, error message, and payload. Log a critical alert. This is the manual replay source for permanent failures.
6. **Configure Horizon supervisor** — `webhooks-supervisor` with `maxProcesses=1` or `2`, `balance=simple`, `tries=5`, `timeout=300`. Use `balance=simple` to ensure webhooks always have a dedicated worker.
7. **Test idempotency** — Dispatch the same webhook event twice and verify the second dispatch is a no-op (returns early due to `processed_at` being set).
8. **Test the dead-letter flow** — Force a permanent failure (missing customer record) and verify the `failed()` handler writes to the dead-letter table.

## Validation Checklist
- [ ] Webhook signature validated before any processing (`Stripe\Webhook::constructEvent`)
- [ ] Raw payload persisted to `stripe_events` table before job dispatch
- [ ] Idempotency enforced via `ShouldBeUnique` or `StripeEvent.processed_at` check
- [ ] Webhook job dispatched with `->afterCommit()` from the controller
- [ ] `#[Queue('webhooks')]` attribute on the job class
- [ ] `#[Tries(5)]` and `#[Backoff]` configured on the job
- [ ] `WithoutOverlapping` middleware serializes processing per team/subscription
- [ ] `failed()` handler writes to a dead-letter table for manual replay
- [ ] Horizon `webhooks-supervisor` configured with `maxProcesses=1-2` and `balance=simple`
- [ ] Stripe webhook secret stored in environment variable, not in code

## Common Failures
- Processing webhooks synchronously in the controller, causing Stripe timeouts
- No idempotency check, causing duplicate invoices on Stripe redelivery
- Webhooks on the default queue, blocked by notification backlogs
- No dead-letter table, making permanent failures invisible
- `tries=0` (infinite) on webhook jobs, wasting workers on permanent failures
- Not persisting the raw payload, making replay impossible after job failure

## Decision Points
- **Is the webhook volume high enough for a dedicated queue?** — Below 10/hour, the default queue is fine. Above that, isolate webhooks.
- **Should processing be serialized per entity?** — If webhooks for the same subscription can arrive simultaneously, use `WithoutOverlapping`.
- **What's the retry limit?** — 5 attempts with exponential backoff. Not 0 (infinite), not 1 (too few for transient Stripe errors).
- **Should the job use `ShouldBeUnique` or a `StripeEvent` check?** — `ShouldBeUnique` prevents duplicate dispatch; the `processed_at` check prevents duplicate processing. Use both for defense in depth.

## Performance Considerations
- A single worker processing at 500ms/webhook handles ~120/minute. If volume exceeds this, add workers with `WithoutOverlapping` per entity.
- `WithoutOverlapping` uses cache locks — ensure Redis is fast and reliable.
- The `stripe_events` table grows with every webhook. Plan for partitioning by month or archiving old events.
- Webhook redelivery backlog: if processing falls behind, Stripe retries with increasing delays. Monitor queue depth.

## Security Considerations
- Always validate Stripe webhook signatures. Never process an unverified webhook.
- The webhook secret (`STRIPE_WEBHOOK_SECRET`) must be in the environment, never in code.
- The `stripe_events` table contains sensitive billing data — treat as sensitive data storage.
- Don't expose webhook processing status to end users. Webhook failures are operational concerns.

## Related Rules (from 05-rules.md)
- Always Persist Raw Webhook Payload Before Processing
- Never Process Webhooks Synchronously in the Controller
- Enforce Idempotency on Every Webhook Job
- Serialize Webhook Processing Per Entity with WithoutOverlapping
- Set a Finite Retry Limit with maxExceptions and a failed() Handler

## Related Skills
- Billing queue topology (separating webhooks from billing and notifications)
- Queue deployment safety (worker lifecycle during deploys)
- After-commit events and jobs (persisting webhook before dispatching processing)
- Billing webhook metrics (monitoring webhook lifecycle)

## Success Criteria
- No webhook is processed synchronously in the controller
- No webhook is lost (raw payload always persisted before processing)
- No webhook is processed twice (idempotency enforced at dispatch and processing levels)
- No webhook for the same entity processes concurrently (`WithoutOverlapping`)
- Permanent failures are visible in a dead-letter table for manual replay
- Webhook processing never blocks or is blocked by notification or report jobs
