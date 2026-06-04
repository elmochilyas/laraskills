# ECC Standardized Knowledge — Action Composition

---

## Metadata

| Field | Value |
|---|---|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Action Pattern |
| **Knowledge Unit** | Action Composition |
| **Difficulty** | Advanced |
| **Category** | Application Architecture — Business Logic Organization |
| **Last Updated** | 2026-06-02 |

---

## Overview

Action composition governs how single-operation classes combine to form larger workflows. Unlike inheritance (which couples classes through parent-child relationships), composition keeps each action independently callable, testable, and replaceable. The framework supports composition through its service container — actions inject other actions via their constructor, and the container resolves the full dependency tree at instantiation time.

The engineering significance of composition is that it determines the architecture boundaries of the application. An action that calls 2-3 other action classes is composing a workflow. An action that calls 5+ action classes is orchestrating — and should be a service, not an action. The composition depth threshold (5-8 dependencies) is the primary architectural signal in the action pattern: below the threshold, composition is clean; above it, extraction to a service is needed.

---

## Core Concepts

### Constructor Injection Composition

Actions compose by declaring other actions as constructor dependencies. The service container auto-resolves the entire dependency tree. When `CreateContractAction` is resolved, the container also resolves `GeneratePdfAction`, `StoreContractAction`, and `NotifyPartiesAction` — including all of their transitive dependencies.

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

### Composition vs Orchestration

- **Composition**: An action calls 1-3 other actions as part of its single responsibility. Sub-actions are implementation details.
- **Orchestration**: An action calls 4+ other actions, coordinates execution order, manages transactions, and handles failure. The class should be a service.

### Dependency Tree Resolution

When the container resolves an action that composes other actions, it recursively resolves each constructor parameter. Each `Container::make(Action::class)` creates a new instance — composition chains are independent and do not share state unless dependencies are explicitly bound as singletons.

### Synchronous vs Asynchronous Composition

Actions can compose synchronously (same request, same process) or asynchronously (dispatch to queue via `onQueue()`). The same action class can be called both ways depending on context. The action's internal logic does not change — only the invocation mechanism changes.

---

## When To Use

- **Action-calls-action composition** when a complex operation can be decomposed into independently testable sub-operations without creating a service layer.
- **Service-orchestrates-actions composition** when a workflow coordinates 4+ actions, manages transactions, and handles cross-action error conditions.
- **afterCommit composition** when side-effect actions (email, webhook, cache clear) must only execute after the database transaction commits.
- **Queueable composition** when an action dispatches sub-actions asynchronously and does not depend on their results.

---

## When NOT To Use

- Do NOT compose actions when the composition depth exceeds 3-4 actions — extract the orchestrator to a service.
- Do NOT compose actions with circular dependencies — Action A depending on Action B which depends on Action A creates a container resolution error.
- Do NOT compose actions with shared mutable state — sub-actions that read/write shared service state create implicit temporal coupling.
- Do NOT compose actions that manage their own transactions inside an outer transaction — savepoint semantics are confusing and often incorrect.

---

## Best Practices (WHY)

- **Limit composition depth to 3 actions per action.** Beyond this threshold, the action is orchestrating, not composing. An extra dependency should trigger the question: "Should this be a service?" This keeps the boundary between composition and orchestration explicit.
- **Make sub-action execution order explicit.** Do not rely on constructor declaration order or container resolution order. The parent method should clearly sequence the calls: "Step 1 validates, Step 2 reserves, Step 3 pays."
- **Pass data through return values, not shared state.** Sub-action A should not set state on a shared service that sub-action B reads. Pass data through return values to eliminate temporal coupling.
- **Document composition chains.** For workflows with 3-4 composed actions, document the calling order and data flow in a comment in the orchestrating method.
- **Test each action independently.** Sub-actions have their own test classes. The orchestrator is tested with mocked sub-actions to verify call order and data flow.

---

## Architecture Guidelines

- **Composition depth limit:** Maximum 3-4 action dependencies per action class. At 4+, extract to a service.
- **Transaction ownership:** The outermost orchestrator owns the transaction. Sub-actions must not manage their own transactions.
- **Circular dependency detection:** Detect through code review — the container detects circular composition only at runtime.
- **Queueable composition:** An action that dispatches a sub-action asynchronously via `onQueue()` cannot depend on the sub-action's result. Design for immediate return.
- **Singleton safety:** Ensure all composed actions are stateless — no mutable properties set during execution. In Octane, singleton-bound actions with mutable properties leak across requests.
- **Test strategy:** Unit tests for sub-actions with mocked dependencies; orchestration tests for the orchestrating service with mocked sub-actions; integration tests for critical workflows with real collaborators.

---

## Performance

Each level of composition adds container resolution time. A chain of Action A → Action B → Action C resolves 3 actions plus their transitive dependencies. The resolution cost is additive (each action resolved once), not multiplicative. After OpCache and container caching, resolved services are stored and not re-resolved. Each resolved action holds its dependencies in memory for the request lifetime — a depth-5 chain with 10 total resolved classes adds approximately 10-20KB of memory, negligible for individual requests but measurable in Octane across thousands of requests.

