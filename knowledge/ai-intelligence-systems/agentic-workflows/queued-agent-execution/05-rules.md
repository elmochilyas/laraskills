## Use `->queue()` for Long-Running Agents Only
---
## Category
Performance | Architecture
---
## Rule
Use `$agent->queue()` for agents that take longer than 5 seconds or involve multi-step tool chains; use synchronous `$agent->prompt()` for simple, fast operations.
---
## Reason
Queue dispatch adds ~50-200ms overhead for job serialization and queue insertion. For fast agents (<2s), this overhead is a significant fraction of total execution time. Synchronous `prompt()` is simpler and faster for quick operations.
---
## Bad Example
```php
// Queueing a trivial agent — unnecessary overhead
$result = $agent->queue('hello')->then(fn($r) => $r->text);
```
---
## Good Example
```php
// Synchronous for simple calls
$greeting = $agent->prompt('Say hello')->text;

// Queue for complex, time-consuming tasks
$agent->queue('Analyze this 100-page document')
    ->then(fn($r) => Notify::user($userId, $r->text))
    ->catch(fn($e) => Log::error('Analysis failed', [$e]));
```
---
## Exceptions
Agents that must always run asynchronously (e.g., webhook-triggered batch processing) may queue even simple tasks for consistency.
---
## Consequences Of Violation
Unnecessary latency for simple operations, queue worker congestion from trivial jobs.

## Use Dedicated Queue Connection for AI Workloads
---
## Category
Reliability | Performance
---
## Rule
Configure a dedicated queue connection for AI agent jobs; isolate them from email, notification, and other low-latency queues.
---
## Reason
AI agent jobs can be long-running (30s+) and may have different retry and timeout requirements than other jobs. A shared queue with email jobs causes AI jobs to block email delivery and vice versa. Dedicated queues allow independent worker scaling.
---
## Bad Example
```php
// config/queue.php — single connection for everything
'default' => env('QUEUE_CONNECTION', 'redis'),
```
---
## Good Example
```php
// config/queue.php — dedicated AI queue
'connections' => [
    'default' => ['driver' => 'redis', 'queue' => 'default'],
    'ai' => ['driver' => 'redis', 'queue' => 'ai'],
],
// Worker: php artisan queue:work redis --queue=ai
```
---
## Exceptions
Low-traffic applications where AI jobs are rare (<10/day) may share a queue for simplicity.
---
## Consequences Of Violation
Email delivery delayed by long AI jobs, AI jobs starved by high-volume notification traffic, difficult capacity planning.

## Ensure Agent is Serializable
---
## Category
Reliability
---
## Rule
Ensure all constructor parameters of queue-dispatched agents are serializable; avoid passing Eloquent models with loaded relations, closures, or resources.
---
## Reason
Agent instances are serialized when dispatched to the queue and unserialized when processed. Non-serializable parameters cause the job to fail immediately with a serialization error, losing the request entirely.
---
## Bad Example
```php
// Non-serializable: Eloquent model with deferred relations
$agent = new AnalysisAgent(User::with('orders')->find(1));
$agent->queue($input);
```
---
## Good Example
```php
// Serializable: primitive types only
$agent = new AnalysisAgent(userId: 1, tenantId: 'abc');
$agent->queue($input);
```
---
## Exceptions
Agents that require model access may pass the model ID and re-query within the queued execution.
---
## Consequences Of Violation
Job fails at dispatch time, request silently lost, no retry can recover the deserialization failure.
