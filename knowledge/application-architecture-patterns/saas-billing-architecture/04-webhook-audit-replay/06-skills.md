# Skill: Implement Webhook Audit Log, Replay & Reconciliation

## Purpose

Design and implement the webhook audit log, event replay capability, and scheduled reconciliation system that together form the safety net for SaaS billing operations — ensuring no billing event is lost, every state change is traceable, and the system can self-heal from missed webhooks.

## When To Use

- Every production SaaS with Stripe billing (this is mandatory for operational maturity)
- When billing accuracy is critical and errors must be traceable and reversible
- When customer support needs tools to diagnose and fix billing state issues
- When compliance requires an audit trail of billing state changes (SOC2, PCI-DSS)
- When operational staff occasionally make changes directly in the Stripe Dashboard

## When NOT To Use

- Trivially small operations where a single developer handles all billing issues manually — but even then, the audit log alone is worth the implementation effort
- Development environments where full reconciliation adds unnecessary load (use dry-run mode instead)

## Prerequisites

- Stripe webhook idempotency and event deduplication in place
- StripeEvent model with status tracking (pending, processed, failed)
- All webhook handlers are idempotent (use updateOrCreate/upsert)
- BillingGateway wrapper pattern in place
- Laravel Scheduler configured for recurring reconciliation jobs

## Inputs

- StripeEvent table with payload storage, status tracking, and retry count
- StripeEventReplayService for resetting event state and re-dispatching
- Stripe API access via BillingGateway for reconciliation comparisons
- Drift alert thresholds and notification channels

## Workflow

1. Ensure StripeEvent records every incoming webhook with full raw payload (including duplicates)
2. Implement append-only audit log: only `status`, `processed_at`, `error_message`, `retry_count` may be updated
3. Create `StripeEventReplayService` with methods: `replay(single)`, `replayAllFailed()`, `replayByType(type, since)`
4. Build Artisan commands: `billing:replay` for support-driven replay operations
5. Build admin UI endpoint for authorized replay with confirmation and audit logging
6. Implement `billing:reconcile` command that compares local subscription state against Stripe API
7. Rate-limit reconciliation Stripe API calls (50ms delay between calls, ~20 req/sec live mode)
8. Log and alert on detected drift; auto-repair safe fields (dates, status) only
9. Schedule reconciliation to run hourly with `withoutOverlapping` on one server
10. Schedule StripeEvent pruning (90-day retention for processed events)

## Validation Checklist

- [ ] StripeEvent table records every incoming webhook, including duplicates
- [ ] Audit log is append-only — payload and stripe_event_id are never mutated after creation
- [ ] StripeEventReplayService resets event to pending status and re-dispatches the processing job
- [ ] All webhook handlers verified as idempotent before enabling replay
- [ ] `billing:replay` Artisan command works for single events, all-failed, and by-type
- [ ] Admin replay endpoint secured with authorization and audit logging
- [ ] `billing:reconcile` command compares local state against Stripe API for all active subscriptions
- [ ] Drift detection covers: status, period dates, trial dates, plan/price, cancel_at_period_end
- [ ] Date comparisons use 5-second clock skew tolerance
- [ ] Auto-repair only fixes safe fields (status, period dates) — never plan changes
- [ ] Critical drift (plan change, orphaned subscription) triggers alert and creates DriftAlert record
- [ ] Reconciliation rate-limited to avoid Stripe 429 errors
- [ ] Scheduled reconciliation and pruning registered in Laravel Scheduler
- [ ] Replay and repair operations logged with before/after values and actor identity

## Common Failures

- Replay without verifying idempotency of all handlers (replaying a non-idempotent handler creates duplicates)
- Auto-repairing plan changes without human review (switches customer pricing without consent)
- Reconciliation without rate limiting (Stripe 429 errors cause reconciliation to fail mid-batch)
- Not pruning the audit log (StripeEvent table grows to millions of rows, queries degrade)
- Zero clock skew tolerance on date comparisons (trivial date differences flagged as drift)
- Using reconciliation as the primary sync mechanism instead of fixing webhook processing
- Silently repairing drift without logging before/after values (cannot audit what changed)

## Decision Points

- Auto-repair scope: which fields are safe to auto-repair vs require human review?
- Reconciliation frequency: hourly vs daily vs continuous?
- Drift alerting: alert on every drift vs alert on drift rate threshold vs alert on critical only?
- StripeEvent retention: 90 days vs 180 days vs archive to cold storage for compliance?
- Reconciliation concurrency: single-server vs sharded by team ID ranges?

## Performance Considerations

- Reconciliation is O(n) where n = active subscriptions. At 20 calls/sec, 10,000 subscriptions take ~8 minutes. Schedule hourly.
- The StripeEvent table grows unbounded. Schedule a prune command for processed events older than 90 days.
- Replay operations reset status and re-dispatch — they don't reprocess in the request. Response is fast.
- Audit log queries for admin UI must be paginated and filterable by type/date to avoid full-table scans.
- Use `withoutOverlapping` on scheduled reconciliation to prevent concurrent runs.
- For 50k+ active subscriptions, shard reconciliation by team ID ranges.

## Security Considerations

- Admin replay endpoints must require authentication AND authorization (admin/support role only)
- Reconciliation output may contain internal pricing data — do not email raw output to unprivileged addresses
- StripeEvent payloads contain PII (customer email, billing address) — treat the table as sensitive data
- Consider field-level encryption or full-payload encryption at rest for PII columns in StripeEvent
- Replay audit trail must record who initiated the replay (actor identity)
- Drift alert channels must be access-controlled (dedicated Slack channel, ops email list)
- Reconciliation must never push local state corrections to Stripe (only the reverse)

## Related Rules

- Rule 1: The Audit Log Is Append-Only — Never Mutate Event Payloads
- Rule 2: Replay Must Be Safe — All Handlers Must Be Idempotent Before Enabling Replay
- Rule 3: Auto-Repair Only Safe Fields — Never Auto-Repair Plan Changes
- Rule 4: Log Every Reconciliation Repair With Before/After State
- Rule 5: Rate-Limit Reconciliation API Calls to Avoid Stripe 429 Errors

## Related Skills

- Implement Stripe Webhook Idempotency & Event Deduplication
- Detect and Repair Subscription Drift
- Implement Cashier + BillingGateway Wrapper Pattern

## Success Criteria

- Every Stripe webhook since system inception is recorded and queryable in StripeEvent
- Failed events can be replayed from the admin UI with one click and full audit trail
- Reconciliation detects drift within one scheduling cycle (hourly)
- Auto-repair corrects safe drift without human intervention while alerting on critical drift
- Ops team receives actionable alerts for drift requiring human review, not noise
