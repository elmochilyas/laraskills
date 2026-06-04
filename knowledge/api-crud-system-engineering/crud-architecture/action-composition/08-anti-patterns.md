# Anti-Patterns — Action Composition

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | CRUD Architecture |
| Knowledge Unit | Action Composition |
| Difficulty | Advanced |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-02 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|----------|
| Deep Composition Without Error Recovery | High | Medium | Code review: 5+ level composition with no rollback logic |
| Coordinator as God Class | High | Medium | Code review: coordinator contains business logic inline |
| Implicit Context Passing | Medium | Medium | Code review: shared mutable state between composed actions |
| Composition Without Reusability | Medium | High | Code review: sub-actions only called by one coordinator |
| Missing Transaction at Coordinator Level | High | Medium | Code review: coordinator calls writes but has no transaction wrapper |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Inline Coordinator Logic | Coordinator calls sub-actions but also does inline business logic between calls | Blurs the line between coordination and execution, duplicates logic |
| Over-Composition | Composing 6+ sub-actions when a single service method would suffice | Creates unnecessary indirection, hard to trace the workflow |
| Silent Failure in Composition | Sub-action fails, coordinator continues as if nothing happened | Produces inconsistent state, hard to debug production issues |

---

## Anti-Pattern Details

### AP-ACP-01: Deep Composition Without Error Recovery

**Description**: A composed workflow with 5+ levels of action calls where a failure at a deep level leaves earlier committed operations with no rollback mechanism. The coordinator assumes all sub-actions succeed, and there is no transaction wrapping, compensating action, or saga pattern to recover from partial failure.

**Root Cause**: The developer focuses on the "happy path" and assumes sub-actions never fail. The composition grows incrementally without reviewing error recovery at each addition.

**Impact**:
- Partial writes leave the system in an inconsistent state (e.g., inventory decremented but order not created)
- Debugging is extremely difficult — which of the 5 sub-actions succeeded before the failure?
- Compensating for partial failures requires manual database intervention
- Business logic assumption (all-or-nothing) is violated silently

**Detection**:
- Code review: coordinator method has no `DB::transaction()` or try-catch
- Code review: 5+ sub-action calls in sequence without error handling
- Incident analysis: production bugs showing inconsistent data across related tables

**Solution**:
- Wrap the entire composition in `DB::transaction()` when the database is the single source of truth
- For sub-actions with external side effects (API calls), implement compensating actions
- Limit composition depth to 3-4 levels; extract at 5+ to a service or saga pattern
- Add logging at each composition step to trace failure points

**Example**:
```php
// BEFORE: No error recovery in deep composition
class CheckoutAction
{
    public function execute(CheckoutDto $dto): Order
    {
        $cart = $this->validateCart->execute($dto->cartId);
        $reservation = $this->reserveInventory->execute($cart);
        $payment = $this->processPayment->execute($dto->payment, $cart->total);
        $order = $this->createOrder->execute($cart, $payment);
        $this->sendConfirmation->execute($order);
        return $order;
    }
}

// AFTER: Transaction wrapper with error recovery
class CheckoutAction
{
    public function execute(CheckoutDto $dto): Order
    {
        return DB::transaction(function () use ($dto) {
            $cart = $this->validateCart->execute($dto->cartId);
            $reservation = $this->reserveInventory->execute($cart);
            $payment = $this->processPayment->execute($dto->payment, $cart->total);
            $order = $this->createOrder->execute($cart, $payment);
            $this->sendConfirmation->execute($order);
            return $order;
        });
    }
}
```

---

### AP-ACP-02: Coordinator as God Class

**Description**: A coordinator action that contains business logic, validation, error handling, and data transformation inline rather than delegating to sub-actions. The coordinator's execute method is 50+ lines with conditionals, loops, and inline queries — it looks like a traditional fat service in action class clothing.

**Root Cause**: The developer creates a coordinator action but fails to extract discrete operations to separate action classes. The coordinator becomes a dumping ground for "everything this workflow needs."

**Impact**:
- Coordinator is untestable in isolation — it contains all the logic internally
- Sub-operations cannot be reused by other workflows
- Violates the single-responsibility principle (coordinator is both orchestrator and executor)
- The coordinator becomes a bottleneck for changes to the workflow

**Detection**:
- Code review: coordinator's `execute()` method exceeds 20 lines
- Static analysis: coordinator calls itself (inline methods) more than sub-actions
- Test inspection: coordinator tests don't mock sub-actions (because there are none)

**Solution**:
- Extract every distinct operation into its own action class
- The coordinator's `execute()` method should only contain calls to sub-actions
- Any conditional logic should be based on DTO fields, not business rules
- After extraction, test the coordinator by mocking sub-actions

