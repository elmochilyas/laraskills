# Queue Priority Cost

## Metadata
- **ID**: KU-04-QUEUE-PRIORITY-COST
- **Subdomain**: queue-worker-cost-efficiency
- **Domain**: cost-resource-optimization
- **Topic**: Queue Priority Cost
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: High

## Overview
Queue priority determines which jobs are processed first. For Laravel applications, mixing time-sensitive jobs (password reset emails, payment confirmations) with batch jobs (report generation, cleanup tasks) on the same queue causes priority inversion: urgent jobs wait behind non-urgent ones. Using separate queues with different worker configurations ensures high-priority jobs get faster processing while low-priority jobs use cheaper, slower resources.

## Core Concepts
- **Queue priority**: Order of job importance; high-priority processed first (email, notifications)
- **Laravel queue prioritization**: `php artisan queue:work --queue=high,default,low` processes high first
- **Separate queues per priority**: 3+ SQS queues (high, default, low) with separate ASGs
- **Worker allocation**: More workers for high-priority; fewer, cheaper workers for low-priority
- **Spot vs On-Demand per queue**: High-priority on On-Demand (reliable), low-priority on Spot (cheap)
- **Queue depth per priority**: Monitor each queue separately for appropriate scaling
- **Job delay/backoff**: Low-priority jobs can be delayed; high-priority processed instantly

## When To Use
- Separate queues: Apps with 3+ job types with different latency requirements
- Priority worker pools: High-priority (email, payments) and low-priority (reports, cleanup, logs)
- Spotify workers: Low-priority queues using Spot instances (save 70%, acceptable interruption)
- Job class prioritization: Route specific job classes to specific queues
- Batched non-urgent jobs: Low-priority jobs can be batched for efficiency

## When NOT To Use
- Single queue for all jobs: If all jobs have same latency requirements, prioritization adds complexity
- Too many priority levels: > 3 levels adds management overhead; stick with high/default/low
- Over-provisioning low-priority: Low-priority workers should be minimal; backpressure is acceptable
- Priority queues without monitoring: If you can't see backlog per queue, prioritization is blind

## Best Practices
- **Use 3 priority levels**: high (immediate), default (minutes), low (hours/days) (WHY: 3 levels cover 90% of use cases; more creates management overhead; fewer misses optimization opportunities)
- **Assign separate worker ASGs per priority**: High-priority workers on On-Demand (min=2, max=10); Low-priority on Spot (min=0, max=20) (WHY: high-priority needs guaranteed capacity; low-priority can tolerate interruption and scale from zero; saves 50-70% on low-priority compute)
- **Route job classes explicitly**: `ProcessPayment::dispatch()->onQueue('high'); CleanupLogs::dispatch()->onQueue('low');` (WHY: explicit routing prevents developers from accidentally using wrong queue; code review catches classification errors)
- **Scale low-priority workers with backpressure**: Add low-priority workers only when backlog is significant (1000+ messages) (WHY: low-priority jobs can tolerate hours of delay; scaling at small backlogs wastes compute on non-urgent work)
- **Monitor per-queue latency**: Track average time from dispatch to completion per queue (WHY: priority queues exist to ensure latency targets; if high-priority queue latency exceeds 1 minute, investigate worker allocation; if low-priority is under 1 hour, it's over-provisioned)
- **Allow escalation for stuck jobs**: If low-priority job has been queued for 4+ hours, escalate to default pool (WHY: prevents starvation; ensures eventually-processed even if low-priority workers are interrupted or overwhelmed)

## Architecture Guidelines
- Queue structure: `high.fifo` (FIFO, ordered), `default.fifo`, `low.standard` (no ordering needed)
- High-priority: On-Demand workers, min=2, max=10, scale at depth=100
- Default: Mixed Spot/On-Demand, min=1, max=20, scale at depth=500
- Low-priority: Spot workers only, min=0, max=30, scale at depth=5000
- Laravel config: `'queue' => ['high', 'default', 'low']` in `config/queue.php`
- Failed jobs: All priorities go to same dead-letter queue or per-priority DLQ

## Performance Considerations
- High-priority processing: <1 second dispatch to completion (dedicated workers always ready)
- Low-priority processing: 5 minutes to hours (backpressure acceptable, Spot interruptions)
- Worker allocation: 60% of compute budget on high-priority, 20% on default, 20% on low
- Priority scheduling overhead: Laravel processes queues in order; ~0.1ms per queue check
- Spot interruptions: Low-priority workers interrupted more often; acceptable (retry logic)

## Security Considerations
- High-priority queues may need encryption (payment data, PII)
- Low-priority queues may have less stringent access controls
- Dead-letter queue per priority: failed jobs isolated by severity
- Queue URL should not be exposed; use VPC Endpoints for SQS
- Monitor unauthorized access to high-priority queues

## Common Mistakes
1. **Single queue for all jobs**: Email notifications and log cleanup on same queue (Cause: simpler setup; Consequence: log cleanup blocks email notifications during backlog; Better: separate queues per priority with different worker pools)
2. **Same worker pool for all priorities**: High, default, and low all processed by same workers (Cause: single worker configuration; Consequence: no differentiation; low-priority jobs use same expensive resources as high-priority; Better: dedicated On-Demand workers for high, Spot for low)
3. **Over-provisioning low-priority**: Scaling low-priority workers as aggressively as high-priority (Cause: same scaling policy for all queues; Consequence: paying for compute to process non-urgent work instantly; Better: low-priority scales slower (backlog=5000) and uses Spot)

## Anti-Patterns
- **9 priority levels**: Complexity without benefit; 3 levels (high/default/low) is sufficient
- **Priority queue without monitoring**: No per-queue latency tracking; blind to priority inversion
- **All jobs as high priority**: Developers defaulting to high-priority queue; defeats purpose
- **Low-priority workers on On-Demand**: Paying full price for work that can wait hours

## Examples
- **High-priority**: Payment processing, password reset, account verification -> On-Demand workers, 2 always running
- **Default**: Email notifications, webhook delivery -> Mixed Spot/On-Demand, 1 always running
- **Low-priority**: Report generation, log cleanup, data export -> Spot only, scale from zero, backpressure OK
- **Escalation**: Low-priority job queued > 4 hours -> move to default queue; ensure eventual processing

## Related Topics
- Worker Scaling (ku-01)
- Spot Worker (ku-05)
- Worker Failure Cost (ku-07)

## AI Agent Notes
- Default: 3 priority levels (high/default/low)
- Default: On-Demand for high, Spot for low
- Monitor per-queue latency; set targets per priority
- Low-priority scales with backpressure (slow, cheap)

## Verification
- [ ] 2-3 priority levels defined (high/default/low)
- [ ] Separate worker ASGs per priority level
- [ ] High-priority on On-Demand; low-priority on Spot
- [ ] Low-priority scaling threshold > high-priority
- [ ] Per-queue latency monitored and targets met
- [ ] Job routing per class is explicit (onQueue())
- [ ] Escalation mechanism for stuck low-priority jobs
