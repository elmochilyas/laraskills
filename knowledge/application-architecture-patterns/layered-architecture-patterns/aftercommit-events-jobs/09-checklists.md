# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** Layered Architecture Patterns
**Knowledge Unit:** After-Commit Events, Jobs & Side Effects
**Generated:** 2026-06-22

---

# Quick Checklist

- [ ] All queued jobs that depend on transaction data use `dispatchAfterCommit()` or `->afterCommit()`
- [ ] All events with queued listeners dispatched inside transactions use `->afterCommit()`
- [ ] No external API calls (Stripe, mail, HTTP) inside uncommitted transactions without compensating actions
- [ ] After-commit dispatched jobs have retry logic configured (`#[Tries]`, `#[Backoff]`)
- [ ] Compensating actions exist for after-commit external API call failures
- [ ] Cache invalidation deferred to after-commit or uses dedicated queue
- [ ] Multiple side effects orchestrated by a single after-commit job where ordering matters

---

# Architecture Checklist

- [ ] Code aware of transaction boundaries: `DB::transactionLevel()` checked when needed
- [ ] `dispatchAfterCommit()` used on all jobs dispatched inside transactions
- [ ] `event(...)->afterCommit()` used on all events with queued listeners inside transactions
- [ ] `DB::afterCommit()` used for inline callbacks that depend on committed state
- [ ] After-commit callbacks are lightweight — heavy work belongs in queued jobs
- [ ] Side effects ordered: data mutations first, notifications second, cache invalidation last
- [ ] `ShouldBeUnique` paired with `dispatchAfterCommit()` for idempotency-sensitive jobs
- [ ] `SerializesModels` used on jobs to store model IDs, not full serialized models

---

# Implementation Checklist

- [ ] `ProvisionTeamResources::dispatch($team)->afterCommit()` used in team creation flow
- [ ] `ProcessStripeEvent::dispatch($event)->afterCommit()` but ideally the controller dispatches after the transaction
- [ ] `event(new SubscriptionUpgraded($sub))->afterCommit()` used in plan swap actions
- [ ] `DB::afterCommit(fn () => Cache::tags(['orders'])->flush())` for post-commit cache work
- [ ] Stripe API calls placed in `DB::afterCommit()` with try-catch compensating actions
- [ ] Mail notifications dispatched as queued jobs after commit, not sent inline
- [ ] Jobs check `$this->model->fresh()->exists()` or similar before processing

---

# Testing Checklist

- [ ] Job dispatched inside a rolled-back transaction is never processed
- [ ] Job dispatched after commit is processed after the transaction succeeds
- [ ] After-commit job retries on "record not found" error
- [ ] Compensating action fires when external API call fails after commit
- [ ] Multiple after-commit callbacks do not have ordering-dependent failures
- [ ] Event listeners with ShouldQueue are deferred when event uses afterCommit()
- [ ] Synchronous listeners fire immediately even with afterCommit() — verified expected behavior

---

# Production Readiness Checklist

- [ ] Queue connection uses Redis for low-latency dispatch
- [ ] Horizon configured with dedicated queue for after-commit billing jobs
- [ ] Retry backoff aligned with expected write propagation time (replication lag)
- [ ] Monitoring: alert on jobs failing with "record not found" after commit
- [ ] Monitoring: alert on jobs exhausting all retries
- [ ] Failed job handling: dead-letter queue or failed_jobs table monitored
- [ ] Code review gate: flag all `dispatch()` inside `DB::transaction()` without `afterCommit()`
- [ ] Architecture test: assert no Stripe/HTTP/mail calls inside uncommitted transactions

---

# Final Approval Checklist

- [ ] Architecture requirements satisfied: after-commit for all external side effects, compensating actions
- [ ] Security requirements satisfied: no sensitive data in job payloads, `SerializesModels` used
- [ ] Performance requirements satisfied: lightweight callbacks, queued heavy work
- [ ] Testing requirements satisfied: rollback scenarios, retry behavior, race condition gap
- [ ] Anti-pattern checks passed: no fire-and-forget in transactions, no external APIs inside transactions
- [ ] Production readiness verified: retry logic, monitoring, dead-letter handling

---

# Related References

- BAD-ES-001 (Laravel Events vs Event Sourcing) — Distinguishing domain events from lifecycle hooks
- AAP-SAAS-003 (Stripe Webhook Idempotency) — Webhook processing uses after-commit dispatch
- AAP-SAAS-002 (Cashier BillingGateway Wrapper) — Gateway calls happen after commit
