# Skill: Implement Stripe Webhook Idempotency & Event Deduplication

## Purpose

Design and implement idempotent Stripe webhook processing with database-level event deduplication, concurrent webhook race condition handling, and asynchronous processing via queued jobs to ensure billing state integrity.

## When To Use

- Every production SaaS application that processes Stripe webhooks (this is mandatory, not optional)
- When billing state changes must be accurately reflected in the application without duplicates
- When duplicate webhook processing could cause double-charging, double-provisioning, or data corruption
- When webhook delivery is at-least-once and retries are expected

## When NOT To Use

- Never skip this. Idempotency is not optional for production billing. Even development/staging environments benefit from deduplication to avoid confusing state during testing.

## Prerequisites

- Laravel Cashier installed and configured
- Stripe webhook endpoint configured and receiving events
- Laravel Queues configured (Redis recommended)
- BillingGateway wrapper pattern in place

## Inputs

- Stripe webhook signing secret from Stripe Dashboard
- StripeEvent model migration with unique index on `stripe_event_id`
- Event handler classes for each processed Stripe event type
- Horizon or queue worker infrastructure for job processing

## Workflow

1. Create the `stripe_events` table with a unique index on `stripe_event_id` and JSON column for payloads
2. Create the StripeEvent model with status constants (pending, processing, processed, failed, skipped)
3. Implement the webhook controller: verify signature → deduplicate via firstOrCreate → dispatch job → return 200
4. Catch `UniqueConstraintViolationException` as the final guard against concurrent race conditions
5. Implement `ProcessStripeEvent` job with `ShouldBeUnique` contract and `uniqueId()` returning the Stripe event ID
6. Implement individual handler classes per event type (SubscriptionCreated, SubscriptionUpdated, InvoicePaid, etc.)
7. Ensure every handler uses `updateOrCreate`/`upsert` operations — never raw `create()`
8. Add retry logic (3 attempts with exponential backoff) and failure logging

## Validation Checklist

- [ ] Stripe webhook signature verified before any processing using `Webhook::constructEvent()`
- [ ] `stripe_events` table has unique index on `stripe_event_id`
- [ ] Webhook controller uses `firstOrCreate` within a `DB::transaction()` for deduplication
- [ ] `UniqueConstraintViolationException` is caught for concurrent race conditions
- [ ] `ProcessStripeEvent` job implements `ShouldBeUnique` with `uniqueId()` returning the Stripe event ID
- [ ] All handler classes use `updateOrCreate`/`upsert` (never `create()`)
- [ ] Webhook controller returns 200 for both new and duplicate events
- [ ] Webhook controller responds within 2 seconds (all processing is async)
- [ ] Test: same webhook sent twice → only one subscription/customer created
- [ ] Test: concurrent webhooks for same event → no duplicate processing
- [ ] Test: invalid signature → 400 response
- [ ] Test: unhandled event type → logged and gracefully skipped
- [ ] Retry logic: failed events retry up to 3 times with exponential backoff
- [ ] Failed events logged with error message and Stripe event context

## Common Failures

- Processing webhooks synchronously instead of dispatching a queued job (Stripe timeout → retries → duplicates)
- Not having a unique database constraint on `stripe_event_id` (race conditions pass through application-level checks)
- Using `create()` instead of `updateOrCreate()` in handlers (not idempotent — creates duplicates on retry)
- Forgetting `implements ShouldBeUnique` on the processing job (two workers pick up the same event simultaneously)
- Skipping signature verification entirely ("we trust the webhook endpoint")
- Not catching `UniqueConstraintViolationException` (database error becomes a 500 instead of an idempotent 200)
- No retry logic on failed events (transient failures leave events permanently unprocessed)
- Hardcoding the webhook signing secret in code instead of using `config('cashier.webhook.secret')`

## Decision Points

- Deduplication guard layering: database constraint only vs database + Redis lock + ShouldBeUnique?
- Job retry strategy: fixed backoff (10s) vs exponential backoff (10, 30, 90)?
- Handler resolution: switch statement in job vs handler registry with auto-discovery?
- StripeEvent retention: prune after 90 days vs archive to cold storage vs keep forever?

## Performance Considerations

- Webhook endpoint must return 200 within 20 seconds (Stripe's timeout). Move all processing to a queued job.
- Use Redis queue driver for low-latency job dispatch
- The unique index on `stripe_event_id` is a B-tree lookup in microseconds
- Periodically prune old StripeEvent records (90+ days) to keep the table lean
- For high-volume merchants receiving thousands of webhooks per minute, consider batching — but the dedup pattern already handles this efficiently
- The `ShouldBeUnique` contract uses a Redis lock with negligible overhead

## Security Considerations

- Always verify webhook signatures using `Webhook::constructEvent()` — unverified webhooks allow attackers to forge billing events
- Rotate webhook signing secrets periodically with zero-downtime rotation (accept old + new secrets during transition)
- Webhook payloads may contain PII (customer email, billing address) — treat the StripeEvent table as sensitive data
- Never echo raw webhook payloads in error responses or debug output
- Consider restricting inbound webhooks to Stripe's published IP ranges if your network setup allows
- Rate-limit the webhook endpoint to protect against abuse (separate from Stripe's own retry logic)

## Related Rules

- Rule 1: Always Verify Webhook Signatures Before Processing
- Rule 2: Deduplicate at the Database Level Using a Unique Constraint
- Rule 3: Return 200 Quickly, Process Asynchronously via Queued Job
- Rule 4: All Webhook Handlers Must Use Idempotent Operations (updateOrCreate/upsert)
- Rule 5: Use ShouldBeUnique on the Processing Job as Secondary Guard

## Related Skills

- Implement Cashier + BillingGateway Wrapper Pattern
- Implement Webhook Audit Log, Replay & Reconciliation
- Detect and Repair Subscription Drift

## Success Criteria

- Sending the same Stripe webhook twice produces exactly one state change (testable)
- Sending concurrent webhooks for the same event does not produce duplicate records (testable)
- Webhook endpoint responds within 500ms regardless of processing complexity
- Every incoming webhook is recorded in the StripeEvent table (including duplicates)
- Webhook processing survives worker restarts (job retry picks up failed events)
