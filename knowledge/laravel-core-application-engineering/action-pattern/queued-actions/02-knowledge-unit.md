# Queued Actions

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Actions Pattern
- **Knowledge Unit:** Queued Actions
- **Difficulty Level:** Expert
- **Last Updated:** 2026-06-02

---

## Executive Summary

Queued actions solve the architectural mismatch between action classes (which use constructor injection for dependencies) and Laravel's job system (where the constructor is reserved for serializable operational data). An action queued via Spatie's `QueueableAction` trait or Lorisleiva's dispatch mechanism preserves full constructor dependency injection while becoming dispatchable to any queue. This enables actions to be written once and executed synchronously, asynchronously, or conditionally without changing a single line of business logic.

The engineering significance is that queued actions eliminate the traditional job wrapper class. Instead of writing a job class whose only purpose is to call an action on the worker, the action itself becomes the job. This reduces class count, eliminates indirection, and keeps the action's constructor DI intact — the action never needs to know whether it is running synchronously or on a queue worker.

---

## Core Concepts

### Action vs Job: The Constructor Divide
The fundamental architectural difference between actions and jobs is what their constructor parameters mean:

```
Action constructor  = dependencies (resolved by container, never serialized)
Job constructor     = operational data (serialized to queue, resolved by deserialization)
```

In a job, every constructor parameter is serialized to the queue (or stored in the database for database queues). Models are serialized to their IDs, arrays are serialized to their values. Dependencies cannot be injected because they are not serializable.

In a queued action, the constructor remains for dependencies only. Operational data is passed to the method call. The action instance is re-resolved from the container on the worker, and the method parameters are serialized by a wrapper job.

### The Serialization Boundary
In the queued action pattern, the serialization boundary is the method call, not the constructor:

```
Caller: action = Container::make(ActionClass)  // dependencies injected
        action->onQueue()->handle($data)        // $data serialized

Worker: action = Container::make(ActionClass)  // dependencies re-injected
        action->handle($data)                   // $data deserialized
```

This is the inversion of the job pattern. Jobs serialize the constructor and resolve dependencies via method injection. Actions resolve dependencies via constructor injection and serialize the method parameters.

### Sync-or-Async Transparency
A queued action can be called synchronously or asynchronously from the same call site:

```php
// Synchronous
$this->generatePdfAction->execute($contract);

// Asynchronous
$this->generatePdfAction->onQueue('pdfs')->execute($contract);
```

The action's code does not change. The caller decides the execution mode. This enables development-time synchronous execution (easier debugging) and production-time async execution (better response times) without changing action code.

---

## Mental Models

### Action as Command, Queue as Transport
The action is the command (what to do). The queue is the transport (when to do it). Separating these concerns means the action focuses on correctness of the operation, not the timing of execution. The queue configuration is a deployment concern, not a design concern.

### Action as Self-Dispatching Unit
An action that knows how to queue itself is a self-dispatching unit. It carries both the logic (the `execute()` method) and the dispatch instructions (the `QueueableAction` trait). This is the opposite of the job pattern, where the job is a separate class that knows how to call the action.

