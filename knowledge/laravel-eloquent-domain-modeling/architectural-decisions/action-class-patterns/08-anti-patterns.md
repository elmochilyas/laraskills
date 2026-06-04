# Anti-Patterns: Action Class Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Architectural Decisions |
| Knowledge Unit | Action Class Patterns |
| Classification | Advanced |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | God Action | Architectural | High |
| 2 | Action-as-Controller | Architectural | High |
| 3 | Container Resolution in Method Body | Maintainability | Critical |
| 4 | Pre-emptive Action Proliferation | Design | Medium |
| 5 | Transaction Boundary Neglect | Reliability | Critical |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Affected KUs | Severity |
|---|---|---|
| Mixing Sync and Queue in Same Action | action-class-patterns, when-to-use-actions | Medium |
| Returning Raw Arrays Instead of Typed Results | action-class-patterns, when-models-are-enough | High |
| Passing Raw Request Input to Actions | action-class-patterns, when-to-use-actions | Critical |
| Dispatching Events Inside Open Transactions | action-class-patterns, framework-decoupling | High |
| Base Action Inheritance for All Actions | action-class-patterns, framework-decoupling | Medium |

---

## Anti-Pattern 1: God Action

### Category
Architectural — Single Responsibility Violation

### Description
A single action class handles multiple related but distinct use cases, using conditional branching (`if`/`else` or `switch`) to determine which operation to execute. The class accumulates responsibilities beyond its original use case, growing beyond 150 lines and requiring multiple reasons to change.

### Why It Happens
Developers add a new parameter or flag to an existing action instead of creating a new class, believing it reduces duplication or follows DRY too literally. Time pressure and reluctance to create new files also contribute.

### Warning Signs
- Action class exceeds 150 lines
- Method signature includes an enum or string parameter used for branching: `__invoke(Order $order, string $mode)`
- Multiple `if/else` or `match` blocks switch on input flags
- Helper methods in the action are used by only one branch of logic
- Constructor contains rarely-used dependencies for specific branches

### Why Harmful
Violates the Single Responsibility Principle — the action has multiple reasons to change (each branch corresponds to a different stakeholder or use case). Testing requires complex setup for each branch, and adding a new use case risks breaking existing ones. The class becomes a dumping ground that developers fear to refactor.

### Real-World Consequences
A `ProcessPaymentAction` that handles credit card, PayPal, and bank transfer with flags becomes untestable (all 3 paths must be mocked). When the credit card gateway changes, the developer must touch the same class and risks breaking bank transfers. New team members cannot understand the full scope of the class at a glance.

### Preferred Alternative
One action per use case: `PayWithCreditCardAction`, `PayWithPayPalAction`, `PayWithBankTransferAction`. Shared logic lives in a composable sub-action or a model method.

### Refactoring Strategy
1. Identify each distinct branch path; create a new action class for each one
2. Extract shared logic into model methods or sub-actions
3. Replace branching with polymorphism or a factory that selects the correct action
4. Move tests for each branch to the corresponding new action's test file
5. Delete the original God Action after verifying all call sites are updated

### Detection Checklist
- [ ] Action has a mode/type parameter used for branching
- [ ] Action exceeds 100 lines
- [ ] Action tests use `describe` or comments to label different scenarios
- [ ] Same action is invoked from multiple routes with different flags

### Related Rules/Skills/Decision Trees
- **Rule 6**: Limit actions to one use case and under 100 lines (`05-rules.md`)
- **Skill 2**: Refactor Inline Controller Logic into an Action (`06-skills.md`)
- **Decision 3**: Single Action vs Sub-Action Composition (`07-decision-trees.md`)

---

## Anti-Pattern 2: Action-as-Controller

### Category
Architectural — Layer Boundary Violation

### Description
An action class returns HTTP responses (e.g., `RedirectResponse`, `Response`, `JsonResponse`), receives `Illuminate\Http\Request` as a parameter, or performs HTTP-specific concerns like session manipulation or cookie setting. This couples a use-case action to the web layer, making it unusable from queues, CLI commands, and API routes.

### Why It Happens
It is convenient to copy-paste controller logic into an action and leave the HTTP handling intact. Controllers that invoke the action and then discard the result still require the action to orchestrate HTTP details. Developers treat actions as "extracted controller methods" rather than use-case boundaries.

### Warning Signs
- Action imports `Illuminate\Http\Request`, `RedirectResponse`, or `Response`
- Action sets session flash messages or cookies
- Action returns a redirect or JSON response
- Action is invoked from a controller that does nothing else
- Action cannot be unit-tested without creating a fake Request object

### Why Harmful
The action becomes tightly coupled to the HTTP layer. It cannot be called from a queue job without faking request objects, cannot be reused in a CLI command, and cannot be tested without Laravel's HTTP test helpers. The fundamental purpose of an action — a named, testable use-case boundary — is defeated.

