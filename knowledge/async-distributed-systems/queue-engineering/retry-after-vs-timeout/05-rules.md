## Rule 1: Always Keep --timeout at Least 10s Below retry_after
---
## Category
Reliability | Scalability
---
## Rule
Always configure `--timeout` to be at least 10 seconds less than the connection's `retry_after` value.
---
## Reason
If `--timeout` equals or exceeds `retry_after`, the queue backend releases the job reservation before the worker is killed — a second worker processes the same job, causing guaranteed double processing.
---
## Bad Example
```php
// config/queue.php
'retry_after' => 60,
// Supervisor command
--timeout=60  // equal to retry_after — clock skew causes double processing
```
---
## Good Example
```php
// config/queue.php
'retry_after' => 70,
// Supervisor command
--timeout=60  // 10s buffer — safe
```
---
## Exceptions
No common exceptions. The 10-second buffer is a minimum safety margin.
---
## Consequences Of Violation
Intermittent or guaranteed double job processing; corrupted application state from duplicate side effects.

## Rule 2: Never Ignore Job $timeout Override
---
## Category
Reliability | Framework Usage
---
## Rule
Always verify that a job's `public $timeout` property does not silently exceed `retry_after`, since the job-level property overrides the worker's `--timeout` flag.
---
## Reason
`$timeout` on a job class bypasses the worker's `--timeout` setting — a job with `$timeout = 600` runs for 10 minutes even if the worker `--timeout` is 60 seconds, potentially exceeding `retry_after`.
---
## Bad Example
```php
class LongRunningJob implements ShouldQueue
{
    public $timeout = 300; // 5 minutes — worker --timeout=60 is ignored
}
// Worker command: --timeout=60 — retry_after=70
// This job runs for 5 minutes, retry_after expires in 70s — double processing
```
---
## Good Example
```php
class LongRunningJob implements ShouldQueue
{
    public $timeout = 60; // aligned with worker --timeout
    // or remove $timeout and let worker --timeout apply
}
```
---
## Exceptions
Jobs that genuinely need longer timeouts — ensure `retry_after` is adjusted accordingly on the connection.
---
## Consequences Of Violation
Job silenty exceeds retry_after; reservation expires; second worker picks up the same job while original still processes.

## Rule 3: Remember retry_after Is Per-Connection, Not Per-Queue
---
## Category
Architecture | Scalability
---
## Rule
Prefer separate queue connections or uniform job runtimes when queues on the same connection have significantly different execution durations.
---
## Reason
All queues on one connection share the same `retry_after` — a slow queue's timeout window guarantees a fast queue's jobs take unnecessarily long to surface failures.
---
## Bad Example
```php
// Single connection — both queues share retry_after=90
'redis' => [
    'retry_after' => 90,
    'queue' => ['fast-jobs-10ms', 'slow-jobs-80s'],
],
```
---
## Good Example
```php
// Separate connections with tuned retry_after
'redis_fast' => ['retry_after' => 15],
'redis_slow' => ['retry_after' => 120],
```
---
## Exceptions
When all jobs on all queues of a connection have similar runtimes within a safe range.
---
## Consequences Of Violation
Fast-queue job failures take excessive time to surface for retry; capacity planning distorted by misaligned timeouts.
