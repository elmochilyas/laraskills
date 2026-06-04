# Worker Failure Cost Rules

## Rule 1: Implement DLQ on Every Queue
- **Category**: Reliability
- **Rule**: Always configure a Dead Letter Queue for every SQS queue with max receive count of 3-5
- **Reason**: Poison pill messages (always fail) consume 100% worker time on unprocessable jobs; DLQ stops the waste after N attempts and enables manual review
- **Bad Example**: A malformed message retries 500 times, each taking 5 seconds (2,500 seconds wasted), before someone notices the issue
- **Good Example**: DLQ configured with maxReceiveCount=3; poison pill goes to DLQ in 30 seconds; alert triggers manual review
- **Exceptions**: Queues with idempotent jobs that should retry indefinitely until the underlying condition resolves (rare)
- **Consequences Of Violation**: Infinite retry loops on poison pills; worker capacity consumed entirely by unprocessable jobs

## Rule 2: Use Exponential Backoff with Jitter
- **Category**: Performance
- **Rule**: Implement exponential backoff with jitter for job retries (2s, 4s, 8s, 16s, 32s)
- **Reason**: Immediate retry of transient failures (network, API rate limits) often fails again under the same conditions; exponential backoff allows recovery time and jitter prevents thundering herd
- **Bad Example**: Retrying every 1 second for a rate-limited API — all retries fail because the rate limit window hasn't passed
- **Good Example**: Using exponential backoff with jitter: 2 + random(0-1)s, 4 + random(0-2)s, etc., giving the API time to recover
- **Exceptions**: Non-transient failures (validation errors) should not retry at all; fail immediately
- **Consequences Of Violation**: All retries fail, wasting compute; retries compound the original problem (e.g., rate limiting gets worse)

## Rule 3: Set Explicit Timeout on Every Job Class
- **Category**: Reliability
- **Rule**: Always set an explicit `$timeout` property on every Laravel job class
- **Reason**: Hanging jobs (infinite loops, deadlocks, unresponsive APIs) block workers indefinitely, reducing processing capacity and potentially causing a capacity death spiral
- **Bad Example**: A job making an HTTP call to a service that is down; the job hangs for PHP max_execution_time (30s-300s), blocking the worker
- **Good Example**: `public $timeout = 120;` — the job is terminated after 120 seconds, freeing the worker for other jobs
- **Exceptions**: Jobs with predictable, tested execution times that cannot exceed known limits
- **Consequences Of Violation**: Stuck workers reduce available processing capacity; backlog grows while workers are blocked

## Rule 4: Handle Spot Interruption Gracefully
- **Category**: Reliability
- **Rule**: Implement SIGTERM handling in workers to finish the current job before exiting on Spot interruption
- **Reason**: Interrupted workers waste partial processing; jobs become visible again after visibility timeout and are re-processed by another worker, duplicating work
- **Bad Example**: A Spot worker processing a 60-second job is interrupted at 55 seconds; the job re-appears and another worker starts from scratch, wasting 55 seconds of compute
- **Good Example**: Worker catches SIGTERM, finishes the current job, deletes it from SQS, then exits cleanly
- **Exceptions**: Very short jobs (<1 second) may not justify the complexity of graceful shutdown handlers
- **Consequences Of Violation**: Wasted compute on partially processed jobs; increased job latency due to re-processing

## Rule 5: Monitor Failure Rate Per Job Class
- **Category**: Testing
- **Rule**: Track and alert on failure rate per job class, investigating any failure rate above 1%
- **Reason**: High failure rate indicates a code bug, infrastructure issue, or upstream service problem; early detection prevents hours of wasted processing and backlog accumulation
- **Bad Example**: A database migration introduces a deadlock in 30% of jobs; the failure goes unnoticed for 2 hours, wasting thousands of worker-seconds
- **Good Example**: Dashboard showing failure rate per job class with alert at >1%; deadlock is detected within 1 minute of deployment
- **Exceptions**: Known transient failures during deployment or maintenance windows may temporarily exceed the threshold
- **Consequences Of Violation**: Significant compute waste before the issue is detected; delayed incident response

## Rule 6: Use Rate Limiting Middleware for API-Dependent Jobs
- **Category**: Design
- **Rule**: Apply Laravel's RateLimited job middleware to any job that calls external APIs
- **Reason**: Jobs hitting rate limits fail repeatedly without rate limiting middleware, wasting compute on retries that will all fail until the rate limit window resets
- **Bad Example**: 100 email-sending jobs all hit SendGrid's rate limit simultaneously, then retry 3 times each, generating 400 failed attempts
- **Good Example**: Using `RateLimited` middleware that catches rate limit exceptions and releases the job back with a delay matching the rate limit window
- **Exceptions**: Internal API calls where rate limiting is guaranteed not to be hit
- **Consequences Of Violation**: Massive waste of worker capacity on retries that all fail due to rate limits

## Rule 7: Log Failure Reasons for Pattern Analysis
- **Category**: Maintainability
- **Rule**: Always log the exception message and stack trace for every failed job in the failed_jobs table
- **Reason**: Failure patterns reveal root causes: "Database deadlock" = 50% of failures (fix the query), "API timeout" = 30% (increase timeout); without data, fixing the right root cause is guesswork
- **Bad Example**: Seeing 100 failed jobs per day but having no way to determine what is causing them or which are most frequent
- **Good Example**: Querying failed_jobs table reveals "cURL error 28: Connection timed out" accounts for 70% of failures; increasing HTTP timeout resolves the issue
- **Exceptions**: Failed jobs containing PII should log sanitized messages, not raw exception data
- **Consequences Of Violation**: Inability to identify and fix the root cause of job failures; ongoing compute waste
