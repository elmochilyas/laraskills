# ECC Anti-Patterns — Action Class Design

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Action Pattern |
| **Knowledge Unit** | Action Class Design |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. God Action
2. Action as Service (Multi-Method Action)
3. HTTP-Coupled Action
4. Stateful Action
5. CRUD Pass-Through Action Ceremony

---

## Repository-Wide Anti-Patterns

- God Services (Action variant: God Action)
- Business Logic in Models (indirect — actions extract it)
- Premature Abstraction (CRUD pass-through actions)
- Hidden Database Queries (actions accepting loose arrays passed to Eloquent)

---

## Anti-Pattern 1: God Action

### Category
Architecture | Design | Maintainability

### Description
An action class with 10+ constructor parameters that handles an entire business workflow — validation, authorization, database writes, email sending, logging, cache invalidation, and external API calls — all in one `handle()` method.

### Why It Happens
Developers treat actions as "the place where the business logic goes" without decomposing. The operation is genuinely complex, but instead of splitting it into composed sub-actions, they inject everything into one class.

### Warning Signs
- Constructor has 8+ type-hinted parameters
- `handle()` method exceeds 50 lines
- File imports from 6+ different namespace roots
- Action name is vague (e.g., `ProcessOrderAction` instead of `ValidateOrderAction`)

### Why It Is Harmful
Violates single responsibility. Cannot test in isolation — every test must mock 10+ collaborators. Any change to any sub-operation requires modifying this one class. The constructor reveals excessive coupling.

### Real-World Consequences
Tests become integration tests (mocking 10+ services is impractical). The action grows uncontrollably as new requirements are added to the same class. Merge conflicts increase on the single file as multiple developers touch different parts of the workflow.

### Preferred Alternative
Decompose the workflow into child actions (e.g., `ValidateOrderAction`, `ChargePaymentAction`, `NotifyCustomerAction`) and compose them in a service or orchestrator action. Each child action should have at most 5-8 constructor parameters.

### Refactoring Strategy
1. Identify cohesive sub-operations within the `handle()` method (each database write, each side-effect, each validation).
2. Extract each sub-operation into a dedicated action class with its own constructor and single public method.
3. Replace the sub-operation call in the parent with a call to the new child action.
4. Optionally extract orchestration coordination into a Service class that composes all child actions.
5. Verify each child action is independently testable with 3-5 mocks maximum.

### Detection Checklist
- [ ] Count constructor parameters in each action class
- [ ] Measure `handle()` method line count
- [ ] Count distinct namespace imports

### Related Rules
- Rule: Limit Constructor Dependencies to a Maximum of 8
- Rule: Enforce Single Public Method Per Action

### Related Skills
- Skill: Extract Controller Logic to an Action
- Skill: Compose Actions into a Workflow

### Related Decision Trees
- Decision: Action vs Inline Logic

---

## Anti-Pattern 2: Action as Service (Multi-Method Action)

### Category
Architecture | Code Organization

### Description
A class named `XxxAction` that has multiple public methods, each performing a separate business operation. The class is a service disguised as an action.

### Why It Happens
Two operations are "related" (e.g., create and cancel orders) so a developer puts them in one class to avoid "file proliferation." The class is named `OrderAction` instead of `CreateOrderAction` and `CancelOrderAction`.

### Warning Signs
- Class suffix `Action` but has 2+ public methods
- Methods with different names that perform distinct operations
- Shared mutable state between methods

### Why It Is Harmful
Breaks team expectations — developers searching for "the action that creates orders" find a class that also updates, deletes, and lists orders. The action pattern's single-responsibility guarantee is false, eroding trust in the architecture.

### Real-World Consequences
New developers call the wrong method, introduce side effects by calling the wrong operation, or add a third method to the same class. The pattern degrades into unorganized services with a misleading name.

### Preferred Alternative
Split each operation into its own action class (e.g., `CreateOrderAction`, `CancelOrderAction`, `RefundOrderAction`). If operations share setup/teardown logic, use a Service class instead.

### Refactoring Strategy
1. List every public method in the violating class.
2. Create one new action class per method, using the method's operation as the class name.
3. Move each method's body (plus its unique dependencies) into the corresponding new action class.
4. If methods share constructor dependencies, extract them to a shared service or pass them to each action independently.
5. Update all callers to use the new individual action classes.
6. Delete the original multi-method class.