**Example**:
```php
// BEFORE: Coordinator doing everything
class OnboardUserAction
{
    public function execute(OnboardDto $dto): User
    {
        $user = User::create($dto->toArray());
        $team = Team::create(['name' => $dto->teamName, 'owner_id' => $user->id]);
        $user->teams()->attach($team);
        $prefs = UserPreference::create(['user_id' => $user->id]);
        if ($dto->plan === 'premium') {
            $prefs->update(['features' => ['advanced']]);
        }
        return $user;
    }
}

// AFTER: Pure coordinator delegating to sub-actions
class OnboardUserAction
{
    public function execute(OnboardDto $dto): User
    {
        $user = $this->createUser->execute($dto);
        $team = $this->createTeam->execute($dto->teamName, $user);
        $this->assignTeam->execute($user, $team);
        $this->setPreferences->execute($user, $dto->plan);
        return $user;
    }
}
```

---

### AP-ACP-03: Implicit Context Passing

**Description**: Composed actions share state through mutable class properties or a shared context object instead of passing data explicitly through method parameters. One sub-action sets a value on `$this->context` or `$this->sharedData`, and another sub-action reads it, creating hidden and untrackable coupling between actions.

**Root Cause**: The developer wants to avoid changing method signatures when adding new data to the pipeline. A shared context object seems "cleaner" than threading parameters through each sub-action.

**Impact**:
- Hidden coupling: changing one sub-action's behavior affects other sub-actions unexpectedly
- Tests are unreliable: mocking one sub-action changes the context that other sub-actions depend on
- The composition is not reusable: the explicit data flow is lost in the shared object
- Race conditions under concurrent execution (if context is stored on properties)

**Detection**:
- Code review: sub-actions read from `$this->context`, `$this->data`, or coordinator properties
- Code review: sub-action signatures have no parameters or only a "context" object
- Debugging: hard to trace where a value in the context was set

**Solution**:
- Pass all data explicitly as method parameters and return values
- Each sub-action receives only the data it needs and returns its result
- The coordinator's execute method clearly shows the data flow: `$a = sub1($x); $b = sub2($a);`
- If parameter lists are too long, create a dedicated pipeline DTO

**Example**:
```php
// BEFORE: Implicit context passing
class CheckoutAction
{
    private array $context = [];

    public function execute(CheckoutDto $dto): Order
    {
        $this->context['dto'] = $dto;
        $this->validateCart->execute();
        $this->reserveInventory->execute();
        $this->processPayment->execute();
        return $this->createOrder->execute();
    }
}

// Sub-actions read from $this->context silently

// AFTER: Explicit parameter passing
class CheckoutAction
{
    public function execute(CheckoutDto $dto): Order
    {
        $cart = $this->validateCart->execute($dto->cartId);
        $reservation = $this->reserveInventory->execute($cart);
        $payment = $this->processPayment->execute($dto->payment, $cart->total);
        return $this->createOrder->execute($cart, $payment);
    }
}
```

---

### AP-ACP-04: Composition Without Reusability

**Description**: Sub-actions are written specifically for one coordinator and are never reused, independently testable, or independently callable. The sub-actions exist only because "the architecture requires composition," but each sub-action would never exist on its own — they are implementation details of the coordinator that happen to be split into separate files.

**Root Cause**: Dogmatic application of action composition without considering whether each sub-action earns its existence. A sub-action that only one coordinator calls and that has no independent utility is not a real sub-action.

**Impact**:
- Increases file count without architectural benefit (ceremony without value)
- Creates unnecessary indirection when testing the coordinator
- Sub-actions are tightly coupled to the coordinator's data shapes
- Refactoring the coordinator requires refactoring all the sub-actions

**Detection**:
- Code review: `git grep` for a sub-action class shows only one caller (the coordinator)
- Code review: sub-action method signature is tightly coupled to the coordinator's internal state
- Test inspection: sub-action tests look identical to coordinator tests (same setup, same assertions)

**Solution**:
- Before creating a sub-action, ask: "Would this be independently useful outside this coordinator?"
- If no, inline the logic in the coordinator or keep it as a private method
- If yes, ensure the sub-action has its own tests and is callable with minimal setup
- Accept that not every step in a workflow needs its own action class

**Example**:
```php
// BEFORE: Sub-actions that only exist for one coordinator
class OnboardUserAction
{
    public function execute(OnboardDto $dto): User
    {
        $this->stepOne->execute($dto);
        $this->stepTwo->execute($dto);
        $this->stepThree->execute($dto);
    }
}
// stepOne, stepTwo, stepThree are never used anywhere else

// AFTER: Only extract independently useful sub-actions
class OnboardUserAction
{
    public function execute(OnboardDto $dto): User
    {
        $user = $this->createUser->execute($dto);     // reused by admin panel
        $this->sendWelcomeEmail->execute($user);       // reused by invite flow
        // Step two and three are private methods or inlined
        $this->configureDefaults($user, $dto);
    }
}
```
