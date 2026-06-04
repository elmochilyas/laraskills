# Queue Worker Lifecycle

## Rule Name
Always set `--max-jobs` or Horizon `maxJobs`.
---
## Category
Reliability | Performance
---
## Rule
Always configure `--max-jobs` when running `queue:work` or `maxJobs` in Horizon configuration. Never run queue workers without a job limit.
---
## Reason
Queue workers have no sandbox isolation. Every job mutates the same container singletons and static properties. Without a job limit, workers accumulate memory unbounded until OOM — the current job is lost and cannot be retried.
---
## Bad Example
```bash
# No safety valve — runs until OOM
php artisan queue:work redis
```
---
## Good Example
```bash
# Safe default — recycles worker after 500 jobs
php artisan queue:work redis --max-jobs=500 --max-time=3600
```
---
## Exceptions
Serverless queue workers (Vapor) where each job runs in a fresh Lambda invocation with automatic isolation.
---
## Consequences Of Violation
Unbounded memory growth; worker crashes from OOM; the crashed job is lost unless the driver supports retry.

---

## Rule Name
Register a `Queue::looping()` callback for state reset.
---
## Category
Reliability | Design
---
## Rule
Always register a `Queue::looping()` callback in your `AppServiceProvider` to reset known leaky services between jobs.
---
## Reason
`Queue::looping()` is the only hook that runs between job iterations — the queue worker's equivalent of Octane's `RequestTerminated`. Without it, accumulated state in auth guards, string caches, and static registries persists indefinitely across jobs.
---
## Bad Example
```php
// No reset between jobs — auth state leaks from job to job
```
---
## Good Example
```php
// AppServiceProvider::boot()
Queue::looping(function () {
    app(AuthManager::class)->forgetGuards();
    Str::resetCache();
    Collection::clearMacros();
    if (memory_get_usage() > 100 * 1024 * 1024) {
        gc_collect_cycles();
    }
});
```
---
## Exceptions
No common exceptions. Every long-running queue worker needs per-iteration state management.
---
## Consequences Of Violation
Singleton state leaks across jobs; auth credentials from Job A affect Job B; static arrays accumulate until OOM.

---

## Rule Name
Load dependencies in `handle()`, not the constructor.
---
## Category
Design | Reliability
---
## Rule
Never resolve request-scoped services or Eloquent models in a job's constructor. Always load them fresh inside `handle()`.
---
## Reason
The job constructor runs at dispatch time with the current request context. By the time the worker executes the job, the resolved services may be stale, incorrect, or meaningless in the headless queue context.
---
## Bad Example
```php
class ProcessPayment implements ShouldQueue
{
    public function __construct(
        private PaymentGateway $gateway, // Stale by execution time
        private Order $order              // Serialized — may be outdated
    ) {}
}
```
---
## Good Example
```php
class ProcessPayment implements ShouldQueue
{
    public function __construct(
        private int $orderId // Store only the identifier
    ) {}

    public function handle(PaymentGateway $gateway): void
    {
        $order = Order::findOrFail($this->orderId); // Fresh from DB
        $gateway->charge($order->amount);           // Fresh from container
    }
}
```
---
## Exceptions
Services that are immutable and stateless (loggers, HTTP clients with no state) — safe in constructor.
---
## Consequences Of Violation
Processing jobs with stale data; silent logic errors; authentication failures from expired credentials.

---

## Rule Name
Guard `Queue::looping()` against non-queue contexts.
---
## Category
Reliability
---
## Rule
Always guard `Queue::looping()` callbacks with `app()->runningInConsole()` or a similar context check when the callback is also registered in Octane providers.
---
## Reason
`Queue::looping()` fires in any process that boots the framework and processes jobs. If the same code runs under Octane, the callback fires between HTTP requests too — causing unexpected state reset that may break in-flight requests.
---
## Bad Example
```php
// Registered in a shared service provider
Queue::looping(function () {
    app(AuthManager::class)->forgetGuards(); // Resets auth during Octane requests too
});
```
---
## Good Example
```php
Queue::looping(function () {
    if (! app()->runningInConsole()) {
        return; // Only reset in queue workers, not Octane
    }
    app(AuthManager::class)->forgetGuards();
});
```
---
## Exceptions
Projects that run queue workers and Octane in separate deployments with separate provider configurations.
---
## Consequences Of Violation
Auth state is reset mid-request under Octane; unexpected behavior changes in HTTP context.

---

## Rule Name
Avoid storing mutable state on `$this` in job classes.
---
## Category
Design | Reliability
---
## Rule
Never store mutable state on `$this` properties of a job class across retry attempts. Treat each `handle()` call as creating fresh state.
---
## Reason
When a job is retried (released back to the queue), the same instance may be re-executed. State stored from the first attempt persists into the retry, causing cumulative side effects or skipped logic.
---
## Bad Example
```php
class ProcessOrder implements ShouldQueue
{
    private int $attemptCount = 0;

    public function handle(): void
    {
        $this->attemptCount++; // Persists across retries — incorrect
    }
}
```
---
## Good Example
```php
class ProcessOrder implements ShouldQueue
{
    public function handle(): void
    {
        $attempts = $this->attempts(); // Use built-in attempt counter
        // All state is fresh per handle() call
    }
}
```
---
## Exceptions
Read-only configuration values set in the constructor at dispatch time.
---
## Consequences Of Violation
Retry logic behaves incorrectly; counters produce wrong values; cumulative side effects corrupt business logic.
