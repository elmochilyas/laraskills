# Phase 5: Queued Actions Rules

---

## Rule: Let the Caller Decide Sync vs Async Execution

---

## Category

Architecture

---

## Rule

An action must never hardcode its own dispatch logic, call `dispatch()`, or force async execution inside its own method body. The caller must decide whether to execute synchronously (`$action->execute($data)`) or asynchronously (`$action->onQueue()->execute($data)`).

---

## Reason

The action's business logic is the same regardless of execution mode. Hardcoding dispatch inside the action makes it impossible for callers to execute synchronously when needed (e.g., during testing, in immediate workflows, or when the result is required for the response). Keeping sync-or-async control at the caller site maximizes flexibility and makes the action execution-mode-agnostic.

---

## Bad Example

```php
class GenerateInvoiceAction
{
    use QueueableAction;

    public function execute(Order $order): Invoice
    {
        // Hardcoded async — caller has no choice:
        dispatch(function () use ($order) {
            $this->generate($order);
        });
        // Always async — even in tests where sync is needed
    }
}
```

---

## Good Example

```php
class GenerateInvoiceAction
{
    use QueueableAction;

    public function execute(Order $order): Invoice
    {
        // Pure business logic — no dispatch awareness
        return $this->generate($order);
    }
}

// Caller decides:
// Sync:
$invoice = $this->generateInvoiceAction->execute($order);
// Async:
$this->generateInvoiceAction->onQueue('pdfs')->execute($order);
```

---

## Exceptions

Actions that are inherently asynchronous and produce no meaningful result (e.g., a logging action that always dispatches to the queue) may default to async execution, but must still provide a synchronous path for testing and emergency use.

---

## Consequences Of Violation

Testing risks: actions that hardcode async cannot be unit-tested without a queue worker. Maintenance risks: callers cannot differentiate between sync and async execution. Scalability risks: forced async execution blocks synchronous workflows that need the result immediately.

---

---

## Rule: Override `queueMethod()` When Using Non-Standard Method Names

---

## Category

Framework Usage

---

## Rule

When using Spatie's `QueueableAction` trait with a method name other than `execute()` or `__invoke()` — specifically `handle()` — the action must override the `queueMethod()` method to return the correct string. Relying on auto-detection for `handle()` is forbidden.

---

## Reason

`QueueableAction` auto-detects the queued method by checking `__invoke()` first, then `execute()`. If neither exists, it falls back to the `queueMethod()` override. If the override is missing and the action uses `handle()`, the trait defaults to `execute()` — which does not exist — causing `Call to undefined method` errors on the queue worker. Detection happens at dispatch time, not on the worker, so the error surface is subtle.

---

## Bad Example

```php
class GeneratePdfAction
{
    use QueueableAction;

    // Default auto-detection looks for execute() or __invoke():
    public function handle(Contract $contract): Pdf
    {
        // Method is "handle" — auto-detection fails
    }
}

// On the worker:
// ActionJob tries to call execute() — Call to undefined method
```

---

## Good Example

```php
class GeneratePdfAction
{
    use QueueableAction;

    // Option A: Use execute() — auto-detected
    public function execute(Contract $contract): Pdf { /* ... */ }

    // Option B: Override queueMethod() for handle()
    public function handle(Contract $contract): Pdf { /* ... */ }

    // Required when using handle():
    public function queueMethod(): string
    {
        return 'handle';
    }
}
```

---

## Exceptions

No exceptions. If the team standardizes on `execute()` as the method name, the override is unnecessary. If using `handle()`, the override is mandatory.

---

## Consequences Of Violation

Reliability risks: silent worker-time errors — the job is dispatched successfully but fails when the worker attempts to call the undefined method. Debugging difficulty: the error message references `ActionJob`, not the action class, making root cause identification harder.

---

---

## Rule: Configure Predictable Queues on the Action, Context-Dependent Queues via Fluent API

---

## Category

Scalability

---

## Rule

Actions that always route to a specific queue must declare `public string $queue` on the action class. Actions that route differently depending on context must use the fluent `onQueue()` API at the call site. Do not mix both approaches for the same action.

---

## Reason

Class-level queue configuration provides predictability — every dispatch of `GeneratePdfAction` goes to the `pdfs` queue. Fluent configuration provides flexibility — the same action can be routed to different queues depending on the caller's context (e.g., per-tenant queues). Mixing both creates confusion about which takes precedence and produces inconsistent queue routing.

---

## Bad Example

```php
class GeneratePdfAction
{
    use QueueableAction;

    public string $queue = 'pdfs';  // Class-level config
}

// But one caller also uses onQueue():
$this->generatePdfAction
    ->onQueue('urgent-pdfs')  // Does this override? Confusing
    ->execute($contract);
```

