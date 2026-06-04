# Anti-Patterns: When to Use Actions

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Architectural Decisions |
| Knowledge Unit | When to Use Actions |
| Classification | Intermediate |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Anemic Action (All Logic in Action, Models Empty) | Architecture | High |
| 2 | Orchestration Sprawl (Action Exceeds 200 Lines) | Maintainability | High |
| 3 | Action-as-Controller (HTTP Concerns in Actions) | Architecture | Critical |
| 4 | Actions for Simple CRUD (Over-Engineering) | Design | Medium |
| 5 | Missing Transaction Scope in Actions | Reliability | Critical |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Affected KUs | Severity |
|---|---|---|
| Mutable State in Action Classes (Cross-Request Leakage) | when-to-use-actions, action-class-patterns | High |
| Actions With HTTP Classes (Request, Response) | when-to-use-actions, action-class-patterns | Critical |
| Single Action With Branching on Mode Argument | when-to-use-actions | High |
| Raw Query Builder Calls in Actions Instead of Model Methods | when-to-use-actions | Medium |
| Actions That Call External Services Directly Without Events | when-to-use-actions | Medium |

---

## Anti-Pattern 1: Anemic Action (All Logic in Action, Models Empty)

### Category
Architecture — Domain Logic in Wrong Layer

### Description
The action class contains all domain logic — validation, state transitions, calculations — while the domain model is an empty property bag with getters and setters. The action tells the model what to do at every step instead of the model encapsulating its own behavior.

### Why It Happens
Developers extract logic from controllers into actions without also pushing domain logic down to models. "Fat actions, anemic models" emerges as the new problem replacing "fat controllers."

### Warning Signs
- Action contains `if ($order->status !== 'pending')` checks
- Action sets model attributes directly: `$order->status = 'cancelled'`
- Action calls `$order->save()` after direct attribute manipulation
- Model has no domain methods (no `cancel()`, `markAsPaid()`, `archive()`)
- Same business logic appears in multiple actions
- Model class has zero public methods beyond accessors and relationships

### Why Harmful
Business rules duplicated across actions are hard to maintain. When a rule changes, developers must update every action that duplicates it. Domain logic is invisible when reasoning about the model — new actions can implement rules inconsistently.

### Real-World Consequences
A `CancelOrderAction` checks `if ($order->status !== 'pending')` and sets `$order->status = 'cancelled'`. Another `BulkCancelOrdersAction` has a different check: `if (in_array($order->status, ['pending', 'processing']))`. When the business rule changes to allow cancellation of shipped orders, the developer must find both actions. One is missed, causing support tickets from customers who can't cancel shipped orders.

### Preferred Alternative
Push domain logic to model methods with invariant enforcement. Actions orchestrate by calling model methods — they should not contain `if` statements about domain state or directly set model attributes.

### Refactoring Strategy
1. Identify all domain rules and state transitions currently in the action
2. Create model methods for each state transition (e.g., `cancel()`, `markAsPaid()`)
3. Move invariant checks (guard clauses) into the model methods
4. Replace direct attribute manipulation in actions with model method calls
5. Remove duplicated business rules from actions

### Detection Checklist
- [ ] Action contains `if` statements about model state (invariants)
- [ ] Action sets model attributes directly instead of calling methods
- [ ] Same business rule appears in multiple action files
- [ ] Model has no domain methods

### Related Rules/Skills/Decision Trees
- **Rule 4**: Push domain logic down to models (`05-rules.md`)
- **Skill 3**: Refactor a God Action into Focused Sub-Actions (`06-skills.md`)
- **Decision Tree**: Model Method vs Action Class (`07-decision-trees.md`)

---

## Anti-Pattern 2: Orchestration Sprawl (Action Exceeds 200 Lines)

### Category
Maintainability — God Action

### Description
An action exceeds 200 lines, coordinating multiple sub-operations in a single method. The action has multiple responsibilities and reasons to change. Testing requires complex setup for all the different paths.

### Why It Happens
New sub-operations are added to the action because "it's the place where this use case is handled." The action grows incrementally.

