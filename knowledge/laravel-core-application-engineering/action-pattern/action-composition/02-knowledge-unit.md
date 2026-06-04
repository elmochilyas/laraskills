# Action Composition

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Actions Pattern
- **Knowledge Unit:** Action Composition
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

## Executive Summary

Action composition governs how single-operation classes combine to form larger workflows. Unlike inheritance (which couples classes through parent-child relationships), composition keeps each action independently callable, testable, and replaceable. The framework supports composition through its service container — actions inject other actions via their constructor, resolving the full dependency tree at instantiation time.

The engineering significance of composition is that it determines the architecture boundaries of the application. An action that calls 2-3 other action classes is composing a workflow. An action that calls 8+ action classes is orchestrating — and should be a service, not an action. The composition depth threshold (5-8 dependencies) is the primary architectural signal in the action pattern: below the threshold, composition is clean composition; above it, composition becomes orchestration and should be extracted.

---

## Core Concepts

### Constructor Injection Composition
Actions compose by declaring other actions as constructor dependencies. The service container auto-resolves the entire dependency tree.

```php
class CreateContractAction
{
    public function __construct(
        private GeneratePdfAction $generatePdf,
        private StoreContractAction $store,
        private NotifyPartiesAction $notify,
    ) {}
}
```

When `CreateContractAction` is resolved, the container also resolves `GeneratePdfAction`, `StoreContractAction`, and `NotifyPartiesAction` — including all of their transitive dependencies. The composition depth is transparent to the caller.

### Composition vs Orchestration
The distinction between composition and orchestration is a matter of scope and dependency count:

- **Composition**: An action calls 1-3 other actions as part of its single responsibility. The action still has one clear purpose — the sub-actions are implementation details.
- **Orchestration**: An action calls 4+ other actions, coordinates their execution order, manages transactions, and handles failure. The action has ceased to be "one operation" and become a "workflow manager."

The threshold is not exact, but at 5+ action-level dependencies, the class should be renamed to a service (`CreateContractService` instead of `CreateContractAction`).

### Synchronous vs Asynchronous Composition
Actions can compose synchronously (same request, same process) or asynchronously (dispatch to queue, return immediately). The same action class can be called both ways depending on context:

```php
// Synchronous: wait for result
$pdf = $this->generatePdfAction->execute($contract);

// Asynchronous (with Spatie QueueableAction): fire and forget
$this->generatePdfAction
    ->onQueue('high')
    ->execute($contract);
```

The action's internal logic does not change — only the invocation mechanism changes. This is a unique benefit of the queueable action pattern: the action author writes sync logic; the action caller decides sync or async.

---

## Mental Models

### Actions as Lego Bricks
Each action is a single-purpose brick with a standard connector (constructor DI + method call). Bricks can be joined in different arrangements to build different workflows. A brick does not need to know about the other bricks it is joined with — it only needs to fit its socket.

### Composition as Dedicated, Orchestration as Delegation
When an action composes other actions, the composed actions are subtasks of the parent action's single responsibility. When a service orchestrates actions, the service's responsibility is the coordination itself — the service IS the workflow. The distinction is: "I compose because my single operation has steps" vs "I orchestrate because my purpose is coordination."

### The Composition Depth Ceiling
Every action in the composition chain adds resolution time and cognitive load. The first 3 dependencies are easy to reason about: "this action validates, stores, and notifies." The 6th dependency triggers the question: "why does this single operation need 6 other operations?" The depth ceiling is a smell threshold, not a hard limit.

---

## Internal Mechanics

### Dependency Tree Resolution
When the container resolves an action that composes other actions, it recursively resolves each constructor parameter:

```
Container::make(CreateContractAction)
  ├── resolve(GeneratePdfAction)
  │     ├── resolve(PdfGenerator)
  │     └── resolve(StorageService)
  ├── resolve(StoreContractAction)
  │     └── resolve(ContractRepository)
  └── resolve(NotifyPartiesAction)
        ├── resolve(MailService)
        └── resolve(NotificationRepository)
```

Total resolution operations: 1 (root) + 3 (direct deps) + 5 (transitive deps) = 9 resolutions.
After caching (via `php artisan optimize`), resolved services are stored and not re-resolved.

### Fresh Instance Per Resolution
Each `Container::make(Action::class)` creates a new instance. This means:

- Two actions that both depend on `GeneratePdfAction` get the same instance (singleton) if it is bound as such, or different instances otherwise.
- For non-singleton dependencies, each parent action gets its own child action instance.
- This prevents shared state between composition chains — each chain is independent.

### Queueable Composition Chain (Spatie)
When a queueable action composes another queueable action:

```php
class CreateContractAction
{
    use QueueableAction;

    public function execute(ContractData $data): Contract
    {
        $contract = $this->store->execute($data);
        $this->generatePdfAction
            ->onQueue()
            ->execute($contract);   // Dispatched async, returns immediately
        return $contract;
    }
}
```

