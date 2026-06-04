# ECC Anti-Patterns — Action Composition

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Action Pattern |
| **Knowledge Unit** | Action Composition |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Tower of Actions (Over-Composition)
2. Action with Self-Managed Transaction Inside Composition
3. Shared Mutable State Between Composed Actions
4. Implicit Execution Order via Constructor Parameter Order
5. Circular Composition Dependency

---

## Repository-Wide Anti-Patterns

- Fat Controllers (tower-of-actions variant)
- Business Logic in Models (if composition is avoided)
- Hidden Database Queries (actions with self-managed transactions)
- Shared Mutable State (between composed actions)
- Overengineering (extracting service at 1-2 action dependencies)

---

## Anti-Pattern 1: Tower of Actions (Over-Composition)

### Category
Architecture | Maintainability

### Description
An action class with 4+ action dependencies in its constructor, creating a deeply nested call chain (Action A → B → C → D → E). The action has crossed from composing to orchestrating but retains the `Action` suffix.

### Why It Happens
Developers treat every sub-step as an action without recognizing that 4+ dependencies constitute orchestration. The action accumulates sub-actions gradually — each new dependency seems justified in isolation.

### Warning Signs
- Constructor has 4+ action-type parameters
- `handle()`/`execute()` method exceeds 50 lines
- Call graph requires tracing through 3+ levels of nested actions
- Action name is broad (e.g., `ProcessOrderAction`)

### Why It Is Harmful
The tower is difficult to trace — debugging a single request requires opening 5+ files. The action's single-responsibility identity is lost. Testing requires mocking 5+ sub-actions.

### Real-World Consequences
Debugging production issues requires tracing through 5+ action files. New developers add to the chain rather than extracting a service. The action becomes a dump for workflow logic.

### Preferred Alternative
At 4+ action dependencies, extract to a Service class (`App\Services\{Domain}\{ProcessOrderService}`). The service may have multiple public methods and owns the transaction boundary.

### Refactoring Strategy
1. Count action dependencies. At 4+, create a Service class.
2. Move all action dependencies to the service constructor.
3. Add `DB::transaction()` ownership to the service method.
4. Move `DB::afterCommit()` side-effect calls to the service.
5. Update all callers to use the service instead of the action.
6. Remove the over-composed action class (or rename to service).

### Detection Checklist
- [ ] Count action constructor parameters (threshold: 4)
- [ ] Measure `handle()` line count (threshold: 50)
- [ ] Trace call graph depth

### Related Rules
- Rule: Limit Composition Depth to 3 Action Dependencies

### Related Skills
- Skill: Refactor an Over-Composed Action to a Service

### Related Decision Trees
- Decision: Action Composition Depth — Action vs Service Orchestrator

---

## Anti-Pattern 2: Action with Self-Managed Transaction Inside Composition

### Category
Architecture | Reliability

### Description
A sub-action that calls `DB::transaction()`, `DB::beginTransaction()`, or `DB::commit()` internally, unaware that it may be called inside an outer transaction from an orchestrator.

### Why It Happens
Developers add `DB::transaction()` to every action "for safety," not considering composition context. The sub-action was originally a standalone entry point and was later composed into a workflow without removing the transaction.

### Warning Signs
- `DB::transaction()` call inside a sub-action
- `DB::beginTransaction()` / `DB::commit()` calls
- Sub-action was originally a standalone command-line operation
- Inconsistent behavior between running the action standalone vs composed

### Why It Is Harmful
Inner `DB::transaction()` creates a savepoint, not a true nested transaction. The savepoint can roll back the sub-action's changes without aborting the parent transaction, enabling partial commits. The action becomes unsafe for composition.

### Real-World Consequences
Production data corruption where some writes persist while others roll back within the same request. The bug is non-deterministic — it only manifests when the sub-action is called inside an outer transaction.

### Preferred Alternative
Sub-actions must be transaction-agnostic. The outermost orchestrator (service or top-level action) owns the transaction boundary. Side effects use `DB::afterCommit()`.

### Refactoring Strategy
1. Remove `DB::transaction()`, `DB::beginTransaction()`, `DB::commit()` from all sub-actions.
2. Ensure the orchestrator wraps the full workflow in `DB::transaction()`.
3. Move any side-effect calls (email, webhook, cache clear) to `DB::afterCommit()` inside the orchestrator's transaction.
4. Document that this sub-action is transaction-agnostic.
5. Add architecture tests that forbid `DB::transaction()` in any class that is injected as a dependency.