### Warning Signs
- Action file exceeds 150 lines
- Action's `__invoke()` method exceeds 80 lines
- Action has multiple `if/else` or `match` blocks
- Action has private helper methods used by only part of the logic
- Action tests have long setup sections with many `create()` calls
- Adding a new sub-operation means modifying this action

### Why Harmful
God actions violate SRP. Testing requires understanding all branches. Reuse is impossible — callers must accept all the action does or nothing. Adding a new feature risks breaking existing behavior.

### Real-World Consequences
A `ProcessOrderAction` at 300 lines handles: inventory validation, payment charging, shipment generation, email notification, analytics tracking, and invoice creation. A team wants to skip analytics tracking for test orders. They must add a parameter and conditional logic to the 300-line action, risking regression in all other sub-operations.

### Preferred Alternative
Extract sub-operations into child actions or delegate to model methods. Keep each action under 100 lines.

### Refactoring Strategy
1. Identify natural sub-operation boundaries in the action
2. Extract each sub-operation into a separate child action class
3. Compose the original action by injecting child actions
4. Move tests for sub-operations to the child action test files
5. Ensure the original action reads as a high-level orchestration script

### Detection Checklist
- [ ] Action file > 150 lines
- [ ] Action has 3+ distinct responsibilities
- [ ] Action tests have long setup sections
- [ ] Action has private methods used by only one branch

### Related Rules/Skills/Decision Trees
- **Rule 5**: Create one action per use case (`05-rules.md`)
- **Skill 3**: Refactor a God Action into Focused Sub-Actions (`06-skills.md`)

---

## Anti-Pattern 3: Action-as-Controller (HTTP Concerns in Actions)

### Category
Architecture — Layer Boundary Violation

### Description
An action class imports `Illuminate\Http\Request`, returns `RedirectResponse`, or handles HTTP-specific concerns (session, cookies, status codes). The action is coupled to the web layer and cannot be reused from CLI, queues, or tests.

### Why It Happens
Extracting controller logic into an action without also separating HTTP concerns. The developer moves the code but doesn't change the dependency direction.

### Warning Signs
- Action imports `Illuminate\Http\Request` or `Illuminate\Http\Response`
- Action returns `RedirectResponse` or `JsonResponse`
- Action calls `redirect()`, `back()`, or `response()` helpers
- Action reads from `request()` or `session()`
- Action is testable only with `$this->post()` or `$this->get()` HTTP calls

### Why Harmful
An action coupled to HTTP cannot be dispatched from a queue, called from a CLI command, or tested without simulating HTTP requests. The action's reusability — the primary reason for extracting it — is lost.

### Real-World Consequences
A `RegisterUserAction` returns `RedirectResponse::to('/dashboard')`. When a CLI import script needs to register users, the developer can't use the action because it returns a redirect response. They duplicate the registration logic in a new command, creating two paths for user registration.

### Preferred Alternative
Actions return typed DTOs, model instances, or void. The controller receives the action's result and builds the HTTP response.

### Refactoring Strategy
1. Remove `Request` parameter from action; replace with validated DTO or model
2. Change return type from HTTP response to domain type (model, DTO, void)
3. Move HTTP response construction to the controller
4. Update tests to not use HTTP helpers

### Detection Checklist
- [ ] Action imports `Illuminate\Http\*`
- [ ] Action returns `RedirectResponse` or `JsonResponse`
- [ ] Action test requires `$this->post()` or `$this->get()`
- [ ] Action cannot be called from CLI or queue

### Related Rules/Skills/Decision Trees
- **Rule 3**: Never reference HTTP concerns inside an action (`05-rules.md`)
- **Rule 6**: Wrap cross-aggregate actions in `DB::transaction()` (`05-rules.md`)
- **Skill 2**: Refactor a Fat Controller into Actions (`06-skills.md`)

---

## Anti-Pattern 4: Actions for Simple CRUD (Over-Engineering)

### Category
Design — Unnecessary Indirection

### Description
An action class is created for every CRUD operation, even trivial single-model saves that would be simpler as a model method or inline in the controller. Action proliferation creates unnecessary files for operations with no orchestration.