The `onQueue()->execute()` call creates an anonymous class that dispatches an `ActionJob` to the queue. The parent action returns immediately — the composed action executes on the worker. The parent action MUST NOT depend on the child action's result.

---

## Patterns

### Action Calls Action (Nested Composition)
An action depends on another action directly:

```php
class ProcessRefundAction
{
    public function __construct(
        private ValidateRefundAction $validate,
        private ChargebackAction $chargeback,
    ) {}
}
```

- **Purpose**: Decompose a complex operation into sub-operations without creating a service.
- **Benefits**: Each sub-operation is independently testable; the parent action reads as a sequence of named steps.
- **Tradeoffs**: Increases class count; parent action becomes a mini-orchestrator; depth must be limited.

### Service Orchestrates Actions (Service-Action Complement)
A service composes multiple actions and coordinates them:

```php
class CheckoutService
{
    public function __construct(
        private ValidateCartAction $validateCart,
        private ReserveInventoryAction $reserveInventory,
        private ProcessPaymentAction $processPayment,
        private CreateOrderAction $createOrder,
        private SendConfirmationAction $sendConfirmation,
    ) {}

    public function checkout(Cart $cart, User $user): Order
    {
        return DB::transaction(function () use ($cart, $user) {
            $this->validateCart->execute($cart);
            $this->reserveInventory->execute($cart);
            $payment = $this->processPayment->execute($cart, $user);
            $order = $this->createOrder->execute($cart, $user, $payment);
            DB::afterCommit(fn () => $this->sendConfirmation->execute($order));
            return $order;
        });
    }
}
```

- **Purpose**: Centralize workflow coordination with transaction management and error handling.
- **Benefits**: Clear separation between orchestration (service) and execution (action); transaction boundary is explicit; each action remains independently testable.
- **Tradeoffs**: Adds a service-per-workflow class; service and actions must be kept in sync as requirements change.

### Action Post-Composition (afterCommit Chain)
Actions that must execute after the transaction commits are composed at the orchestration level via `DB::afterCommit()`:

```php
DB::transaction(function () use ($data) {
    $user = $this->createUserAction->execute($data);
    $team = $this->createTeamAction->execute($user, $data);
    DB::afterCommit(fn () => $this->sendWelcomeAction->execute($user, $team));
    return $user;
});
```

- **Purpose**: Ensure side-effect actions (email, webhook, cache clear) only run after the database change is committed.
- **Benefits**: Prevents phantom side effects on rolled-back transactions.
- **Tradeoffs**: The `afterCommit` callback introduces temporal coupling — the callback must not depend on the current database transaction's uncommitted state.

---

## Architectural Decisions

### When Composition Becomes Orchestration
The decision to extract composition into a service is based on dependency count and responsibility scope:

- **4+ action dependencies**: The class is likely orchestrating, not composing. Extract to a service.
- **Transaction management**: If the class manages `DB::transaction()` around composed actions, it is orchestrating. Extract to a service.
- **Error handling across actions**: If the class catches exceptions from composed actions and decides how to proceed (retry, compensate, fail), it is orchestrating.
- **Conditional execution**: If the class decides whether to call composed actions based on runtime conditions, it is orchestrating.

