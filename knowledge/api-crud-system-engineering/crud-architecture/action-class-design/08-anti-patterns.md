# Anti-Patterns — Action Class Design

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | CRUD Architecture |
| Knowledge Unit | Action Class Design |
| Difficulty | Intermediate |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-02 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|-----------|
| God Action | High | Medium | Code review: action has multiple side effects (create + email + log) |
| HTTP-Coupled Action | High | Medium | Static analysis: action imports `Illuminate\Http\Request` |
| Action with Multiple Public Methods | Medium | Medium | Code review: more than one public method in an action class |
| Anemic Action | Medium | High | Code review: action body is pure delegation to `Model::create()` |
| Multi-Purpose Action | High | Medium | Code review: action name says one thing but does multiple |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Action Layer Proliferation | Creating action classes for every operation including trivial ones | Increases file count without architectural benefit, adds ceremony to simple code paths |
| Mixed Invoke/Execute Convention | Some actions use `__invoke`, others use `execute` without consistency | Confuses developers, reduces predictability of the codebase |
| Actions with Loose Parameters | Action accepts scalar parameters instead of a typed DTO | Loses type safety, self-documenting method signatures, and extensibility |

---

## Anti-Pattern Details

### AP-APD-01: God Action

**Description**: An action class that handles multiple related operations — creating a record, sending an email, logging to an audit table, and notifying an admin. The action has multiple side effects beyond its single responsibility, making it untestable in isolation and violating the single-responsibility principle that action classes exist to enforce.

**Root Cause**: The developer conflates "related" with "single purpose." Creating a user, sending a welcome email, and logging the event are all related to user creation, so they end up in the same action.

**Impact**:
- Action is no longer independently testable — testing the create requires mocking email and audit dependencies
- Side effects can't be skipped or swapped independently
- Transactional rollback of the database write also rolls back the email (if inside transaction)
- Violates the fundamental contract of action classes (one thing only)

**Detection**:
- Code review: action name implies one operation but body performs multiple
- Static analysis: action depends on mailer, logger, notifier, and repository
- Test complexity: action tests need 5+ mocked dependencies

**Solution**:
- Extract email sending to a queued action dispatched after the transaction commits
- Extract audit logging to an event listener
- Extract admin notification to a separate action
- The original action retains only the core operation (creating the user)

**Example**:
```php
// BEFORE: God Action — create + email + log + notify
class CreateUserAction
{
    public function execute(CreateUserDto $dto): User
    {
        $user = $this->users->create($dto);
        $this->mailer->sendWelcome($user);       // side effect
        $this->auditor->log('user_created', $user); // side effect
        $this->notifier->notifyAdmin($user);     // side effect
        return $user;
    }
}

// AFTER: Focused action with dispatched side effects
class CreateUserAction
{
    public function execute(CreateUserDto $dto): User
    {
        return DB::transaction(fn() => $this->users->create($dto));
    }
}
```

---

### AP-APD-02: HTTP-Coupled Action

**Description**: An action class that depends on HTTP-specific classes like `Illuminate\Http\Request`, returns redirect responses, or manipulates sessions and cookies. This makes the action untestable without HTTP scaffolding and prevents reuse from CLI commands, queue workers, or other non-HTTP entry points.

**Root Cause**: The developer takes a shortcut by passing `$request` to the action instead of extracting data into a DTO. Alternatively, the action handles HTTP concerns (redirect, flash data) because "it's convenient."

**Impact**:
- Action cannot be tested without bootstrapping the full HTTP kernel
- Action can only be called from HTTP entry points (controllers, route closures)
- Forces tests to use HTTP testing methods (`$this->post()`) instead of direct instantiation
- Prevents reuse from commands, queues, scheduled tasks, or other actions

**Detection**:
- Static analysis: action imports any class from `Illuminate\Http`
- Code review: action method signature includes `Request` parameter
- Test inspection: tests for the action need `$this->actingAs()` or `$this->post()`

**Solution**:
- Extract all HTTP data into a typed DTO before calling the action
- The action accepts only the DTO and returns domain data (models, DTOs, or void)
- The controller handles all HTTP concerns (status codes, headers, redirects)

**Example**:
```php
// BEFORE: HTTP-coupled action
class CreateUserAction
{
    public function execute(Request $request): User
    {
        return User::create($request->validated());
    }
}

// AFTER: Transport-agnostic action
class CreateUserAction
{
    public function execute(CreateUserDto $dto): User
    {
        return User::create($dto->toArray());
    }
}
```

---

### AP-APD-03: Action with Multiple Public Methods

**Description**: An action class that exposes two or more public methods. Action classes are contractually single-method classes — exactly one public method (`execute()` or `__invoke()`). Multiple public methods indicate the class is a service, not an action, violating the naming convention and developer expectations.

**Root Cause**: The developer starts with one operation and adds a second related operation to the same class because "they share dependencies." This is the service pattern, not the action pattern.

**Impact**:
- Confuses developers who expect action classes to have one method
- Violates the single-responsibility principle at the class level
- Makes it harder to test each operation independently (tests for one operation instantiate unused dependencies of the other)
- Indicates the class should be a service, not an action

