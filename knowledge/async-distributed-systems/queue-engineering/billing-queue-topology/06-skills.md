# Skill: Billing Queue Topology and Separation by Concern

## Purpose
Design and configure a calibrated queue topology for Laravel SaaS billing systems that separates critical jobs (webhooks, billing operations) from non-critical work (notifications, reports) based on retry behavior, latency requirements, and operational priority. Calibrate the number of queues to application scale — avoid both premature splitting and dangerous single-queue setups.

## When To Use
- Configuring Horizon for a SaaS billing application with Stripe webhooks
- When notification backlogs are delaying billing operations
- When different job types need different retry policies or timeouts
- When planning queue infrastructure for a growing SaaS platform
- When on-call engineers need to know which queue failures are revenue-impacting

## When NOT To Use
- For applications with fewer than 100 jobs/day (a single `default` queue suffices)
- When all jobs share the same retry behavior, latency requirements, and priority
- For non-billing applications where no job type is critically more important than others
- When creating queues for organizational aesthetics without operational justification

## Prerequisites
- Understanding of Laravel queues, `onQueue()`, and `#[Queue]` attribute
- Familiarity with Horizon supervisor configuration (`balance`, `maxProcesses`, `tries`)
- Knowledge of `balance=simple` vs `balance=auto` and when to use each
- Understanding of the SaaS billing job landscape (webhooks, billing, notifications, default)

## Inputs
- The job types in the application (webhooks, billing, notifications, reports, etc.)
- The volume of each job type (jobs/day at peak)
- The retry behavior needed per job type (webhooks: 5 tries, notifications: 3 tries)
- The latency requirements per job type (webhooks: <5s, reports: can wait minutes)
- The operational priority per job type (billing failures wake on-call, notification failures don't)

## Workflow
1. **Inventory all job types** — List every `ShouldQueue` job class in the application. Categorize by concern: webhook processing, billing operations, notifications, reports, default/miscellaneous.
2. **Assess volume per category** — Estimate jobs/day at peak for each category. Low volume (<100/day) may not justify a dedicated queue. High volume (>1000/day) almost certainly does.
3. **Determine retry behavior per category** — Webhooks need 5 tries (transient Stripe failures). Notifications need 3 tries (invalid email is permanent). Billing needs 5 tries (Stripe API delays). Reports need 3 tries.
4. **Determine latency requirements** — Webhooks must process in <5 seconds. Notifications can wait seconds to minutes. Reports can wait minutes to hours.
5. **Determine operational priority** — Webhook and billing failures are revenue-impacting (P1 alert). Notification failures are non-critical (warning). This determines on-call expectations.
6. **Calibrate the number of queues** — Start with `webhooks` + `default`. Add `billing` when billing jobs contend with default jobs. Add `notifications` when notification backlogs delay other work. Add `critical` only for truly P0 operations.
7. **Configure Horizon supervisors** — Each queue gets a supervisor with `maxProcesses`, `tries`, `timeout`, and `balance` appropriate to its job type. Critical queues use `balance=simple`; non-critical use `balance=auto`.
8. **Add `#[Queue]` attributes to job classes** — Declare the queue on the class, not just at dispatch time. This prevents misrouting when jobs are dispatched from multiple locations.
9. **Monitor per-queue depth** — Track queue depth per queue, not just aggregate. Alert on webhooks queue depth > 10, billing queue depth > 50.

## Validation Checklist
- [ ] `webhooks` queue exists with dedicated 1-2 workers and `balance=simple`
- [ ] `billing` queue exists for invoice generation, subscription sync, reconciliation
- [ ] `notifications` queue exists, separate from webhooks and billing
- [ ] `default` queue exists for miscellaneous jobs
- [ ] `#[Queue]` attribute present on all job classes declaring their queue
- [ ] Per-queue retry configuration matches job type characteristics
- [ ] Horizon supervisor `balance` is `simple` or `false` for critical queues
- [ ] Queue depth monitoring configured per queue (not just aggregate)
- [ ] Dev/staging uses reduced worker configuration
- [ ] Queue topology calibrated to application scale (not over-engineered, not under-isolated)

## Common Failures
- Creating 5 queues for 10 jobs/day — premature optimization with zero benefit
- Putting webhooks on the default queue — notification backlogs delay billing
- Using `balance=auto` for the webhooks queue — workers migrate away during notification floods
- Same retry config across all queues — webhooks under-retry, notifications over-retry
- No per-queue monitoring — aggregate stats hide that one queue is backing up

## Decision Points
- **How many queues?** — Start with 2 (webhooks + default). Add when contention is observed.
- **Which balance strategy?** — `simple` or `false` for critical queues (webhooks, billing). `auto` for non-critical (notifications, default).
- **How many workers per queue?** — Webhooks: 1-2. Billing: 1-3. Notifications: 2-5. Default: 3-10. Scale with volume.
- **Same or different retry config?** — Different. Each job type has different failure modes and optimal retry strategies.

## Performance Considerations
- Each Horizon worker consumes ~20-50MB RAM. A 4-queue topology with 15 total workers uses ~300-750MB RAM.
- Idle workers consume CPU for polling. Use `sleep=3` or higher on low-traffic queues.
- Redis memory: each queued job consumes Redis memory. Monitor for backlogs.
- `balance=auto` is efficient but can starve critical queues during floods. `balance=simple` ensures critical queues always have workers.

## Security Considerations
- Queue names are visible in Horizon dashboard — don't embed sensitive information
- Horizon dashboard must be behind authentication in production (`Horizon::auth()`)
- Redis connection for queues should use a dedicated instance or separate database number in production
- Failed jobs may contain serialized model data — restrict access to the failed_jobs table

## Related Rules (from 05-rules.md)
- Separate Webhooks Queue from Notifications Queue
- Declare Queue in Job Class via Attribute, Not Only at Dispatch Time
- Use balance=simple or balance=false for Critical Queues
- Calibrate Queue Topology to Application Scale
- Per-Queue Retry Configuration Must Match Job Type Characteristics

## Related Skills
- Webhook queue design (dedicated webhook queue with idempotency)
- Queue deployment safety (worker lifecycle during deploys)
- After-commit events and jobs (deferring dispatch until transaction commits)

## Success Criteria
- Webhook processing is never delayed by notification or report backlogs
- Each queue has retry configuration appropriate to its job types
- Critical queues always have dedicated workers (`balance=simple`)
- Queue topology is calibrated to scale — not over-engineered for small apps, not under-isolated for billing apps
- Per-queue monitoring detects backlogs before they become incidents