---

## Security

No direct security implications. Composition does not affect authentication, authorization, or input validation. However, composition chains can obscure access control if authorization checks are buried deep in the dependency tree. Ensure that authorization-aware actions (those that check policies or gates) are not called in a composition chain where their authorization context is unclear. Authorization should be visible at the orchestration level, not hidden in sub-actions.

---

## Common Mistakes

- **Action with 5+ action dependencies.** The action has lost its single-responsibility identity and is a service wearing an action's name.
- **Circular composition.** Action A imports Action B which imports Action A. The container detects this at resolution time, but the error surfaces at runtime, not in static analysis.
- **Assuming sub-action execution order based on constructor parameter order.** The order of constructor declaration does not determine execution order — the parent method must explicitly sequence calls.
- **Composing actions with shared mutable state.** Sub-action A sets state that sub-action B reads, creating implicit coupling. Pass data through return values instead.
- **Queueable action dispatching sub-actions synchronously when async was intended.** Calling `$action->execute()` instead of `$action->onQueue()->execute()` runs the sub-action in the request lifecycle.

---

## Anti-Patterns

- **Tower of actions.** Action A calls B, B calls C, C calls D, D calls E — a chain of 5+ nested actions. The cognitive load of tracing the call graph is too high. Extract intermediate orchestrators.
- **Action that both owns a transaction and composes sub-actions.** This is neither a clean action nor a clean service. The class manages a transaction boundary AND orchestrates sub-actions — it should be a service.
- **Transaction confusion in composed chains.** Sub-action opens its own transaction inside the parent's transaction. The inner "transaction" is actually a savepoint. A rollback in the sub-action does not propagate to the parent. Partial commits are possible.
- **Anonymous class leak in queueable composition.** Each `onQueue()` call creates an anonymous class. In a request that dispatches 100 actions, 100 anonymous classes are allocated and immediately discarded. Acceptable for typical workloads, but GC pressure is possible at extreme scale.

---

## Examples

### Action Calls Action (Nested Composition)
```php
class ProcessRefundAction
{
    public function __construct(
        private ValidateRefundAction $validate,
        private ChargebackAction $chargeback,
    ) {}

    public function execute(RefundData $data): Refund
    {
        $this->validate->execute($data);
        return $this->chargeback->execute($data);
    }
}
```

### Service Orchestrates Actions
```php
class CheckoutService
{
    public function __construct(
        private ValidateCartAction $validateCart,
        private ProcessPaymentAction $processPayment,
        private CreateOrderAction $createOrder,
        private SendConfirmationAction $sendConfirmation,
    ) {}

    public function checkout(Cart $cart, User $user): Order
    {
        return DB::transaction(function () use ($cart, $user) {
            $this->validateCart->execute($cart);
            $payment = $this->processPayment->execute($cart, $user);
            $order = $this->createOrder->execute($cart, $user, $payment);
            DB::afterCommit(fn () => $this->sendConfirmation->execute($order));
            return $order;
        });
    }
}
```

### Queueable Composition
```php
class CreateContractAction
{
    use QueueableAction;

    public function execute(ContractData $data): Contract
    {
        $contract = $this->store->execute($data);
        // Async — returns immediately, executes on worker
        $this->generatePdfAction
            ->onQueue('pdfs')
            ->execute($contract);
        return $contract;
    }
}
```

---

## Related Topics

- **Action Class Design** (prerequisite) — single-method structure and constructor injection.
- **Service Container Basics** (prerequisite) — how the container resolves dependency trees.
- **Service Orchestration** — the complement to action composition at the service level.
- **Transactional Actions** — how transaction boundaries interact with composition.
- **Queued Actions** — how async composition differs from sync composition.
- **Action vs Service vs Use Case** — when composition crosses architectural boundaries.

---

## AI Agent Notes

- **Source:** This KU is atomic and well-bounded. No further decomposition needed.
- **Dependencies:** Action Class Design, Service Container Basics (prerequisites). Serves as prerequisite for Transactional Actions, Queued Actions.
- **Key threshold:** 3-4 action dependencies is the composition vs orchestration boundary. At 4+, extract to a service.
- **Composition rule:** Sub-actions must not manage their own transactions. The outermost orchestrator owns the transaction boundary.
- **Queueable composition:** Sub-actions dispatched via `onQueue()` cannot return results to the parent. Actions must be designed to work either synchronously or asynchronously.

---

## Verification

| Criterion | Status |
|---|---|
| Metadata complete | ✓ |
| Composition vs orchestration distinction clear | ✓ |
| When to use / when NOT to use | ✓ |
| Best practices with rationale | ✓ |
| Depth threshold documented (3-4) | ✓ |
| Performance analysis | ✓ |
| Security considerations | ✓ |
| Common mistakes identified | ✓ |
| Anti-patterns documented | ✓ |
| Code examples for each pattern | ✓ |
| Related topics mapped | ✓ |