### Why It Happens
Dogmatic application of "thin controllers" rules — every controller method must delegate to an action. The developer doesn't distinguish between operations that coordinate (need an action) and operations that don't (don't need an action).

### Warning Signs
- Action is under 10 lines and only calls `$model->update()`
- Action has no `DB::transaction()` call
- Action only touches one model
- Action has no side effects (no events, no dispatching)
- Deleting the action would mean moving 3 lines into the controller
- The same pattern exists for all 20 CRUD operations

### Why Harmful
Each trivial action adds a file for a 3-line operation. The development velocity slows from constant file creation and navigation. The real use cases (coordinated operations) are buried among hundreds of trivial actions.

### Real-World Consequences
A project has 80 actions, 50 of which are trivial: `UpdateUserNameAction`, `UpdateUserEmailAction`, `UpdateUserPhoneAction`. Each has 5-10 lines and calls `$user->update([...])`. Navigating to the correct action file takes longer than writing the update inline.

### Preferred Alternative
Use model methods or inline controller code for single-model operations. Reserve actions for operations that coordinate multiple aggregates or have side effects.

### Refactoring Strategy
1. Identify actions under 10 lines with no orchestration
2. Inline each into the controller or convert to a model method
3. Delete the action class and its test file
4. Keep actions that coordinate multiple aggregates, have transaction boundaries, or have side effects

### Detection Checklist
- [ ] Action is under 10 lines with a single `update()` or `save()`
- [ ] Action touches only one model
- [ ] Action has no transaction, no events, no dispatching
- [ ] Action is invoked from exactly one controller method
- [ ] Action would be simpler as inline code

### Related Rules/Skills/Decision Trees
- **Rule 1**: Extract an action when the operation coordinates 2+ aggregates (`05-rules.md`)
- **Decision Tree**: Model Method vs Action Class (`07-decision-trees.md`)
- **Skill 1**: Decide When to Extract an Action (`06-skills.md`)

---

## Anti-Pattern 5: Missing Transaction Scope in Actions

### Category
Reliability — Partial Write Risk

### Description
A cross-aggregate action modifies multiple models without wrapping the operations in `DB::transaction()`. If one operation fails, previous writes are persisted, leaving the system in an inconsistent state.

### Why It Happens
The developer doesn't recognize that the action involves multiple aggregate roots. Or they assume each `save()` call is self-contained.

### Warning Signs
- Action calls `$model1->save()` and `$model2->save()` without `DB::transaction()`
- Action calls methods on two different models that both call `$this->save()`
- Action dispatches events inline without `DB::afterCommit()`
- Debugging reveals partial updates after action failures
- Action does not have a `DB::transaction()` call despite modifying multiple tables

### Why Harmful
Without a transaction, a failure mid-way leaves the database in an inconsistent state. Financial operations lose money (withdrawal without deposit). Business reports show impossible states (order shipped but not paid).

### Real-World Consequences
A `TransferFundsAction` calls `$from->withdraw($amount)` then `$to->deposit($amount)`. The deposit fails due to a constraint violation. The withdrawal is already committed. The customer has lost money without it appearing in the destination account.

### Preferred Alternative
Always wrap cross-aggregate operations in `DB::transaction()`. Use `DB::afterCommit()` for event dispatching.

### Refactoring Strategy
1. Identify all model mutations in the action
2. If 2+ models are mutated, wrap the mutations in `DB::transaction()`
3. Move `event()` calls to `DB::afterCommit(fn () => event(...))`
4. Add rollback tests: assert the database state is unchanged if the action fails

### Detection Checklist
- [ ] Action modifies 2+ models without `DB::transaction()`
- [ ] Action dispatches events without `DB::afterCommit()`
- [ ] Action fails mid-way and leaves partial writes
- [ ] No rollback test exists for the action

### Related Rules/Skills/Decision Trees
- **Rule 6**: Wrap cross-aggregate actions in `DB::transaction()` (`05-rules.md`)
- **Decision Tree**: Model Method vs Action Class (`07-decision-trees.md`)
- **Skill 1**: Decide When to Extract an Action (`06-skills.md`)
