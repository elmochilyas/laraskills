# Metadata
Domain: Async & Distributed Systems
Subdomain: Retry & Failure Handling
Knowledge Unit: Failed Job Events (`Queue::failing`)
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary
The `Queue::failing` event fires whenever a job permanently fails, before the job is stored in `failed_jobs`. This event is the primary hook for global failure monitoring, alerting, and logging that applies across all job types. Unlike the job-level `failed()` method, `Queue::failing` receives the job object and exception without job-type-specific context — it's suited for cross-cutting concerns. Additional queue events (`Queue::looping`, `Queue::paused`, `Queue::resumed`, `Queue::workerStopping`) provide lifecycle hooks for worker monitoring.

# Core Concepts
- **`Queue::failing`**: Dispatched via `$this->raiseFailedJobEvent()` in the Worker. Receives the job instance and exception.
- **Event payload**: `Illuminate\Queue\Events\JobFailed` — contains `$connectionName`, `$job`, `$exception`.
- **Firing order**: Job is stored in `failed_jobs` → `Queue::failing` fires → `$job->failed()` is called (or the reverse in some versions).
- **`Queue::looping`**: Fires before each worker loop iteration. Useful for stopping the worker conditionally.
- **`Queue::paused` / `Queue::resumed`**: Fires when `Queue::pause()` / `Queue::resume()` is called for a specific connection/queue.
- **`Queue::workerStopping`**: Fires when a worker is stopping (e.g., after `--max-jobs` or SIGTERM).

# Mental Models
- **Fire alarm**: `Queue::failing` is the building fire alarm — it goes off for every fire (failure), regardless of which room (job). The alarm doesn't know what's burning, only that something is.
- **News ticker**: Each failing event is a breaking news alert. The broadcaster (event) doesn't analyze the content — it just reports it.

# Internal Mechanics
- `Worker::raiseFailedJobEvent()` creates `new JobFailed($connectionName, $job, $e)`.
- The event is dispatched via `$this->events->dispatch($event)`.
- `Queue::failing()` is used in `QueueServiceProvider::register()` to set up the event listener using the `JobFailed` class.
- Listeners can be registered via `EventServiceProvider` or `Queue::failing(Closure)`.
- The `$job` parameter is the underlying queue job (implements `Illuminate\Contracts\Queue\Job`), not the application's job class. Access the job via `$event->job->payload()`.

# Patterns
## Centralized Failure Logging
- **Purpose**: Log every failure to a structured logging system (DataDog, Papertrail, ELK).
- **Benefit**: Complete failure audit trail with no per-job code.
- **Tradeoff**: High event volume at scale (every failure fires the event).

## Slack/PagerDuty Alerting
- **Purpose**: Notify the team when failure thresholds are exceeded.
- **Benefit**: Real-time awareness of queue health.
- **Tradeoff**: Event fires per failure — threshold filtering must be in the listener.

## Failure Metrics
- **Purpose**: Track failure rate as a metric (via Prometheus, StatsD).
- **Benefit**: Trend-aware alerting (failure rate increase, not absolute count).
- **Tradeoff**: Metric instrumentation overhead.

# Architectural Decisions
- **Use `Queue::failing`** for: infrastructure-level monitoring (logging, metrics, alerts). Decoupled from job logic.
- **Use `$job->failed()`** for: job-specific cleanup (reverting job-side effects, releasing job-scoped resources).
- **Use both**: `Queue::failing` for alerts + `failed()` for compensation. Avoid duplicating logic.

# Tradeoffs
`Queue::failing` event | Single listener for all failures, consistent behavior | No job-type-specific context; must parse payload
`$job->failed()` method | Full job context, natural cleanup | Per-job code; easy to forget implementation
Both listeners | Comprehensive coverage | Two places to maintain; possible double processing

# Performance Considerations
- Each failing event dispatch is synchronous — it blocks the worker until all listeners complete.
- Slow event listeners (API calls, Slack webhooks) delay the worker's return to processing.
- For high failure rates, event listeners should be async (dispatched to a queue) to avoid compounding the problem.
- Memory: event listeners hold references to the job object until completion.

# Production Considerations
- Event listeners for `Queue::failing` should NOT fail — an exception in the listener is caught and logged, but the failure logging continues.
- If the listener dispatches a notification (Slack, email), dispatch it async to avoid blocking the worker.
- Monitor `Queue::failing` listener execution time. Slow listeners indicate bottleneck.
- Filter duplicate failures in listeners — same job failing multiple times across workers may fire the event for each worker.

# Common Mistakes
- **Heavy I/O in `Queue::failing` listener**: A synchronous HTTP call per failure blocks the worker. Use queued listeners.
- **Not filtering failure types**: `Queue::failing` catches all exceptions. Listeners that treat all failures equally will over-alert for transient errors that already retried.
- **Confusing `Queue::failing` with `JobFailed`**: `Queue::failing` is the facade method to register a closure. The underlying event is `JobFailed`. Both exist.
- **Assuming `Queue::failing` fires before `failed_jobs` storage**: Order varies by version. Don't rely on `failed_jobs` being present or absent during the event.

# Failure Modes
- **Listener throws exception**: Caught by framework, but subsequent listeners may not execute. Failure monitoring is incomplete.
- **Event suppression on `$this->fail()`**: If a job calls `$this->fail()` explicitly, does `Queue::failing` fire? Yes, in consistent implementations. Verify for your version.
- **Event listener memory leak**: Registering `Queue::failing` listeners in service providers without unbinding can cause listeners to accumulate over worker lifetime.

# Ecosystem Usage
- **Laravel framework**: `QueueServiceProvider` registers default `Queue::failing` handling. `JobFailed` event is also used internally.
- **Laravel Horizon**: Horizon listens to `JobFailed` events for its dashboard and notification system.
- **Spatie packages**: Webhook-server uses `Queue::failing` for logging failed webhook deliveries to the `webhook_calls` table.

# Related Knowledge Units
- K020 `failed_jobs` Table (storage context) | K021 `failed()` Method on Jobs (job-level complement)

## Research Notes
- Laravel's failure taxonomy separates transient failures (network timeouts, deadlocks) from permanent failures (validation errors, missing models) — the 	ries and maxExceptions properties handle the former, while ailed() methods handle the latter.
- The etryUntil method takes precedence over 	ries when both are defined — the job will retry until the absolute timestamp, regardless of how many attempts that takes.
- Exponential backoff in Laravel uses a base delay doubled with each attempt: ackoff => [10, 20, 40, 80, 160] — the array length defines the number of attempts before the job fails permanently.
- The dead letter queue pattern is natively supported by SQS (via Redrive Policy) and RabbitMQ (via DLX), but Laravel does not have a built-in DLQ — community solutions involve separate queue connections for failed job inspection.
- Pruning failed jobs (ailed_jobs table) should be scheduled to prevent unbounded growth — model:prune with the Prunable trait on a custom failed job model can automate this.
- The ailed() method on jobs is called when all retry attempts are exhausted — it runs in the worker process and should be lightweight (logging, notification) to avoid delaying the worker.
- Idempotency patterns for job processing require a unique job identifier and a deduplication check before processing — this is critical for payment and notification jobs where duplicate execution has real-world consequences.
- Model hydration failures in queued jobs (Illuminate\Contracts\Database\ModelIdentifier) are silent — the job fails without clear error indication, often confused with timeout issues.
