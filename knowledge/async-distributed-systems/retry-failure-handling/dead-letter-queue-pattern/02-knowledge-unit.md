# Metadata
Domain: Async & Distributed Systems
Subdomain: Retry & Failure Handling
Knowledge Unit: Dead-Letter Queue Pattern and Poison Messages
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary
The dead-letter queue (DLQ) pattern isolates jobs that have permanently failed into a separate queue for manual inspection, delayed retry, or automated triage. Laravel has no built-in DLQ — it implements a `failed_jobs` table instead. A true DLQ is implemented at the application level by dispatching failed jobs to a dedicated `dead-letter` queue in the `failed()` method. Poison messages — jobs that fail repeatedly and burn retry attempts — must be detected early and redirected to the DLQ to prevent worker starvation and log pollution.

# Core Concepts
- **Dead-letter queue**: A separate queue (e.g., `dead-letter`) where permanently failed jobs are dispatched for deferred processing or manual review.
- **Poison message**: A job that cannot be processed successfully and keeps failing after every retry, consuming worker resources each time.
- **Laravel's `failed_jobs` vs DLQ**: `failed_jobs` is a storage table for failed jobs. A DLQ keeps the job as a queue message, maintaining its structure for reprocessing.
- **Application-level DLQ**: Implemented by calling `$this->dispatch(new DeadLetterJob($this->originalJob))` from `failed()`.
- **Infrastructure-level DLQ**: RabbitMQ and SQS have native DLQ support — messages exceeding redelivery limits are automatically moved to a configured DLQ.

# Mental Models
- **Hospital quarantine**: When a job keeps failing (poison), it's sent to quarantine (DLQ) instead of the general population. It gets special attention from experts (manual review) and doesn't infect healthy jobs.
- **Email spam folder**: Failed_jobs = deleted emails. DLQ = spam folder — you can inspect, recover, or permanently delete.

# Internal Mechanics
- **Application-level DLQ flow**: `handle()` throws → worker calls `failed()` → `failed()` calls `DeadLetterJob::dispatch($this->payload)` for the failed queue → job goes to `dead-letter` queue.
- **Native RabbitMQ DLQ**: Exchange configured with `x-dead-letter-exchange`. After max retries, the broker moves the message to the DLQ automatically.
- **Native SQS DLQ**: Source queue configured with a Redrive Policy pointing to a DLQ. After `maxReceiveCount`, messages move to DLQ.
- For native DLQs, the broker handles the transition. Laravel's app doesn't need to implement `failed()`.
- Poison message detection: A job that calls `$this->release()` without ever calling `handle()` (or throws before handling) remains in the queue.

# Patterns
## Application-Level DLQ
- **Purpose**: Route permanently failed jobs to a monitoring queue.
- **Benefit**: Jobs stay as queue messages (not just DB records), preserving structure for automated reprocessing.
- **Tradeoff**: Two dispatches per failure (original + DLQ); DLQ worker needed.

## Infrastructure-Level DLQ (RabbitMQ/SQS)
- **Purpose**: Use broker-native DLQ for automatic poison message handling.
- **Benefit**: No application code needed; broker handles the routing.
- **Tradeoff**: Only works with specific drivers; less visibility from Laravel's perspective.

## Poison Message Detection Middleware
- **Purpose**: Detect non-recoverable failures before they exhaust retries.
- **Benefit**: Early redirect to DLQ saves retry attempts and worker time.
- **Tradeoff**: Must correctly identify poison messages; false positives kill recoverable jobs.

# Architectural Decisions
- **Use application-level DLQ when**: You need full control over DLQ routing, are using Redis driver (no native DLQ), or need per-job DLQ logic.
- **Use infrastructure-level DLQ when**: Using RabbitMQ or SQS, and the broker's DLQ configuration meets your needs.
- **Skip DLQ when**: `failed_jobs` table + monitoring is sufficient for your failure volume.
- **Always implement poison message detection**: Even without a formal DLQ, detect jobs that consistently fail early (first retry in <1s, exception is always the same type).

# Tradeoffs
Application-level DLQ | Full control, any driver, custom routing | Extra dispatch per failure; must manage DLQ worker
Infrastructure DLQ | Automatic, no app code, broker-managed | Driver-specific; less visibility
`failed_jobs` only | Simple, no extra infrastructure | Jobs lose queue context; retry is manual

