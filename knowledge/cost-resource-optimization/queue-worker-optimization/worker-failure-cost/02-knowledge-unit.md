# KU-07-WORKER-FAILURE-COST: Worker Failure Cost

## Metadata
- **ID**: KU-07-WORKER-FAILURE-COST
- **Subdomain**: Queue Worker Optimization
- **Topic**: Worker Failure Cost
- **Source**: Queue Worker Optimization, AWS Documentation, Industry Research
- **Reliability**: High

## Executive Summary
Worker failures (job exceptions, timeouts, memory exhaustion, Spot interruptions) waste compute resources and delay job completion. Each failed job consumes processing time without producing results. For Laravel applications, unhandled exceptions, infinite retries, and Poison Pill messages (messages that always fail) can consume significant worker capacity. Effective failure handling reduces wasted compute by 80% and improves job throughput.

## Core Concepts
- **Job failure cost**: CPU + memory + time spent on a job that ultimately fails
- **Visibility timeout**: SQS re-displays message if not deleted; enables retry but also wastes processing
- **Retry cost**: Each retry consumes worker resources without guarantee of success
- **Poison pill**: Message that consistently fails (malformed data, missing dependency); infinite retry loop
- **Dead Letter Queue (DLQ)**: Failed jobs after N attempts; stops retry waste
- **Backoff**: Increasing delay between retries; prevents rapid retry storms
- **Job timeout**: Maximum time a job can run before being marked as failed
- **Spot interruption cost**: Partial job processing wasted on interruption

## Mental Models
- Default: DLQ on every queue (3-5 max attempts)
- Default: exponential backoff with jitter
- Default: explicit job timeout in every job class
- Monitor DLQ depth; alert at > 0

## Internal Mechanics
- Failed job waste: 100 jobs/day failing at 2s each = 200 seconds/day wasted (negligible)
- Poison pill waste: 100 attempts/second until DLQ triggers = $50+ in compute for a single bad message
- Retry overhead: Maximum 5 retries at 2/4/8/16/32s backoff = 62 seconds of potential waste per job
- DLQ redrive: Re-processing DLQ messages costs worker time; analyze before re-driving all
- Failure rate threshold: If failure rate > 5%, investigate before processing more jobs

## Patterns
- Implement DLQ on every queue
- Use exponential backoff with jitter
- Set job timeout based on expected duration
- Monitor failure rate per job class
- Handle Spot interruption gracefully
- Use Laravel job middleware for rate limiting
- Log failure reason to identify patterns

## Architectural Decisions
- Every queue has a DLQ with 3-5 max receives/attempts
- SQS redrive policy: DLQ re-processes messages after manual review
- Laravel max_attempts: 3 for transient failures, 1 for validation failures (will always fail)
- Visibility timeout: max job duration + 60 seconds buffer
- Failed jobs table: `php artisan queue:failed-table` + `migrate`
- Alert on DLQ message count > 0 (poison pill detected)
- Monitor failure cost: count * avg_job_duration * cost_per_second_of_worker

## Tradeoffs
**When To Use:**
- DLQ: Always implement for every queue (prevent poison pill infinite loops)
- Backoff/retry limiting: All jobs that may have transient failures (network, API rate limits)
- Job timeout: Long-running jobs that may hang
- Visibility timeout tuning: Workers with variable job durations
- Failure monitoring: Production queue processing with >0.1% failure rate
- Graceful termination: Spot-based workers with interruption handling

**When NOT To Use:**
- No retry for idempotent critical jobs: Payment jobs should retry; don't send to DLQ on first failure
- Too-fast retry: Retrying every second; API rate limits will still fail; use exponential backoff
- No DLQ for low-traffic queues: If queue processes 10 jobs/day, poisoning is less impactful but still implement DLQ
- Endless retries: Don't set max_attempts to "unlimited" (infinite waste on poison pills)

## Performance Considerations
- Failed job waste: 100 jobs/day failing at 2s each = 200 seconds/day wasted (negligible)
- Poison pill waste: 100 attempts/second until DLQ triggers = $50+ in compute for a single bad message
- Retry overhead: Maximum 5 retries at 2/4/8/16/32s backoff = 62 seconds of potential waste per job
- DLQ redrive: Re-processing DLQ messages costs worker time; analyze before re-driving all
- Failure rate threshold: If failure rate > 5%, investigate before processing more jobs

## Production Considerations
- Failed jobs may contain sensitive data (PII, payment info)
- DLQ messages should be encrypted at rest (SQS SSE)
- Failed jobs table (database) should be access-controlled
- Notification on DLQ should not leak message content
- Manual DLQ reprocessing should be authorized (prevent re-processing of sensitive data)

## Common Mistakes
- **No DLQ for any queue**: Failed messages retry indefinitely; poison pill consumes 100% worker capacity (Cause: assumption that all jobs eventually succeed; Consequence: single bad message can clog queue for hours; Better: DLQ after 3-5 attempts, alert on DLQ arrival)
- **No job timeout**: `$timeout` not set; job hangs on network call, blocks worker forever (Cause: relying on PHP max_execution_time; Consequence: stuck workers reduce capacity; Better: explicit `$timeout = 120` in job class)
- **Immediate retry with no backoff**: Retry every 1 second for transient API failures (Cause: "retry until success" approach; Consequence: API rate limited harder, all retries fail; Better: exponential backoff 2/4/8/16/32s)
- **Not monitoring failure rate**: No alert on failed jobs; poison pill wastes compute for hours unnoticed (Cause: assuming failures are handled by DLQ; Consequence: DLQ fills up, root cause not addressed; Better: monitor DLQ depth > 0 as alert)

## Failure Modes
- **Endless retries for all jobs**: Unlimited attempts; poison pill wastes infinite compute
- **Same retry strategy for all jobs**: Transient failures (network) need backoff; validation failures should skip retry
- **Ignoring Spot termination in workers**: Workers don't handle SIGTERM; jobs waste processing on interruption
- **Large DLQ without review**: 1000+ messages in DLQ unprocessed; no one analyzes root cause

## Ecosystem Usage
- **Before**: No DLQ; single bad message retries 500 times, each taking 5 seconds (2500 seconds wasted), consuming 3 hours of a worker
- **After**: DLQ after 3 attempts; bad message goes to DLQ in 30 seconds; alert triggers manual review
- **Exponential backoff**: `public function retryUntil() { return now()->addMinutes(5); }` + middleware with delays
- **Visibility timeout**: max job duration = 120s; visibility timeout = 180s (2x + 60s buffer)
- **Graceful shutdown**: Worker catches SIGTERM, calls `$this->job->delete()`, exits cleanly

## Related Knowledge Units
- Spot Worker (ku-05)
- Queue Priority Cost (ku-04)
- Throughput Optimization (ku-06)

## Research Notes
Derived from Queue Worker Optimization, AWS Documentation, Industry Research. See 04-standardized-knowledge.md for complete research details.