### Worker-Side Rehydration
When a queued action executes on the worker, it is a fresh instance — all constructor dependencies are re-resolved from the worker's container. This means:
- Database connections are fresh (no stale connections)
- Config is fresh (no stale config)
- Service instances are fresh (no stale state from the caller's request)

The action is fully rehydrated on the worker, with no residual state from the caller's process.

---

## Internal Mechanics

### Spatie QueueableAction Dispatch Flow

```
caller: $action->onQueue()->execute($data)
  │
  ├── onQueue() returns anonymous class wrapping $this action
  │     └── stores reference to original action object
  │
  ├── anonymous class->execute($data) is called
  │     └── creates new ActionJob($this->action, $parameters = [$data])
  │     └── dispatches ActionJob to queue
  │     └── returns (caller continues)
  │
  Worker:
  ├── ActionJob is deserialized
  │     └── stores $actionClass (string class name)
  │     └── stores $parameters (serialized method args)
  │
  └── ActionJob::handle()
        ├── action = app($actionClass)          // Fresh container resolution
        ├── action->job = $this->job            // Job reference for middleware, tags
        ├── action->{$method}(...$parameters)    // Call the action
        └── action->job = null                   // Clean up
```

### ActionJob Source Mechanics
The `ActionJob` class (`Spatie\QueueableAction\ActionJob`) is the glue between the action pattern and Laravel's queue system:

```php
class ActionJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public string $actionClass,
        public array $parameters,
    ) {}

    public function handle(): void
    {
        $action = app($this->actionClass);
        $action->job = $this->job;
        $method = $action->queueMethod();
        $action->{$method}(...$this->parameters);
    }
}
```

Key insight: `ActionJob` stores only the **class name** and **method parameters** — not the action instance itself. The action is re-resolved from the container on the worker. This is what preserves constructor dependency injection.

### QueueableProperties Propagation
The `ActionJob` resolves queueable properties from the action class before dispatching:

```php
protected function resolveQueueableProperties($action): void
{
    $props = ['connection', 'queue', 'delay', 'tries', 'timeout',
              'maxExceptions', 'retryUntil', 'chainConnection', 'chainQueue'];

    foreach ($props as $property) {
        if (property_exists($action, $property)) {
            $this->{$property} = app($action)->{$property};
        }
    }
}
```

This means the action class can declare queue-specific configuration as public properties:

```php
class GeneratePdfAction
{
    use QueueableAction;

    public string $queue = 'pdf-processing';
    public int $tries = 3;
    public int $timeout = 120;

    public function execute(Contract $contract): Pdf
    {
        // ...
    }
}
```

### queueMethod() Auto-Detection
The `QueueableAction` trait's `queueMethod()` method determines which method to call on the worker:

```php
public function queueMethod(): string
{
    if (method_exists($this, '__invoke')) {
        return '__invoke';
    }
    return 'execute';
}
```

This auto-detects `__invoke()` first, then falls back to `execute()`. Actions using `handle()` as their method name must override `queueMethod()`:

```php
class MyAction
{
    use QueueableAction;

    public function handle(array $data): void { ... }

    protected function queueMethod(): string
    {
        return 'handle';
    }
}
```

---

## Patterns

### Queueable Action with onQueue Fluent API
The fluent API enables per-call queue configuration:

```php
$this->generatePdfAction
    ->onQueue('pdfs')
    ->onConnection('redis')
    ->delay(now()->addMinutes(5))
    ->execute($contract);
```

- **Purpose**: Configure queue behavior at the call site without changing the action class.
- **Benefits**: Queue configuration is caller-specific, not action-specific; the same action can be queued differently from different callers.
- **Tradeoffs**: The fluent API returns an anonymous class each time — each call allocates an object that is immediately discarded.

### Batchable Actions
Actions dispatched via `onQueue()` can participate in Laravel batches:

```php
$batch = Bus::batch([
    $this->generateInvoiceAction->onQueue()->execute($invoice),
    $this->sendReceiptAction->onQueue()->execute($order),
    $this->updateInventoryAction->onQueue()->execute($items),
])->then(function (Batch $batch) {
    // All actions completed
})->dispatch();
```

- **Purpose**: Group related asynchronous actions into a unit with completion callbacks.
- **Benefits**: Actions participate in batches without special batch-aware code.
- **Tradeoffs**: Each action becomes a separate job in the batch — the batch has N jobs for N actions.

### Lorisleiva Dispatch (Without Trait)
Lorisleiva's `laravel-actions` package provides dispatch without a trait:

```php
CreateInvoiceAction::dispatch($order);
```

- **Purpose**: Dispatch an action without importing a trait — the base action class provides dispatch infrastructure.
- **Benefits**: Single static dispatch call; no `onQueue()->execute()` chain.
- **Tradeoffs**: Extends a base class (coupling to the package); less flexible per-call configuration than the fluent API.

### Conditional Dispatch Pattern
Dispatch only when conditions are met:

```php
// Always dispatch (QueueableAction)
$this->sendConfirmationAction->onQueue()->execute($order);

// Conditional dispatch (Laravel Dispatchable trait)
SendConfirmationAction::dispatchIf($order->email !== null, $order);

// Conditional with QueueableAction
if ($order->email) {
    $this->sendConfirmationAction->onQueue()->execute($order);
}
```

- **Purpose**: Avoid dispatching actions when preconditions are not met.
- **Benefits**: Prevents wasted queue jobs for no-op operations.
- **Tradeoffs**: `dispatchIf()` from the `Dispatchable` trait checks the condition after resolving the action — the action is resolved even when not dispatched.

---

## Architectural Decisions

### QueueableAction vs Manual Job Wrapper
Two approaches exist for making actions queueable:

| Aspect | QueueableAction Trait | Manual Job Wrapper |
|--------|----------------------|-------------------|
| Ceremony | Add trait to action | Create job class per action |
| Constructor DI | Preserved (re-resolved on worker) | Must manually call action from job handle() |
| Call syntax | `$action->onQueue()->execute($data)` | `dispatch(new ActionJob($data))` |
| Method params | Auto-serialized via ActionJob | Manual serialization in job constructor |
| Action class | Must import Spatie package | No package dependency |

The `QueueableAction` trait reduces ceremony at the cost of a package dependency. For teams that queue many actions, the trait pays for itself in eliminated job wrapper classes.

### Sync vs Async Decision at Call Site
The decision to dispatch synchronously or asynchronously should be made at the call site, not hardcoded in the action. An action that hardcodes `dispatch()` inside its own method forces async execution on all callers:

```php
// WRONG: action decides execution mode
class SendConfirmationAction
{
    public function execute(Order $order): void
    {
        dispatch(function () use ($order) {   // Forced async
            Mail::to($order->user)->send(...);
        });
    }
}

// RIGHT: caller decides execution mode
$sendConfirmationAction->onQueue()->execute($order); // Caller chooses
```

### Default Queue Configuration
Action-level queue configuration (connection, queue name, retries, timeout) is a policy decision. Two approaches:

1. **Action-declared**: The action declares `public string $queue = 'default'` — queue configuration travels with the action.
2. **Caller-declared**: The caller specifies queue parameters each time — queue configuration is context-dependent.

For actions with predictable queue needs (always send emails on `'mail'` queue), action-declared is cleaner. For actions with context-dependent queue needs (same action, different queues for different tenants), caller-declared is necessary.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Constructor DI preserved on worker | Package dependency for QueueableAction trait | Acceptable for teams with 5+ queued actions |
| Sync-or-async transparency | Caller must remember to use onQueue() | Accidental sync execution when async was intended |
| Action code unchanged between modes | Queueable properties must be declared on action class | Minor coupling of queue configuration to domain logic |
| No job wrapper class needed | ActionJob class still serializes/deserializes per dispatch | ActionJob is framework-managed — developer never interacts with it |
| Batchable without batch-aware code | Each action is a separate queue job | Actions in batches cannot share a single database transaction |

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Fluent API for per-call config | Anonymous class allocation per onQueue() call | Negligible for web requests; measurable in high-throughput daemons |
| Conditional dispatch via dispatchIf | dispatchIf resolves action even when skipped | Use manual if-check for expensive-to-resolve actions |
| queueMethod() auto-detection | Only detects __invoke() or execute() | Teams using handle() must override queueMethod() |

---

## Performance Considerations

### Dispatch Overhead
Each `onQueue()->execute()` call:
1. Resolves the action from the container (constructor DI)
2. Creates an anonymous class wrapping the action
3. Creates an `ActionJob` with the serialized parameters
4. Dispatches the job to the queue

Total overhead: approximately 0.2-0.5ms per dispatch, plus serialization time for complex parameters (Eloquent models with relationships).

### Worker-Side Resolution Overhead
Each queued action on the worker:
1. Deserializes the `ActionJob` (load class name + parameters)
2. Resolves the action from the worker's container (constructor DI)
3. Calls the action's method

The resolution cost is the same as a synchronous action resolution. The worker's container is typically booted once per `php artisan queue:work` iteration and reused across jobs.

### Serialization of Eloquent Models
When an Eloquent model is passed as a method parameter to `onQueue()->execute($model)`, the model is serialized via `SerializesModels` (included in the `ActionJob`). This serializes only the model's class name and primary key. On the worker, the model is re-retrieved from the database. The model's state at dispatch time is NOT preserved — the worker sees the current database state.

### Queue Connection Saturation
If every action in a workflow dispatches sub-actions to the same queue, the queue can become saturated with intermediate jobs before the final job completes. Use separate queues for different action types (e.g., `'mail'` for emails, `'pdfs'` for document generation) to prevent head-of-line blocking.

---

## Production Considerations

### Monitoring Queued Actions
Queued actions appear in the queue system as `ActionJob` entries, not as the action class name. Monitoring tools show `Spatie\QueueableAction\ActionJob` as the job class. The action class name is stored as a property. Configure monitoring to log the action class name for actionable alerts:

```php
// In ActionJob or via middleware
public function handle(): void
{
    $action = app($this->actionClass);
    logger()->info('Processing queued action', [
        'action' => $this->actionClass,
        'job_id' => $this->job->getJobId(),
    ]);
    // ...
}
```

### Retry and Failure Semantics
When a queued action fails, the `ActionJob` retries according to the action's `$tries` or `$retryUntil` configuration. The action is re-resolved from the container on each retry — constructor dependencies are fresh. This means database connections, API clients, and config are all reset. The action does NOT need to handle serialized state across retries — each retry is a clean start.

### Queue-Specific Action Configuration
Action-level queue properties (connection, queue, timeout) are resolved by calling `app($actionClass)` inside `resolveQueueableProperties()`. This means the action IS resolved during dispatch just to read its properties. For actions with expensive constructor dependencies, this adds dispatch-time overhead. Consider using static properties instead of instance properties for queue configuration.

### Octane and Queue Compatibility
Queued actions are Octane-safe because the action is re-resolved from the container on the worker worker — the worker's container is independent of the web request's container. The `ActionJob` stores only the class name string, which is serializable across process boundaries.

---

## Common Mistakes

### Passing Non-Serializable Parameters
Method parameters passed to `onQueue()->execute($param)` must be serializable by Laravel's queue system. Resources, closures, and nested objects without `SerializesModels` support will cause serialization errors. The error occurs at dispatch time, not on the worker, so the job is never queued.

### Forgetting to Call onQueue() Before Execute
Calling `$action->execute($data)` directly (without `onQueue()`) executes the action synchronously. If the intent was async execution, the action runs in the request lifecycle, potentially blocking the response. This is a silent bug — no error, just unexpected behavior.

### Using handle() Without Override
An action using `handle()` as its method name with the `QueueableAction` trait will fail at runtime because `queueMethod()` falls back to `execute()`, which does not exist. The error appears on the worker, not at dispatch:

```
Error: Call to undefined method App\Actions\MyAction::execute()
```

Always override `queueMethod()` when using a non-standard method name.

### Binding Action as Singleton
If an action is bound as a singleton in the container and the action has mutable properties, dispatching two different instances of the same action can cause cross-request contamination. The action should not be a singleton — each dispatch should resolve fresh.

### Passing Too Much Data as Parameters
Passing large arrays or deeply nested models as method parameters increases queue payload size. Redis queues have a 512MB default limit, but large payloads increase serialization time and memory usage on both dispatcher and worker. Pass only the necessary data — IDs instead of full models, pagination params instead of full collections.

---

## Failure Modes

### Stale Model Data on Worker
An action receives `$order` as a parameter. At dispatch time, `$order->status = 'pending'`. When the worker processes the job, `$order->status` has been updated to `'paid'`. The action works with the current database state, not the state at dispatch time. This is correct behavior but can be surprising — the action MUST re-query or rely on fresh database state.

### Transaction Commit Before Dispatch Race
An action dispatched inside a `DB::transaction()` is not actually queued until the transaction commits (if the queue driver supports transactions, like database queue). If the transaction rolls back, the dispatch is also rolled back — the action is never queued. This is usually correct (avoid dispatching for rolled-back operations) but can be surprising if the team expects dispatch to be immediate.

### Anonymous Class Garbage Collection
Each `onQueue()` call creates an anonymous class. In a request that dispatches 100 actions (e.g., batch processing), 100 anonymous classes are allocated and immediately discarded. This is typically fine, but in extreme cases (10,000+ dispatches per request), the anonymous class allocation can cause GC pressure.

### Queue Worker Version Mismatch
If the action class has been updated on the web server but the queue worker is running an older version of the code (deployment race), the worker may try to resolve a class that has been renamed or whose method signature has changed. Always drain queues before deploying incompatible changes.

---

## Ecosystem Usage

### Spatie Laravel Queueable Action
The canonical implementation of the queued action pattern. Provides:
- `QueueableAction` trait (`onQueue()`, `tags()`, `middleware()`, `backoff()`)
- `ActionJob` class (wraps action as a Laravel job)
- `ActionMakeCommand` (`php artisan make:action MyAction`)
- `QueueableActionFake` (testing fakes)
- Config file for customizing the job class

### Lorisleiva Laravel Actions
Provides dispatch without a trait via static `dispatch()` method on the base action class. Also provides `dispatchIf()`, `dispatchSync()`, and `dispatchAfterResponse()`. The base class handles serialization internally.

### Laravel Framework Integration
Laravel's own job ecosystem provides:
- `Dispatchable` trait: `dispatch()`, `dispatchIf()`, `dispatchSync()`, `dispatchAfterResponse()`
- `Queueable` trait: `onConnection()`, `onQueue()`, `delay()`, `chain()`, `through()`
- `Batchable` trait: `batch()`, `batching()`, `withBatchId()`

The Spatie package bridges these framework primitives with the action pattern.

---

## Related Knowledge Units

### Prerequisites
- Action Class Design — understanding the single-method structure and constructor injection pattern
- Service Container Basics — how container resolution works on both web and queue workers

### Related Topics
- Action Composition — how queued actions interact with synchronous action chains
- Transactional Actions — how transaction boundaries affect queued action dispatch timing

### Advanced Follow-up Topics
- Queue Worker Architecture — how workers resolve classes and manage the container lifecycle
- Action Testing — how to test queued actions with fakes without dispatching to a real queue

---

## Research Notes

- Spatie's `QueueableAction` auto-detects method `__invoke()` before `execute()`. This is a design choice from 2019 that still persists. Teams using `handle()` (the most common convention) must override `queueMethod()`. This is a frequent source of worker-side errors.
- The `ActionJob` class resolves the action from the container on the worker via `app($actionClass)`. This works because `$actionClass` is stored as a string. The string is serialized and deserialized — the class name is always available on the worker (assuming the same code version).
- Anonymous class creation per `onQueue()` call was flagged as a performance concern in early versions. Modern PHP (8.0+) handles anonymous class instantiation efficiently, making this a non-issue for typical workloads.
- The `QueueableAction` package predates Laravel's native job middleware system. The package's `middleware()` method on the trait was added later to align with Laravel's `ShouldQueue` middleware support.
- Lorisleiva's dispatch mechanism (`CreateInvoiceAction::dispatch($order)`) does not require a trait because the base action class handles the dispatch infrastructure internally. This is a design tradeoff — ceremony for the common case (single static call) vs coupling to a base class.