# Performance Considerations
- DLQ dispatch is an additional queue push per failure. Negligible for low failure rates.
- DLQ workers need dedicated capacity. A backlog in DLQ delays manual triage.
- Poison message detection middleware adds a check before each job execution. Minimal overhead.
- RabbitMQ/SQS native DLQ routing happens at the broker level — no application overhead.

# Production Considerations
- Separate DLQ workers should have different alerting thresholds. A full DLQ is expected; an empty DLQ may be a problem.
- Monitor DLQ depth and oldest message age. Growing backlog indicates systematic failure.
- Implement DLQ reprocessing: a scheduled job that reads from DLQ and re-dispatches to the original queue after a cool-off period.
- DLQ jobs should retain the original payload for debugging. Don't strip context.
- For application-level DLQ, ensure the DLQ worker has high `$tries` (or retryUntil) to handle transient failures during reprocessing.

# Common Mistakes
- **No poison message detection**: Jobs that fail on the first retry in <1 second (without any processing) are poisoning the queue. Detect and redirect.
- **DLQ without monitoring**: A DLQ that no one monitors is just a second place for jobs to die silently.
- **Infinite retry loop via DLQ reprocessing**: A scheduled job that reads from DLQ and re-dispatches to the same queue without backoff creates an infinite loop.
- **Using `failed_jobs` as DLQ**: `failed_jobs` is a record store, not a queue. You can't route, prioritize, or process `failed_jobs` records like queue messages.

# Failure Modes
- **DLQ message explosion**: A systemic failure (DB down, API key expired) causes every job to fail. The DLQ fills up faster than it can be processed.
- **Poison message detection false negative**: A job that processes for 10 seconds then fails is not detected as poison (it does real work before failing). But it's still consuming resources and failing.
- **Race condition in DLQ reprocessing**: A job is in DLQ, re-dispatched, and fails again — it goes back to DLQ. If reprocessing is too fast, it creates a tight DLQ→reprocess→fail→DLQ loop.
- **Native DLQ misconfiguration**: RabbitMQ/SQS DLQ binding misconfigured — messages go to DLQ that shouldn't, or don't go to DLQ that should.

# Ecosystem Usage
- **Laravel framework**: No built-in DLQ. Framework relies on `failed_jobs` table.
- **Spatie webhook-server**: Moves permanently failed webhooks to the `webhook_calls` table with status `failed`. This is a form of DLQ via database.
- **RabbitMQ/SQS packages**: Community packages provide Laravel-native DLQ interfaces for broker-level DLQ.

# Related Knowledge Units
- K016 Failure Taxonomy (terminal failure → DLQ) | K024 Retry Workflow (DLQ reprocessing)

## Research Notes
- Laravel's failure taxonomy separates transient failures (network timeouts, deadlocks) from permanent failures (validation errors, missing models) — the 	ries and maxExceptions properties handle the former, while ailed() methods handle the latter.
- The etryUntil method takes precedence over 	ries when both are defined — the job will retry until the absolute timestamp, regardless of how many attempts that takes.
- Exponential backoff in Laravel uses a base delay doubled with each attempt: ackoff => [10, 20, 40, 80, 160] — the array length defines the number of attempts before the job fails permanently.
- The dead letter queue pattern is natively supported by SQS (via Redrive Policy) and RabbitMQ (via DLX), but Laravel does not have a built-in DLQ — community solutions involve separate queue connections for failed job inspection.
- Pruning failed jobs (ailed_jobs table) should be scheduled to prevent unbounded growth — model:prune with the Prunable trait on a custom failed job model can automate this.
- The ailed() method on jobs is called when all retry attempts are exhausted — it runs in the worker process and should be lightweight (logging, notification) to avoid delaying the worker.
- Idempotency patterns for job processing require a unique job identifier and a deduplication check before processing — this is critical for payment and notification jobs where duplicate execution has real-world consequences.
- Model hydration failures in queued jobs (Illuminate\Contracts\Database\ModelIdentifier) are silent — the job fails without clear error indication, often confused with timeout issues.
