# Queue Priority Cost Rules

## Rule 1: Use 3 Priority Levels
- **Category**: Architecture
- **Rule**: Define exactly 3 queue priority levels (high, default, low) for application job processing
- **Reason**: 3 levels cover 90%+ of use cases; more creates management overhead, fewer miss optimization opportunities for cost differentiation
- **Bad Example**: Creating 7 priority levels—high, medium-high, medium, medium-low, low, background, batch—each with separate worker configurations that are rarely different
- **Good Example**: high (sub-minute), default (minutes), low (hours/days) with distinct worker pools and scaling policies
- **Exceptions**: Very simple apps with only 2 types of jobs may use high and default only
- **Consequences Of Violation**: Management overhead from overly granular priority levels; confusing developer experience

## Rule 2: Use On-Demand for High Priority, Spot for Low Priority
- **Category**: Cost Management
- **Rule**: Run high-priority workers on On-Demand instances and low-priority workers on Spot instances
- **Reason**: High-priority jobs (payments, password resets) need guaranteed, immediate processing; low-priority jobs (reports, cleanup) can tolerate interruption and delay, saving 70% on compute
- **Bad Example**: Running email confirmation workers (sub-minute latency required) on Spot instances; interruption causes 2+ minute delay
- **Good Example**: Payment workers on On-Demand (min=2, max=10); report generation workers on Spot (min=0, max=20)
- **Exceptions**: Teams with no Spot access or compliance requirements may need On-Demand for all tiers
- **Consequences Of Violation**: High-priority jobs delayed by Spot interruptions, or paying On-Demand rates for work that could run on Spot

## Rule 3: Route Job Classes Explicitly to Queues
- **Category**: Maintainability
- **Rule**: Always use explicit `onQueue()` calls when dispatching jobs to specify the priority queue
- **Reason**: Explicit routing prevents developers from accidentally using the wrong queue; code review can catch classification errors
- **Bad Example**: Relying on default queue binding for all jobs—a batch PDF generation ends up on the same queue as password reset emails
- **Good Example**: `ProcessPayment::dispatch()->onQueue('high');` and `GenerateReport::dispatch()->onQueue('low');`
- **Exceptions**: Jobs with default priority can omit onQueue() if the default queue is properly configured as the 'default' priority
- **Consequences Of Violation**: Priority inversion—low-priority jobs consuming high-priority worker capacity

## Rule 4: Scale Low-Priority Workers with Backpressure
- **Category**: Cost Management
- **Rule**: Set higher scaling thresholds for low-priority workers—only add capacity when backlog is significant (1000+ messages)
- **Reason**: Low-priority jobs can tolerate hours of delay; scaling at small backlogs wastes compute on non-urgent work; backpressure is acceptable and cost-efficient
- **Bad Example**: Low-priority queue scaling at backlog=10, same as high-priority, incurring compute costs for work that could wait hours
- **Good Example**: Low-priority queue scaling at backlog=5000, allowing backlog to accumulate during peak times and processing during off-peak
- **Exceptions**: Low-priority jobs with time-of-day processing windows may need scheduled scaling instead
- **Consequences Of Violation**: Paying for compute to process non-urgent work instantly when backpressure would be acceptable

## Rule 5: Monitor Per-Queue Latency
- **Category**: Performance
- **Rule**: Track average time from dispatch to completion (latency) per priority queue
- **Reason**: Priority queues exist to ensure latency targets; if high-priority latency exceeds 1 minute, worker allocation is insufficient; if low-priority is under 1 hour, it's over-provisioned
- **Bad Example**: Not monitoring per-queue latency; high-priority jobs silently degrade to 5-minute latency without anyone noticing
- **Good Example**: Dashboard showing: high=500ms, default=30s, low=45min; high latency increases trigger alert and auto-scaling adjustment
- **Exceptions**: Very low-volume queues may have insufficient data for meaningful latency metrics
- **Consequences Of Violation**: Priority inversion goes undetected; latency targets are missed without visibility

## Rule 6: Implement Escalation for Stuck Low-Priority Jobs
- **Category**: Reliability
- **Rule**: Escalate low-priority jobs to the default queue if they remain unprocessed beyond 4 hours
- **Reason**: Prevents job starvation—if low-priority workers are interrupted, overwhelmed, or misconfigured, jobs still eventually get processed by default workers
- **Bad Example**: A low-priority job sits in the queue for 48 hours because low-priority workers are all interrupted by Spot reclaims
- **Good Example**: After 4 hours, the job is moved from `low` to `default` queue; default workers pick it up as part of their normal processing
- **Exceptions**: Jobs explicitly scheduled for batch processing (month-end reports) should not escalate
- **Consequences Of Violation**: Critical low-priority jobs are never processed; data exports, reports, or cleanup tasks fail silently