---

## Good Example

```php
// Predictable queue — declared on the action:
class GeneratePdfAction
{
    use QueueableAction;
    public string $queue = 'pdfs';
}

// Context-dependent queue — caller decides:
class TenantEmailService
{
    public function send(Tenant $tenant, Email $email): void
    {
        $this->sendEmailAction
            ->onQueue('tenant-' . $tenant->id)
            ->execute($email);
    }
}
```

---

## Exceptions

No exceptions. Class-level and call-site queue configuration serve different use cases and should not be mixed for the same action.

---

## Consequences Of Violation

Reliability risks: queue routing becomes non-deterministic and hard to trace. Maintenance risks: developers cannot tell where an action will be queued without reading all call sites. Scalability risks: queue configuration conflicts cause head-of-line blocking or queue underutilization.

---

---

## Rule: Log the Action Class Name in Queue Monitoring

---

## Category

Maintainability

---

## Rule

Queue monitoring tools must be configured to log the action class name from `ActionJob::$actionClass`. Monitoring dashboards must display the action class name, not just the generic `ActionJob` job class name.

---

## Reason

Spatie's `ActionJob` is the class that actually gets queued. Without logging the action class name, queue monitoring shows every queued action as "ActionJob" — indistinguishable. This makes it impossible to know which actions are queued, how many times each action runs, or which actions are failing.

---

## Bad Example

```php
// Default monitoring shows only "ActionJob":
Queue::after(function (JobProcessed $event) {
    Log::info('Job processed', [
        'job' => $event->job->resolveName(),  // Always "ActionJob"
    ]);
});
```

---

## Good Example

```php
Queue::after(function (JobProcessed $event) {
    $job = $event->job->resolve();
    Log::info('Job processed', [
        'action' => $job->actionClass ?? $event->job->resolveName(),
        'job' => $event->job->resolveName(),
    ]);
});

// Or configure Horizon custom monitoring:
// 'waits' => [
//     'actionClass' => 'App\Actions\*',
// ],
```

---

## Exceptions

Projects using Horizon or Laravel Pulse with default job class monitoring may not need custom logging if the action class name appears in the job payload metadata.

---

## Consequences Of Violation

Maintenance risks: queue failures cannot be attributed to specific action classes. Operational risks: teams cannot monitor queue performance per action type. Debugging difficulty: identifying which queued action is failing requires inspecting serialized job payloads individually.

---

---

## Rule: Drain Queues Before Deploying Incompatible Action Changes

---

## Category

Reliability

---

## Rule

Before deploying changes that rename an action class, change its method signature, or remove an action, the queue must be drained of all pending jobs that reference the old class or signature.

---

## Reason

Queued actions are serialized with the action class name as a string. When a worker picks up a pending job that references a renamed or modified action class, it attempts to resolve the class name from the container — which fails with a `ClassNotFoundException` or a method resolution error. The failed job is either retried (infinite failure loop) or moved to failed_jobs, losing the operation entirely.

---

## Bad Example

```php
// Deploy 1: Action exists
class GenerateInvoiceAction { public function execute(Order $order): void { /* ... */ } }

// Queue gets 100 pending GenerateInvoiceAction jobs

// Deploy 2: Action is renamed to CreateInvoiceAction (without draining)
// Workers try to resolve "GenerateInvoiceAction" — Class not found
// 100 jobs fail in an infinite retry loop
```

---

## Good Example

```php
// Step 1: Stop queue workers
// php artisan horizon:pause

// Step 2: Wait for pending jobs to complete
// php artisan horizon:status

// Step 3: Clear remaining jobs if needed
// php artisan queue:clear

// Step 4: Deploy the change (rename, signature change, or removal)
// Step 5: Restart queue workers
// php artisan horizon:continue
```

---

## Exceptions

If the change is backward-compatible (adding a new method, adding an optional parameter with a default value), queue draining is unnecessary. Purely additive changes are safe.

---

## Consequences Of Violation

Reliability risks: pending jobs fail and enter infinite retry loops. Operational risks: data loss — the operation the action was supposed to perform is never executed. Debugging difficulty: failures reference the old class name, which no longer exists in the codebase.

---

---

## Rule: Do Not Use Queueable Actions for Operations That Must Return a Result

---

## Category

Design

---

## Rule

Actions whose callers depend on a return value — a created model, a computed result, or a confirmation — must not be dispatched to the queue. `onQueue()->execute()` returns immediately without the action's result.

---

## Reason

Queued actions execute in a separate process. The `onQueue()->execute()` call returns `void` immediately — the caller never receives the action's return value. If the caller needs the result for the response, subsequent operations, or error handling, queuing the action is architecturally incorrect. The action must execute synchronously.