**Detection**:
- Code review: action class has `execute()` + another public method
- Static analysis: class has more than one public method (excluding `failed()` for queued actions)
- Reflection: `(new ReflectionClass($action))->getMethods()` returns more than one public method

**Solution**:
- Extract each operation into its own action class
- If operations share dependencies and are truly related, promote the class to a service
- Never name a multi-method class with `Action` suffix

**Example**:
```php
// BEFORE: Action with multiple methods
class UserAction
{
    public function create(CreateUserDto $dto): User { /* ... */ }
    public function update(UpdateUserDto $dto): User { /* ... */ }
    public function delete(DeleteUserDto $dto): void { /* ... */ }
}

// AFTER: Separate actions or a single service
class CreateUserAction { public function execute(...) }  // each action has one method
class UpdateUserAction { public function execute(...) }
class DeleteUserAction { public function execute(...) }

// OR: Rename to service
class UserService
{
    public function create(CreateUserDto $dto): User { /* ... */ }
    public function update(UpdateUserDto $dto): User { /* ... */ }
    public function delete(DeleteUserDto $dto): void { /* ... */ }
}
```

---

### AP-APD-04: Anemic Action

**Description**: An action class that exists solely to forward data to `Model::create()` or another trivial ORM operation with zero business logic. The action has no conditionals, no validation (beyond what the DTO provides), no side effects, and no transformation. It adds a file and a method call without providing any architectural benefit.

**Root Cause**: Dogmatic application of "always use actions" without considering whether the operation justifies the ceremony. Simple creates with no business logic gain nothing from action indirection.

**Impact**:
- Increases file count without improving testability, reusability, or clarity
- Creates unnecessary indirection — testers must mock an action that does nothing
- Blunts the signal of what constitutes real business logic (every operation looks the same)
- Developers learn that actions are pointless boilerplate, eroding trust in the architecture

**Detection**:
- Code review: action method body is one line, calling `Model::create($dto->toArray())`
- Coverage: action has no meaningful test coverage because there's nothing to test
- Code review: the action could be inlined into the controller with the same effect

**Solution**:
- Skip the action layer for truly trivial operations — call `Model::create()` directly from the controller
- If future business rules are anticipated, add the action preemptively with a comment explaining why
- For the gray area between trivial and complex, accept the action as defensive architecture

**Example**:
```php
// BEFORE: Anemic action
class ToggleUserStatusAction
{
    public function execute(ToggleUserStatusDto $dto): User
    {
        $user = User::findOrFail($dto->userId);
        $user->update(['active' => $dto->active]);
        return $user;
    }
}

// AFTER: Skip the action entirely
class UserController
{
    public function update(int $id, UpdateUserRequest $request): JsonResponse
    {
        $user = User::findOrFail($id);
        $user->update($request->validated());
        return response()->json($user);
    }
}
```

---

### AP-APD-05: Multi-Purpose Action

**Description**: An action class that starts with a clear single purpose but gradually accumulates "just one more thing" over time. Each addition is small and apparently related, but the cumulative effect is an action that does far more than its name implies. Unlike the God Action (which is created with multiple responsibilities), this anti-pattern emerges through incremental accretion.

**Root Cause**: Incremental feature additions. Each sprint adds "one more task" to an existing action because "it's related" and "creating a new action is more work." No single addition crosses the threshold that triggers refactoring.

**Impact**:
- Action drifts from its original purpose — `CreateOrderAction` eventually handles inventory, payment, notification, and analytics
- Tests become brittle — a change to any responsibility breaks all tests
- New developers can't determine the action's responsibility from its name
- Refactoring becomes risky because the action's many callers depend on bundled behavior

**Detection**:
- Version control history: action file modified in 10+ unrelated feature commits
- Code review: action name no longer accurately describes the full scope of work
- Test file: action tests cover notification logic, payment logic, and ordering logic in one set

**Solution**:
- Before adding "one more thing," ask: "Does the action name still describe what this class does?"
- Extract the new responsibility to a separate action or event listener
- If 3+ responsibilities have accumulated, plan a refactoring sprint to extract them all
- Add a comment at the top of the action listing its core responsibility and any extracted responsibilities

**Example**:
```php
// BEFORE: Incremental accretion
class CreateOrderAction
{
    public function execute(OrderDto $dto): Order
    {
        $order = $this->orders->create($dto);
        $this->inventory->reserve($dto->items);      // added sprint 12
        $this->payments->charge($dto->payment);       // added sprint 14
        $this->notifier->sendConfirmation($order);    // added sprint 15
        $this->analytics->trackOrder($order);         // added sprint 17
        return $order;
    }
}

// AFTER: Single responsibility, side effects extracted
class CreateOrderAction
{
    public function execute(OrderDto $dto): Order
    {
        return DB::transaction(function () use ($dto) {
            $order = $this->orders->create($dto);
            $this->inventory->reserveSync($dto->items); // synchronous reservation
            return $order;
        });
    }
}
// Side effects dispatched after commit or via events:
// - ReserveInventoryJob::dispatch(...)
// - ProcessPaymentJob::dispatch(...)
// - OrderCreated::dispatch(...) → listeners handle notification, analytics
```