### Detection Checklist
- [ ] Grep `DB::transaction()` in all `App\Actions\` files
- [ ] Grep `DB::beginTransaction` in all action files
- [ ] Check if actions are injected into other classes (if yes, transactions are forbidden)

### Related Rules
- Rule: Sub-Actions Must Not Manage Their Own Transactions
- Rule: Actions Must Not Manage Their Own Database Transactions

### Related Skills
- Skill: Write a Transaction-Safe Orchestrator with afterCommit Side Effects

### Related Decision Trees
- Decision: Transaction Ownership — Action vs Orchestrator

---

## Anti-Pattern 3: Shared Mutable State Between Composed Actions

### Category
Design | Reliability

### Description
Two or more composed actions communicate by reading/writing shared mutable state — static properties, singleton services, or mutable registries — instead of passing data through return values.

### Why It Happens
Developers find it convenient to store intermediate results in a shared context rather than threading return values through the call chain. It feels like less code at first.

### Warning Signs
- Sub-action A sets state on a singleton service or static property
- Sub-action B reads that state in a later call
- Execution order matters but is not explicit
- Tests must set up shared state before calling the orchestrator

### Why It Is Harmful
Creates implicit temporal coupling — sub-action A must execute before B, but this dependency is hidden in shared state rather than explicit in parameters. In Octane, shared singleton mutable state leaks across requests, causing data corruption.

### Real-World Consequences
Non-deterministic bugs in production under concurrent load. Tests that pass in isolation but fail when run in a different order. Data leakage between users in Octane.

### Preferred Alternative
Pass all data through return values. Sub-action A returns a result DTO; sub-action B accepts that result as a parameter. No shared mutable state.

### Refactoring Strategy
1. Identify all shared mutable state accessed by composed actions.
2. Convert each shared-state write into a return value from the writing action.
3. Update the reading action to accept the data as a parameter.
4. Update the orchestrator to wire the return value to the next action's parameter.
5. Remove the shared mutable state.
6. Add Pest architecture tests forbidding static property writes in actions.

### Detection Checklist
- [ ] Grep for `static::$` or `self::$` writes in action files
- [ ] Grep for singleton service writes in action `handle()` methods
- [ ] Check for execution order assumptions in test setup

### Related Rules
- Rule: Pass Data Through Return Values, Not Shared Mutable State
- Rule: Do Not Compose Actions with Shared Singleton Mutable State

### Related Skills
- Skill: Compose Actions into a Workflow

### Related Decision Trees
- Decision: Data Flow Between Actions — Return Values vs Shared State

---

## Anti-Pattern 4: Implicit Execution Order via Constructor Parameter Order

### Category
Maintainability | Design

### Description
An orchestrating method relies on the declaration order of constructor parameters to imply the execution sequence of sub-actions, rather than making calls explicit in the method body.

### Why It Happens
Developers assume the order of constructor parameters matches the intended execution order. They sequence the calls mentally based on the constructor listing and forget to actually call sub-actions in the method body.

### Warning Signs
- Constructor parameters are declared in a specific order that mirrors the workflow
- The method body calls sub-actions in a different order than the constructor
- Some sub-actions are not called in the method body at all (implied but not executed)
- No comments documenting execution order

### Why It Is Harmful
Constructor parameter order has no semantic meaning in PHP. It can be reorganized for readability without changing execution. This creates hidden coupling where reordering parameters accidentally breaks the workflow.

### Real-World Consequences
A developer reorders constructor parameters for readability. The implied execution order changes silently. A sub-action is called with wrong data from a previous step that now runs after it.

### Preferred Alternative
Sequence all sub-action calls explicitly in the method body. The method body should read as a clear step-by-step workflow.

### Refactoring Strategy
1. In the orchestrating method, write explicit calls to each sub-action in the correct order.
2. Capture return values and pass them to subsequent sub-actions.
3. Remove any code that relies on constructor parameter order.
4. Add a comment at the top of the method documenting the workflow.
5. Write orchestrator tests with `ordered()` mock expectations to lock in the sequence.

### Detection Checklist
- [ ] Are there sub-actions declared in the constructor but not called in `handle()`?
- [ ] Is the call order in the method body different from the constructor declaration order?

### Related Rules
- Rule: Make Sub-Action Execution Order Explicit

### Related Skills
- Skill: Compose Actions into a Workflow
- Skill: Test an Orchestrating Service with Mocked Sub-Actions

---

## Anti-Pattern 5: Circular Composition Dependency

### Category
Architecture | Reliability

### Description
Two or more actions depend on each other directly or transitively (Action A depends on Action B which depends on Action A), creating a cycle that cannot be resolved by the service container.

### Why It Happens
Bidirectional workflows where two operations naturally reference each other. Lack of shared extract. Layering violations where lower-level actions reference higher-level orchestrators.

### Warning Signs
- Action A imports Action B, and Action B imports Action A
- Container throws `BindingResolutionException` at resolution time
- The dependency graph has no clear direction

### Why It Is Harmful
Causes a runtime crash when the container attempts to resolve the circular chain. The error only surfaces when the action is first resolved, not during compilation or autoloading.

### Real-World Consequences
Runtime `BindingResolutionException` in production when a new code path triggers the circular action chain for the first time. Difficult to debug because the stack trace shows the container, not the application logic.

### Preferred Alternative
Extract shared logic to a third class (service, utility, or repository) that both actions depend on. The dependency direction should always be one-way: orchestrator → sub-action.

### Refactoring Strategy
1. Identify the shared logic that causes the cycle (the code that both actions need).
2. Extract that shared logic to a new class (a service, validator, or repository).
3. Update both actions to depend on the extracted class instead of each other.
4. Remove the circular dependency from both constructors.
5. Verify the container can now resolve the action chain.

### Detection Checklist
- [ ] Trace all action dependencies — does any path lead back to the starting action?
- [ ] Has a `BindingResolutionException` occurred during resolution?

### Related Rules
- Rule: Prevent Circular Dependencies Between Actions