### Real-World Consequences
A `RegisterUserAction` returns `RedirectResponse::to('/dashboard')`. When the marketing team needs to call the same registration logic from a CLI import script, the developer must either duplicate the logic or refactor the action to remove the HTTP dependency. Meanwhile, the CLI import continually breaks when the HTTP response logic changes.

### Preferred Alternative
Actions return typed DTOs, model instances, `void`, or `bool`. The controller receives the action's result and builds the HTTP response.

### Refactoring Strategy
1. Change the return type from HTTP response to a typed domain result (DTO, Model, or void)
2. Remove `Request` parameter; replace with validated DTO or scalar parameters
3. Move HTTP concerns (redirect, flash messages, cookies) to the controller
4. Update the controller to build the HTTP response from the action's return value
5. Write a unit test for the action using only PHP assertions (no HTTP helpers)

### Detection Checklist
- [ ] Action returns `RedirectResponse`, `Response`, or `JsonResponse`
- [ ] Action imports from `Illuminate\Http`
- [ ] Action has `Request` as a typed parameter
- [ ] Action test requires `$this->get('/...')` or `$this->post('/...')`

### Related Rules/Skills/Decision Trees
- **Rule 7**: Never pass raw request input to actions (`05-rules.md`)
- **Skill 2**: Refactor Inline Controller Logic into an Action (`06-skills.md`)
- **Decision 1**: Action Class vs Model Method vs Inline Controller Logic (`07-decision-trees.md`)

---

## Anti-Pattern 3: Container Resolution in Method Body

### Category
Maintainability — Hidden Dependency

### Description
Using `app()`, `resolve()`, or `make()` inside an action's method body to obtain dependencies instead of injecting them through the constructor. This creates hidden coupling to the service container that cannot be mocked in tests and bypasses static analysis detection of missing dependencies.

### Why It Happens
Quick prototyping — it is faster to write `$gateway = app(PaymentGateway::class)` than to add a constructor parameter. Developers are unaware of the testing cost. Legacy code that was refactored into actions without restructuring dependencies.

### Warning Signs
- Calls to `app()`, `resolve()`, `make()`, or `App::make()` inside the method body
- Action tests use `$this->instance()` or `$this->swap()` to bind mocks into the container
- Action has zero constructor parameters but uses multiple services
- Action tests rely on `Config::set()` or `Event::fake()` instead of direct mocking

### Why Harmful
The action's true dependencies are hidden from callers and static analysis tools. PHPStan cannot detect when a required service is missing. Tests must configure the service container instead of simply constructing the class, making tests slower and more brittle. The class signature no longer documents its requirements.

### Real-World Consequences
A `ProcessRefundAction` calls `app(Gateway::class)` internally. When the Gateway interface gains a new method, PHPStan does not flag the action, but the production call fails at runtime. The test mocks the Gateway via `$this->swap(Gateway::class, $mock)`, which stops working when the binding key changes. A new developer reading the action sees no constructor and assumes it has no dependencies.

### Preferred Alternative
Constructor injection for all dependencies. Use promoted properties with `private readonly` where possible. For conditionally-resolved dependencies, inject a factory in the constructor.

### Refactoring Strategy
1. Identify all `app()`/`resolve()`/`make()` calls in the method body
2. Move each to a constructor parameter with a proper type hint
3. Remove the container calls from the method body; replace with `$this->` references
4. Update tests to construct the action directly with mocked dependencies
5. Remove any `$this->instance()` or `$this->swap()` calls from tests

### Detection Checklist
- [ ] `app(`, `resolve(`, or `make(` appears in the method body
- [ ] Action has fewer constructor parameters than services used
- [ ] Tests use `$this->instance()` or `$this->swap()` for the action under test
- [ ] Static analysis misses interface changes used only in the method body

### Related Rules/Skills/Decision Trees
- **Rule 2**: Never use `app()` or `resolve()` inside action methods (`05-rules.md`)
- **Decision 4**: Constructor Injection vs Container Resolution Inside Method (`07-decision-trees.md`)
- **Skill 1**: Create an Action Class (`06-skills.md`)

---

## Anti-Pattern 4: Pre-emptive Action Proliferation

### Category
Design — Unnecessary Indirection

### Description
Creating action classes for every controller method, including trivial CRUD saves that only mutate a single model. This results in dozens or hundreds of action classes with no orchestration logic — each one merely calls `$model->save()` or `$model->update()` with validated data.

### Why It Happens
Dogmatic application of "thin controllers" without considering whether orchestration actually exists. Team standards that mandate actions for all write operations. Scaffolding tools that generate actions for every route.

