# Skill: Configure Queue Priority via Multiple Queue Names

## Purpose
Set up multiple named queues with priority ordering so user-facing jobs process before bulk work, without creating separate infrastructure.

## When To Use
When different job types have different latency requirements. Typically 2-3 priority tiers (critical, default, bulk).

## When NOT To Use
SQS (uses separate URLs, not comma-separated queue names); more than 3 priority tiers (diminishing returns); applications with uniformly fast jobs.

## Prerequisites
- Queue connection configured
- Understanding of job latency requirements
- Worker process supervisor configured

## Inputs
- Priority tier names (e.g., critical, default, bulk)
- Worker count per tier
- Horizon supervisor config (if using Horizon)

## Workflow
1. Define 2-3 priority tiers based on user-facing latency sensitivity
2. Route jobs to tiers: `ProcessOrder::dispatch($order)->onQueue('critical')`
3. Configure worker with priority ordering: `--queue=critical,default,bulk`
4. For Horizon: separate supervisors per tier with independent min/max processes
5. For SQS: separate worker processes per queue URL (no comma-separated queues)
6. Monitor oldest-job-age per queue, not aggregate
7. Alert on per-queue staleness thresholds

## Validation Checklist
- [ ] Priority tiers named by workload characteristic, not job class
- [ ] Worker `--queue` uses correct priority order (highest first)
- [ ] SQS: separate workers per queue URL
- [ ] Horizon: separate supervisors per tier
- [ ] Monitoring per-queue oldest-job-age
- [ ] No more than 3 priority tiers

## Common Failures
- SQS with comma-separated `--queue` — only first queue used
- Assuming preemptive priority — current low-pri job not interrupted
- Same workers for CPU-intensive and latency-sensitive jobs — heavy jobs block light ones
- More than 3 tiers — operational complexity outweighs benefit

## Decision Points
- 2-3 tiers is optimal — critical (password resets, OTPs), default (notifications), bulk (reports)
- Use separate Horizon supervisors per tier for guaranteed minimum throughput

## Performance Considerations
- Polling overhead: each iteration checks all queues — empty high-pri queues add zero latency
- At high throughput, each tier needs enough workers to prevent backlog

## Security Considerations
- Critical queue jobs (password resets, payment callbacks) must not be delayed by bulk work
- Separate supervisors prevent resource starvation across tiers

## Related Rules
- Rule 1: prioritize-by-latency-sensitivity
- Rule 2: no-comma-queue-for-sqs
- Rule 3: separate-supervisors-per-tier
- Rule 4: monitor-oldest-job-per-queue
- Rule 5: limit-priority-tiers

## Related Skills
- Configure Queue Connections vs Queues
- Configure Horizon Supervisors for Multi-Queue Priority

## Success Criteria
Critical jobs (password resets, payments) process within seconds, default jobs within minutes, bulk jobs (reports) within hours — all on one connection with correct priority ordering.
