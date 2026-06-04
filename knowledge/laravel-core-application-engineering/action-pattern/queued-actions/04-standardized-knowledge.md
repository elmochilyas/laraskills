# ECC Standardized Knowledge — Queued Actions

---

## Metadata

| Field | Value |
|---|---|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Action Pattern |
| **Knowledge Unit** | Queued Actions |
| **Difficulty** | Expert |
| **Category** | Application Architecture — Business Logic Organization |
| **Last Updated** | 2026-06-02 |

---

## Overview

Queued actions solve the architectural mismatch between action classes (which use constructor injection for dependencies) and Laravel's job system (where the constructor is reserved for serializable operational data). An action queued via Spatie's `QueueableAction` trait preserves full constructor dependency injection while becoming dispatchable to any queue. This enables actions to be written once and executed synchronously, asynchronously, or conditionally without changing a single line of business logic.

The engineering significance is that queued actions eliminate the traditional job wrapper class. Instead of writing a job class whose only purpose is to call an action on the worker, the action itself becomes the job. This reduces class count, eliminates indirection, and keeps the action's constructor DI intact — the action never needs to know whether it is running synchronously or on a queue worker.

---

## Core Concepts

### Action vs Job: The Constructor Divide

The fundamental architectural difference between actions and jobs is what their constructor parameters mean. In a job, every constructor parameter is serialized to the queue — dependencies cannot be injected because they are not serializable. In a queued action, the constructor remains for dependencies only. Operational data is passed to the method call. The action instance is re-resolved from the container on the worker.

### The Serialization Boundary

In the queued action pattern, the serialization boundary is the method call, not the constructor. The caller resolves the action from the container (constructor DI), calls `onQueue()->execute($data)` (method params serialized). On the worker, the action is re-resolved from the container (constructor DI), and `execute($data)` is called (method params deserialized).

### Sync-or-Async Transparency

A queued action can be called synchronously or asynchronously from the same call site. Calling `$action->execute($data)` runs synchronously. Calling `$action->onQueue()->execute($data)` dispatches to the queue. The action's code does not change — the caller decides the execution mode.

### ActionJob Mechanics

Spatie's `ActionJob` class is the glue between the action pattern and Laravel's queue system. It stores only the action class name (string) and the method parameters — not the action instance itself. On the worker, it re-resolves the action from the container via `app($actionClass)`. This is what preserves constructor dependency injection.

---

## When To Use

- **QueueableAction trait** when the team queues many actions and wants to eliminate job wrapper classes. The trait pays for itself in reduced class count and ceremony.
- **Manual job wrapper** when the team queues few actions and wants to avoid a package dependency. Each action gets a dedicated job class that calls the action.
- **Lorisleiva dispatch** when the team prefers static dispatch (`CreateInvoiceAction::dispatch($order)`) and is comfortable with a base action class coupling.
- **Fluent onQueue API** when per-call queue configuration (different queues for different callers of the same action) is needed.
- **Batchable actions** when grouped asynchronous operations with completion callbacks are required.

---

## When NOT To Use

- Do NOT use queueable actions for operations that must return a result to the caller — the caller receives an immediate return, not the action's result.
- Do NOT use `QueueableAction` if the action's method parameters are not serializable (resources, closures, deeply nested objects without SerializesModels).
- Do NOT bind an action as a singleton in the container if it uses `QueueableAction` — the mutable properties can leak across requests.
- Do NOT use `dispatchIf()` from Dispatchable trait for actions that are expensive to resolve — `dispatchIf()` resolves the action even when the condition is false.

---

## Best Practices (WHY)