### Warning Signs
- 50+ action classes in `App\Actions`, most under 20 lines
- Action only calls `$model->update(...)` or `$model->save()` with no additional logic
- Action has no transaction boundary (because only one model is written)
- Controller becomes a thin pass-through: `$this->saveUserAction->__invoke($data); return redirect(...)`
- Action tests assert only that `save()` was called on the model

### Why Harmful
Unnecessary indirection increases cognitive load — developers must open 3 files (controller, action, model) to understand a trivial save operation. The action layer adds maintenance burden without providing value: no testability gain (the controller was already testable), no reuse opportunity, and no orchestration boundary. Every action requires a test file, update on model change, and mental context switch.

### Real-World Consequences
A team creates `UpdateUserNameAction`, `UpdateUserEmailAction`, `UpdateUserPasswordAction` as separate action classes. When the User model's `update()` method signature changes, developers must update all 3 actions plus their tests, whereas previously they updated a single controller method. The action layer becomes a "pass-through tax" on every change.

### Preferred Alternative
Use model methods for single-model state changes. Reserve actions for operations that coordinate multiple aggregates, involve external side-effects, or require atomicity across models.

### Refactoring Strategy
1. Identify actions that wrap a single `$model->update()` or `$model->save()` call
2. Inline the action's logic into the controller method (if only used there) or into a model method
3. Delete the action class and its test file
4. Keep actions that coordinate multiple aggregates, have side-effects, or are used from multiple entry points

### Detection Checklist
- [ ] Action is under 20 lines with a single `update()` or `save()` call
- [ ] Action has 0-1 constructor dependencies
- [ ] Action is invoked from exactly one controller method
- [ ] Action does not wrap logic in `DB::transaction()`
- [ ] Action has no side-effects beyond the database write

### Related Rules/Skills/Decision Trees
- **Rule 6**: Limit actions to one use case and under 100 lines (`05-rules.md`)
- **Decision 1**: Action Class vs Model Method vs Inline Controller Logic (`07-decision-trees.md`)
- **Skill 1**: Create an Action Class (`06-skills.md` — When NOT To Use section)

---

## Anti-Pattern 5: Transaction Boundary Neglect

### Category
Reliability — Data Integrity Failure

### Description
Failing to wrap cross-aggregate operations in `DB::transaction()`, or dispatching domain events inline during an open transaction. This causes partial writes that leave the system in an inconsistent state or triggers side-effects (emails, queue jobs) based on data that was never committed.

### Why It Happens
Developers are unaware that multiple model saves are not atomic by default in Laravel. Transaction wrapping is perceived as overhead. Events dispatched inline "work fine" in development because transactions almost never roll back in local testing. Legacy code may have been written before the cross-aggregate responsibility was clear.

### Warning Signs
- Action modifies two or more models without `DB::transaction()`
- `event()` or `Event::dispatch()` called directly inside transaction closures
- Action has no `DB::transaction()` call despite coordinating multiple writes
- Queue jobs dispatched during an open transaction
- Test assertions about side-effects pass despite transaction rollback scenarios

### Why Harmful
Without transactions, an exception during the second `save()` leaves the first save persisted — the system now has an order without inventory updates, or a payment without an invoice. Events dispatched inside transactions fire even when the transaction rolls back, sending confirmation emails for failed orders and dispatching shipment jobs for never-persisted purchases.

### Real-World Consequences
A `PlaceOrderAction` saves the order, then deducts inventory. If the inventory deduction fails, the order remains saved but inventory is not deducted — customers can place orders for out-of-stock items. Meanwhile, an `OrderPlaced` event dispatched before the inventory call fires an email confirmation for the phantom order. Customer support deals with angry customers holding non-existent orders while the dev team restores database state.

### Preferred Alternative
Wrap all cross-aggregate writes in `DB::transaction()`. Dispatch domain events using `DB::afterCommit()` so they only fire after the transaction commits successfully.

### Refactoring Strategy
1. Identify all model mutations in the action method
2. If two or more models are written, wrap the mutations in `DB::transaction(function () { ... })`
3. Move all `event()` calls inside the transaction to `DB::afterCommit(fn () => event(...))`
4. Verify that read-only operations before the transaction are outside the closure
5. Update tests to assert that:
   - On rollback, side-effects do NOT fire
   - On commit, side-effects DO fire

### Detection Checklist
- [ ] Action modifies 2+ models or dispatches events
- [ ] No `DB::transaction()` call exists in the method
- [ ] `event()` is called directly without `DB::afterCommit()`
- [ ] Queue jobs are dispatched inside the method without transaction awareness
- [ ] Test does not cover the rollback scenario

### Related Rules/Skills/Decision Trees
- **Rule 3**: Always wrap cross-aggregate operations in `DB::transaction()` (`05-rules.md`)
- **Rule 5**: Dispatch domain events with `DB::afterCommit()`, not immediately (`05-rules.md`)
- **Decision 2**: Sync Action vs Queued Action (`07-decision-trees.md`)