### Composition Order Dependency
If the composed actions are order-dependent (action B requires action A's result), the composition is a pipeline, not a collection. Pipelines should be explicit about ordering — either through the orchestration code or through pipeline pattern.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Action composition preserves single responsibility | Composition adds transitive dependency count | Monitor constructor ARity; extract at 5+ |
| Composed sub-actions are independently testable | Parent action tests must verify composition behavior | Test the parent action's orchestration logic, not sub-action internals |
| Composition tree is transparent to the caller | Deep trees are hard to reason about | Limit composition depth to 2-3 levels |
| Synchronous and async callable from same class | Async composed actions cannot return results to caller | Design actions to work either way |
| Service orchestrators centralize coordination | Every workflow needs a service class | Acceptable tradeoff — services scale with workflow count |

---

## Performance Considerations

### Resolution Overhead Per Composition Level
Each level of composition adds container resolution time. A chain of Action A → Action B → Action C resolves 3 actions + their transitive dependencies. The resolution cost is additive, not multiplicative — each action is resolved once, regardless of how many ancestors depend on it.

### Serialization for Queued Composition
When a queueable action composes other actions synchronously (not via `onQueue()`), all composed actions are resolved on the worker just like the parent — no serialization needed. When a queueable action dispatches another action via `onQueue()`, the dispatched action is serialized to the queue separately, creating two distinct queue jobs.

### Memory in Deep Composition
Each resolved action holds its dependencies in memory for the request lifetime. A composition chain of depth 5 with 10 total resolved classes adds approximately 10-20KB of memory — negligible for individual requests but measurable in long-running Octane processes across thousands of requests.

---

## Production Considerations

### Composition Depth Limits
Establish a team-wide convention for maximum composition depth. A common guideline: "An action may compose up to 3 other actions. At 4+ composed actions, the orchestrator should be a service class." This keeps the distinction between composition and orchestration consistent across the codebase.

### Test Strategy for Composed Actions
- **Unit tests**: Test sub-actions independently with mocked dependencies.
- **Orchestration tests**: Test the orchestrating service with mocked sub-actions to verify call order and data flow.
- **Integration tests**: Test the full composition chain with real collaborators for critical workflows.

### Avoiding Circular Composition
If Action A depends on Action B which depends on Action A, the container throws a circular dependency error. Detect circular compositions through code review — the composition graph should be a directed acyclic graph.

### Composition Documentation
For complex composition chains, document the calling order and data flow explicitly. A comment in the orchestrating method explaining "Step 1 validates, Step 2 reserves, Step 3 pays" is more valuable than forcing every team member to read all sub-action code.

---

## Common Mistakes

### Action Calling More Than 3 Actions
An action with 5+ action dependencies has lost its single-responsibility identity. It is a service wearing an action's name. The extra dependencies should trigger the question: "Should this be a service?"

### Circular Composition
Action A imports Action B which imports Action A. The container detects this at resolution time and throws a `CircularDependencyException`. This is a design error — the two actions share a responsibility that should be extracted to a service.

### Assuming Sub-Action Execution Order
If a parent action's correctness depends on sub-actions executing in a specific order, the composition is tightly coupled. Make the order explicit in the parent method — don't rely on the order of constructor declaration or the container's resolution order.

### Composing Actions With Shared State
If sub-action A sets a state on a shared service that sub-action B reads, the composition has implicit temporal coupling. The parent action must ensure A runs before B, and any refactoring that changes the order breaks the system. Eliminate shared state — pass data through return values.

---

## Failure Modes

### Transaction Confusion in Composed Actions
If a sub-action opens its own transaction and the parent action also opens a transaction, the sub-action's transaction creates a savepoint (not a true nested transaction). If the sub-action's transaction fails and is rolled back, the savepoint rollback may not trigger the parent's rollback, leading to partial commits. The solution: the outermost orchestrator owns the transaction; sub-actions must not manage their own transactions.

### Queueable Action Timing
An action that dispatches a sub-action asynchronously via `onQueue()` cannot depend on the sub-action's result. If the parent action sends a response that includes data the sub-action was supposed to generate, the response will miss data. Design the parent to return immediately and let the sub-action populate data independently.

### Memory Leak in Deep Composition (Octane)
In Octane, if the root action is bound as a singleton in the container, and its composed sub-actions capture per-request data in their properties, the sub-action data leaks across requests. Ensure all composed actions are stateless — no mutable properties set during execution.

---

## Ecosystem Usage

### Laravel Jetstream
Jetstream uses minimal composition — most Jetstream actions perform their operation directly without composing other actions. The orchestration layer in Jetstream is the controller or the Livewire component, which calls a single action per operation.

### Spatie's QueueableAction Package
The package encourages composition by making queueable actions callable from other actions. The `onQueue()` method returns an anonymous fluent class that wraps the action for async dispatch. This enables the sync-or-async pattern without changing the action's internal logic.

### Lorisleiva's Laravel Actions
This package's `runAs` methods (`asObject()`, `asController()`, `asJob()`, `asListener()`, `asCommand()`) enable the same action to be composed differently depending on context. An action that runs as an object in one workflow can run as a job in another without changing its class.

---

## Related Knowledge Units

### Prerequisites
- Action Class Design — understanding the single-method structure is prerequisite to understanding composition
- Service Container Basics — how the container resolves dependency trees

### Related Topics
- Service Orchestration — the complement to action composition at the service level
- Transactional Actions — how transaction boundaries interact with composition

### Advanced Follow-up Topics
- Queued Actions — how async composition differs from sync composition
- Action vs Service vs Use Case — when composition crosses architectural boundaries

---

## Research Notes

- The 3-4 action dependency threshold for composition vs orchestration is a guideline, not a rule. Some production codebases (Spatie packages) have actions with 5+ dependencies that remain cohesive because the domain is naturally complex.
- Circular composition detection is done at container resolution time, not at code analysis time. No static analysis tool in the Laravel ecosystem detects circular action composition — it only surfaces at runtime.
- The `onQueue()` pattern from Spatie creates an anonymous class at call time. This is transparent to the action author but adds a small allocation cost per async dispatch.
- Jetstream's minimal composition is a deliberate simplicity choice — Jetstream actions are designed to be testable in isolation, not composed into deep workflows. This suggests that for complex workflows, service-orchestration is the intended approach even by the framework authors.