- **Let the caller decide sync vs async.** An action should never hardcode dispatch logic inside its own method. The caller calls `$action->execute()` for sync or `$action->onQueue()->execute()` for async. This keeps the action execution-mode-agnostic.
- **Override queueMethod() when using non-standard method names.** The `QueueableAction` trait auto-detects `__invoke()` first, then `execute()`. Teams using `handle()` must override `queueMethod()` to return `'handle'`. Otherwise the worker fails with "Call to undefined method execute()."
- **Use action-declared queue configuration for predictable queue needs.** For actions that always route to a specific queue (e.g., `GeneratePdfAction` always goes to `'pdfs'`), declare `public string $queue = 'pdfs'` on the action class.
- **Use caller-declared queue configuration for context-dependent needs.** For actions that route differently depending on context (e.g., different queues per tenant), use the fluent API: `$action->onQueue('tenant-42')->execute($data)`.
- **Log the action class name in queue monitoring.** Configure queue monitoring to log `$actionClass` from `ActionJob`, not just the generic `ActionJob` job class name.
- **Drain queues before deploying incompatible changes.** If the action class is renamed or its method signature changes, the queue worker may try to resolve a non-existent method on an outdated action class.

---

## Architecture Guidelines

- **QueueableAction trait** reduces ceremony at the cost of a Spatie package dependency. For teams that queue 5+ actions, the trait pays for itself.
- **ActionJob stores class name, not instance.** Constructor DI is preserved because the action is re-resolved from the worker's container.
- **Worker-side rehydration** means the action gets fresh database connections, fresh config, and fresh service instances on each retry.
- **Anonymous class allocation** per `onQueue()` call is negligible for web requests but measurable in high-throughput daemon processes.
- **Separate queues for different action types** to prevent head-of-line blocking (e.g., `'mail'` for emails, `'pdfs'` for document generation).
- **Serialization of Eloquent models** via `SerializesModels` serializes only the class name and primary key. The worker sees the current database state, not the state at dispatch time.

---

## Performance

Each `onQueue()->execute()` call incurs approximately 0.2-0.5ms overhead: container resolution of the action, anonymous class creation, ActionJob instantiation with serialized parameters, and queue dispatch. On the worker, each queued action deserializes the ActionJob and re-resolves the action (same cost as synchronous resolution). Large payloads (deeply nested models, large arrays) increase serialization time and memory usage. Redis queues have a 512MB default limit for payload size.

---

## Security