### Detection Checklist
- [ ] Scan all `App\Actions\` classes for more than one public method
- [ ] Check for Pest architecture test enforcing single public method

### Related Rules
- Rule: Enforce Single Public Method Per Action

### Related Skills
- Skill: Extract Controller Logic to an Action

---

## Anti-Pattern 3: HTTP-Coupled Action

### Category
Architecture | Framework Usage | Maintainability

### Description
An action that depends on `Illuminate\Http\Request`, `Illuminate\Http\RedirectResponse`, or session data in its constructor or method parameters. The business logic is coupled to the HTTP transport layer.

### Why It Happens
Convenience — the controller already has the Request object, so passing it to the action seems natural. Developers think "the action needs the data from the request" instead of "the action needs typed data."

### Warning Signs
- `use Illuminate\Http\Request` import in the action file
- `request()` helper call inside the action method
- `$request->user()` or `auth()->user()` called inside the action
- Session flash or redirect building in the action

### Why It Is Harmful
Action is coupled to HTTP — cannot be called from CLI, queue, or another action without constructing a fake Request object. Testing requires mocking HTTP objects, coupling tests to infrastructure.

### Real-World Consequences
A CLI command cannot reuse the action. A queue worker cannot call the action without a Request mock. When migrating from HTTP to a queue-driven architecture, every action must be refactored.

### Preferred Alternative
Extract all HTTP data in the controller. Pass DTOs, individual typed parameters, or validated arrays to the action. Keep actions completely unaware of the transport layer.

### Refactoring Strategy
1. In the action, identify every use of `$request->*`, `request()->*`, `auth()->*`, `session()->*`.
2. Replace each with a typed method parameter (e.g., `User $user`, `string $email`).
3. In the controller, extract the data from the Request and pass it explicitly.
4. Remove all `Illuminate\Http` imports from the action file.
5. Add Pest architecture test banning `Illuminate\Http` imports from `App\Actions\`.

### Detection Checklist
- [ ] Grep `use Illuminate\Http` in all `App\Actions\` files
- [ ] Grep `request()->` in all `App\Actions\` files

### Related Rules
- Rule: Never Accept HTTP Request Objects in Actions

### Related Skills
- Skill: Extract Controller Logic to an Action

### Related Decision Trees
- Decision: Constructor vs Method Injection in Actions

---

## Anti-Pattern 4: Stateful Action

### Category
Reliability | Security | Performance

### Description
An action that stores intermediate results on `$this` during `handle()` and exposes getter methods to retrieve them after execution. The action captures per-request state as instance properties.

### Why It Happens
Familiarity with class properties as a convenient place to store data. Unfamiliarity with Octane/RoadRunner's process-reuse lifecycle where action instances persist across requests.

### Warning Signs
- Properties set during `handle()` or `execute()`
- Getter methods on the action class (`getResult()`, `getProcessedPath()`)
- Class is NOT declared `readonly`
- Mutable counter or accumulator properties

### Why It Is Harmful
In Octane/RoadRunner, action instances are cached across requests — state set during request N leaks to request N+1, causing silent data corruption. In PHP-FPM, state is lost between calls, making getter properties useless.

### Real-World Consequences
User A's data appears in User B's response in Octane environments. Silent data corruption that is nearly impossible to reproduce in development. Security vulnerability — unauthorized data exposure.

### Preferred Alternative
Return a result object (DTO, Model, bool) that carries all output data. Never set properties on `$this` during execution. Use `readonly class` for compiler-level enforcement.

### Refactoring Strategy
1. Scan `handle()`/`execute()` for any `$this->property = ...` assignment.
2. Create a dedicated result DTO class with typed properties for all output data.
3. Replace each `$this->property = value` with a local variable.
4. Return the result DTO from the action method.
5. Remove all getter methods.
6. Declare the class `final readonly`.
7. Add Pest architecture tests enforcing readonly and no stateful properties.

### Detection Checklist
- [ ] Audit all `$this->` assignments in action `handle()` methods
- [ ] Verify classes are `readonly` (PHP 8.2+)
- [ ] Check for getter methods in action classes

### Related Rules
- Rule: Keep Actions Stateless — Never Set Mutable Properties During Execution
- Rule: Declare Action Classes as `final readonly`

### Related Skills
- Skill: Design an Octane-Safe Stateless Action

---

## Anti-Pattern 5: CRUD Pass-Through Action Ceremony

### Category
Design | Code Organization

### Description
Creating an action class whose only logic is to call a single Eloquent method (`::create()`, `::update()`, `::delete()`) with pass-through data. The action adds a file and a class without architectural benefit.

### Why It Happens
Blindly following "all business logic must be in actions." Applying the pattern mechanically without considering whether the operation has actual business logic to isolate. Fear of being told "you should have used an action."

### Warning Signs
- Action constructor has zero dependencies (no injected services)
- `handle()` body is a single line: `return Model::create($data);`
- Action name exactly mirrors an Eloquent method (`CreateUserAction` → `User::create()`)
- The action is only called from one controller method

### Why It Is Harmful
File proliferation without architectural benefit. Dilutes the signal-to-noise ratio of the action directory — developers cannot distinguish meaningful actions from ceremony. Encourages developers to bypass actions and call models directly.

### Real-World Consequences
The codebase accumulates hundreds of action files that do nothing. Developers eventually stop looking in actions for real business logic. When real business logic needs to be added, it's added to the controller because the action directory is noisy.

### Preferred Alternative
Use Eloquent models directly for simple CRUD. Extract to an action only when the operation involves multiple steps, multiple models, or actual business logic (validation, authorization, computation).

### Refactoring Strategy
1. Identify actions with zero constructor dependencies and a single `Model::create($data)` body.
2. Inline the Eloquent call into the calling controller or service method.
3. Remove the action class file.
4. For future operations, establish the rule: "Actions must have at least one constructor dependency or multiple steps. Zero-dependency, single-line actions are forbidden."

### Detection Checklist
- [ ] Identify actions with empty constructors (zero injected dependencies)
- [ ] Identify actions whose `handle()` body is a single Eloquent call
- [ ] Check if the action is called from only one entry point

### Related Rules
- Rule: Do Not Create Actions for Simple Eloquent CRUD Pass-Through

### Related Skills
- Skill: Extract Controller Logic to an Action (specifically the "When NOT To Use" section)

### Related Decision Trees
- Decision: Action vs Inline Logic