---

## Bad Example

```php
class PlaceOrderService
{
    public function placeOrder(Cart $cart): Order
    {
        // Result is needed for response, but action is queued:
        $this->createOrderAction
            ->onQueue()
            ->execute($cart);
        // Returns void — $order is never captured
    }
}
```

---

## Good Example

```php
class PlaceOrderService
{
    public function placeOrder(Cart $cart): Order
    {
        // Synchronous — result is captured:
        $order = $this->createOrderAction->execute($cart);

        // Side effects are queued separately:
        $this->sendConfirmationAction
            ->onQueue('emails')
            ->execute($order);

        return $order;
    }
}
```

---

## Exceptions

Operations where the caller does not need the return value — notification actions, logging actions, cache-warming actions — are appropriate candidates for queued dispatch. The caller should document that the return value is intentionally discarded.

---

## Consequences Of Violation

Reliability risks: callers may attempt to use the void return as a result, causing type errors or null reference errors. Design risks: the action's contract promises a return value but never delivers it. Maintenance risks: developers refactoring synchronous actions to queued dispatch introduce subtle bugs.

---

---

## Rule: Do Not Bind Queueable Actions as Singletons

---

## Category

Reliability

---

## Rule

Actions that use the `QueueableAction` trait must not be bound as singletons in the service container. The container must resolve a fresh instance for each dispatch.

---

## Reason

When a queueable action is bound as a singleton, its mutable properties persist across dispatches. If the action is compiled synchronously in the request lifecycle and then dispatched asynchronously to the queue, the queue worker receives the same singleton instance — with any state mutated during the request still present. This causes cross-request data contamination and non-deterministic behavior.

---

## Bad Example

```php
// Service provider:
$this->app->singleton(GeneratePdfAction::class);

// Controller dispatches the action multiple times:
$this->generatePdfAction->onQueue()->execute($contract);
$this->generatePdfAction->onQueue()->execute($contract2);
// Both dispatches may share state from the singleton instance
```

---

## Good Example

```php
// Service provider — no binding (transient by default):
// $this->app->singleton(GeneratePdfAction::class); // Forbidden
// Container resolves fresh instance per dispatch by default

// Controller dispatches:
$this->generatePdfAction->onQueue()->execute($contract);
// Fresh instance for each dispatch
```

---

## Exceptions

Actions whose constructor dependencies are all stateless (pure services, gateways, HTTP clients) and whose `execute()` method never assigns to `$this` may be singleton-safe. This requires explicit documentation and a Pest architecture test verifying no mutable properties are set during execution.

---

## Consequences Of Violation

Reliability risks: data contamination between dispatches. Security risks: one dispatch's data leaking into another dispatch's computation. Debugging difficulty: non-deterministic failures that are hard to reproduce because they depend on dispatch timing.

---

---

## Rule: Do Not Pass Non-Serializable Parameters to Queued Action Methods

---

## Category

Reliability

---

## Rule

Method parameters passed to queued action `execute()` calls must be serializable. Resources, closures, anonymous classes, and deeply nested objects without `SerializesModels` support must never be passed as queued action parameters.

---

## Reason

When an action is dispatched via `onQueue()->execute($data)`, the method parameters are serialized for the queue payload. Non-serializable values (resources, closures) cause serialization errors at dispatch time. Deeply nested objects without the `SerializesModels` trait cause partial serialization or fatal errors on the worker.

---

## Bad Example

```php
class SendReportAction
{
    use QueueableAction;

    public function execute(Closure $callback, $resource): void
    {
        // Closures and resources are NOT serializable
    }
}

// Dispatch — will throw a serialization error:
$this->sendReportAction
    ->onQueue()
    ->execute(fn () => 'callback', fopen('file.csv', 'r'));
```

---

## Good Example

```php
class SendReportAction
{
    use QueueableAction;

    public function execute(int $reportId, array $recipients): void
    {
        // Pass only serializable data — IDs instead of objects
        $report = Report::findOrFail($reportId);
        // Worker rehydrates data from the database
    }
}

// Dispatch — safe:
$this->sendReportAction
    ->onQueue()
    ->execute($report->id, ['admin@example.com']);
```

---

## Exceptions

Eloquent models passed as queued action parameters are safe if the model class uses the `SerializesModels` trait (or extends `Model`, which includes it). The model is serialized as `class_name:id` and re-retrieved from the database on the worker.

---

## Consequences Of Violation

Reliability risks: serialization errors prevent the job from being queued — the operation is silently lost. Debugging difficulty: serialization errors surface at dispatch time with cryptic messages about object types. Testing risks: tests that do not serialize parameters may pass while production dispatch fails.

---
