# Rule Card: K022 — Failed Job Events (`Queue::failing`)

---

## Rule 1

**Rule Name:** keep-failing-listeners-lightweight

**Category:** Always

**Rule:** Always keep `Queue::failing` event listeners lightweight or dispatch them async.

**Reason:** `Queue::failing` is synchronous — every listener blocks the worker from returning to processing.

**Bad Example:**
```php
Queue::failing(function (JobFailed $event) {
    Http::post('https://hooks.slack.com/...', [...]); // Blocks worker
});
```

**Good Example:**
```php
Queue::failing(function (JobFailed $event) {
    Log::warning('Job failed', ['job' => $event->job->resolveName()]);
    // Slack notification dispatched to a queue
    NotifyFailure::dispatch($event);
});
```

**Exceptions:** Trivial listeners (incrementing a counter) are fine synchronously.

**Consequences Of Violation:** Under high failure rates, slow HTTP listeners compound the problem — workers spend more time sending Slack notifications than processing jobs, increasing the backlog.

---

## Rule 2

**Rule Name:** use-for-infrastructure-monitoring

**Category:** Always

**Rule:** Always use `Queue::failing` for infrastructure-level monitoring, not job-specific cleanup.

**Reason:** `Queue::failing` fires for ALL job failures with no job-type-specific context — filter by exception type or connection for targeted alerting.

**Bad Example:**
```php
Queue::failing(function (JobFailed $event) {
    // Runs for ALL failures — too noisy
    alert('Job failed: '.$event->job->resolveName());
});
```

**Good Example:**
```php
Queue::failing(function (JobFailed $event) {
    if ($event->exception instanceof ValidationException) {
        Log::critical('Validation failure', [
            'job' => $event->job->resolveName(),
            'exception' => $event->exception->getMessage(),
        ]);
    }
});
```

**Exceptions:** None — unfiltered alerting creates noise that buries genuine incidents.

**Consequences Of Violation:** PagerDuty alerts on every transient failure — operators learn to ignore the alerts, missing real systemic failures.

---

## Rule 3

**Rule Name:** prevent-listener-accumulation

**Category:** Never

**Rule:** Never register `Queue::failing` listeners without cleanup in long-running workers.

**Reason:** In a daemon worker, service providers boot once — if listeners are registered repeatedly, they accumulate, causing memory growth.

**Bad Example:**
```php
// In a controller or command — runs on every request
Queue::failing(function (JobFailed $event) {
    // Registers a new listener each time — accumulates
});
```

**Good Example:**
```php
// In AppServiceProvider::boot() — runs once
Queue::failing(function (JobFailed $event) {
    Log::warning('Job failed', ['job' => $event->job->resolveName()]);
});
```

**Exceptions:** In short-lived CLI commands (not daemon workers), listener accumulation is not a concern.

**Consequences Of Violation:** After processing 10K jobs, 10K identical listeners are registered — on each failure, all 10K execute, causing massive performance degradation and memory pressure.