Queued actions must ensure that authorization checks happen at execution time on the worker, not just at dispatch time. An action that checks authorization at dispatch time (in the caller's request) assumes the authorization context is still valid when the worker executes. For sensitive operations, re-check authorization on the worker. The worker runs in a different process with different state — the caller's authenticated user may not be the same context.

---

## Common Mistakes

- **Passing non-serializable parameters.** Resources, closures, and nested objects without SerializesModels support cause serialization errors at dispatch time. The job is never queued.
- **Forgetting onQueue() before execute().** Calling `$action->execute($data)` without `onQueue()` executes synchronously. If async was intended, the action blocks the request.
- **Using handle() without overriding queueMethod().** The trait falls back to `execute()`, which does not exist. The error surfaces on the worker, not at dispatch.
- **Binding action as singleton.** Dispatching two instances of the same singleton action can cause cross-request contamination if the action has mutable properties.
- **Passing too much data as parameters.** Large arrays or deeply nested models increase payload size. Pass only the necessary data — IDs instead of full models.
- **Testing dispatch by asserting on database changes.** Detecting dispatch by checking the database assumes the queued action has already executed. In a test without a queue worker, the action was never processed. Assert on the dispatch, not on the worker's output.

---

## Anti-Patterns

- **Action hardcoding its own dispatch.** An action that calls `dispatch(function () { ... })` internally forces async execution on all callers. The caller should decide the execution mode.
- **Transactional action dispatching without afterCommit.** Dispatching a queued action inside a `DB::transaction()` (without afterCommit) can cause the job to be dispatched before the transaction commits — and if the transaction rolls back, the job has already been dispatched for an operation that failed.
- **One queue for all action types.** Saturating a single queue with all action types (emails, PDFs, batch processing) creates head-of-line blocking — a slow PDF generation delays time-sensitive email sends.
- **Assuming the authorization context carries to the worker.** The worker resolves the action fresh. Any authorization state set on the action instance at dispatch time is lost.
- **Testing queued actions through database assertions without a worker.** The test asserts database state that assumes the action has executed, but without a queue worker, the action was never processed. Use `QueueableActionFake` instead.

---

## Examples

### Spatie QueueableAction
```php
class GeneratePdfAction
{
    use QueueableAction;

    public string $queue = 'pdfs';
    public int $tries = 3;
    public int $timeout = 120;

    public function execute(Contract $contract): Pdf
    {
        // Business logic — container DI preserved
    }
}

// Synchronous
$this->generatePdfAction->execute($contract);

// Asynchronous
$this->generatePdfAction->onQueue('pdfs')->execute($contract);

// With per-call configuration
$this->generatePdfAction
    ->onQueue('pdfs')
    ->onConnection('redis')
    ->delay(now()->addMinutes(5))
    ->execute($contract);
```

### Lorisleiva Static Dispatch
```php
// Action class (extends base)
class CreateInvoiceAction extends Action
{
    public function handle(Order $order): Invoice
    {
        // Business logic
    }
}

// Dispatch
CreateInvoiceAction::dispatch($order);
CreateInvoiceAction::dispatchIf($order->isPaid(), $order);
CreateInvoiceAction::dispatchSync($order);
```

### QueueableAction Fake in Tests
```php
public function test_it_dispatches_invoice_generation(): void
{
    QueueableActionFake::fake();

    $action = new CreateOrderAction();
    $order = $action->execute($cart);

    QueueableActionFake::assertPushed(GenerateInvoiceAction::class);
    QueueableActionFake::assertPushed(function (GenerateInvoiceAction $a) use ($order) {
        return $a->orderId === $order->id;
    });
}
```

### Batchable Actions
```php
$batch = Bus::batch([
    $this->generateInvoiceAction->onQueue()->execute($invoice),
    $this->sendReceiptAction->onQueue()->execute($order),
    $this->updateInventoryAction->onQueue()->execute($items),
])->then(function (Batch $batch) {
    // All actions completed
})->dispatch();
```

---

## Related Topics

- **Action Class Design** (prerequisite) — single-method structure and constructor injection pattern.
- **Service Container Basics** (prerequisite) — how container resolution works on both web and queue workers.
- **Action Composition** — how queued actions interact with synchronous action chains.
- **Transactional Actions** — how transaction boundaries affect queued action dispatch timing.
- **Queue Worker Architecture** — how workers resolve classes and manage the container lifecycle.
- **Action Testing** — how to test queued actions with fakes without dispatching to a real queue.

---

## AI Agent Notes

- **Source:** This KU is atomic and well-bounded. No further decomposition needed.
- **Dependencies:** Action Class Design, Queue System (prerequisites). Serves as prerequisite for Action Testing (queued action fakes), Action vs Service vs Use Case.
- **Key inversion:** Action constructor = dependencies (never serialized). Method parameters = operational data (serialized). This is the opposite of the job pattern.
- **queueMethod() auto-detection:** Detects `__invoke()` first, then `execute()`. Teams using `handle()` must override `queueMethod()`.
- **Monitoring caveat:** Queued actions appear as `ActionJob` in queue monitoring, not as the action class name. Configure monitoring to log the action class.
- **Transaction dispatch timing:** Actions dispatched inside a `DB::transaction()` may not actually be queued until the transaction commits (database queue driver).

---

## Verification

| Criterion | Status |
|---|---|
| Metadata complete | ✓ |
| Action vs job constructor divide clear | ✓ |
| When to use / when NOT to use | ✓ |
| Best practices with rationale | ✓ |
| Serialization boundary documented | ✓ |
| Performance analysis | ✓ |
| Security considerations (worker-side auth) | ✓ |
| Common mistakes identified | ✓ |
| Anti-patterns documented | ✓ |
| Code examples for each pattern | ✓ |
| Related topics mapped | ✓ |
