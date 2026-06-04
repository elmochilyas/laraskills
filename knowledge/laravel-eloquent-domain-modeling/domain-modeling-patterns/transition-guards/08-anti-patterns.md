# Transition Guards — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Domain Modeling Patterns |
| Knowledge Unit | Transition Guards |
| Focus | Anti-patterns in transition guard design and usage |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Late Guard Evaluation with Generic Exceptions | Reliability | Critical |
| 2 | Multi-Condition God Guards | Maintainability | High |
| 3 | Guards with Side Effects | Architecture | Critical |
| 4 | Mixed Authorization and Business Rule Guards | Security | High |
| 5 | Testing Guards Through Transitions Only | Testing | High |
| 6 | Expensive Operations Inside Guards | Performance | Medium |

## Repository-Wide Cross-Cutting Patterns

- The most critical anti-pattern is evaluating guards after mutating state, causing partial mutations when a guard throws
- Generic exceptions with message-string parsing obscure which precondition failed, making debugging and error handling fragile
- Mixed authorization and business rules prevent reusing business guards in non-user-driven contexts (CLI, queue jobs)

---

## 1. Late Guard Evaluation with Generic Exceptions

### Category
Reliability

### Description
Evaluating guard conditions after modifying the model's state or performing partial mutations, and throwing a generic `RuntimeException` or `\Exception` with a message string instead of a typed exception.

### Why It Happens
Developers add guards as an afterthought, inserting the check after the state assignment. Using a generic exception is the fastest path to "working" code. The developer may not anticipate multiple guard conditions or the need for callers to handle specific failure types.

### Warning Signs
- State assignment (`$this->status = ...`) before guard checks in transition methods
- `throw new \Exception('Invalid transition')` — generic, no specific type
- `throw new \RuntimeException('Cannot ship')` — message-based, not type-based
- Callers catching `\Exception` and parsing `$e->getMessage()` to determine the failure
- Partial database writes when a guard fails mid-method
- The `save()` call is inside the guarded block but after mutation

### Why Harmful
- Partial state mutations: the model's in-memory state is modified even when the transition fails
- Callers cannot programmatically determine which precondition failed without parsing message strings
- Message strings are fragile — changing a message breaks caller logic
- Logging/error tracking cannot categorize failures by type
- The model may be left in an inconsistent state (in-memory state != database)

### Consequences
- `$order->status` is set to `Shipped` in memory, then the shipping address guard throws — the UI shows "shipped" but the database still says "approved"
- A monitoring system cannot alert on `MissingShippingAddressException` because it's a generic `RuntimeException`
- A caller catches the exception and retries — but the model's in-memory state is already mutated
- Refactoring error messages breaks callers that parse them
- Debugging requires reading the guard implementation because the exception type is unhelpful

### Preferred Alternative
```php
public function transitionTo(OrderStatus $newStatus): void
{
    $this->guardTransition($newStatus); // Guards evaluated FIRST

    $this->status = $newStatus;
    $this->save();
}

private function guardTransition(OrderStatus $newStatus): void
{
    if (! in_array($newStatus, $this->status->allowedTransitions())) {
        throw new InvalidTransitionException($this->status, $newStatus);
    }
    if ($newStatus === OrderStatus::Shipped && ! $this->shipping_address) {
        throw new MissingShippingAddressException($this->id);
    }
}
```

### Refactoring Strategy
1. Identify transition methods that mutate state before guard checks
2. Move all guard checks to the beginning of the transition method
3. Replace generic exceptions with specific typed exceptions per failure condition
4. Update callers to catch specific exception types
5. Remove any message-string parsing from caller error handling
6. Verify that no partial mutations occur when a guard throws

### Detection Checklist
- [ ] Check order of operations in transition methods — do guards run before state changes?
- [ ] Search for `throw new \Exception`, `throw new \RuntimeException` in guard code
- [ ] Check if callers catch `\Exception` and parse `getMessage()`
- [ ] Verify each guard failure has a distinct exception type
- [ ] Test that a guard failure leaves the model's state unchanged

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Fail Fast and Throw Specific Exceptions in Guards |
| Skill | `06-skills.md` — Implement a Transition Guard for State Changes |
| Knowledge | `04-standardized-knowledge.md` — Transition Guards |

---

## 2. Multi-Condition God Guards

### Category
Maintainability

### Description
A single guard class or method that checks multiple unrelated preconditions, making it impossible to test, reuse, or understand individual conditions independently.

### Why It Happens
Developers group all precondition checks for a transition into one class for convenience. It seems simpler to have one guard per transition than one guard per condition. The team doesn't recognize that individual conditions need independent testability and reuse across transitions.

### Warning Signs
- A guard class named `*Guard` that checks 3+ unrelated conditions
- Guard methods with multiple `if` blocks for different conditions
- The same condition appearing in multiple guard classes (duplication)
- Tests for the guard must set up conditions for all checks, not just the one being tested
- Difficulty naming the guard class — it checks "everything" for a transition
- Inline guard methods longer than 10 lines with multiple conditions

### Why Harmful
- The guard violates Single Responsibility — it validates multiple distinct preconditions
- Testing one condition requires setting up unrelated conditions to pass
- Reusing a single condition across transitions requires extracting it from the god guard
- Failure messages are ambiguous — which of the 5 conditions failed?
- The guard class is tightly coupled to all the conditions, making changes risky

### Consequences
- `OrderCanBeShippedGuard` checks status, shipping address, item count, balance, customer verification, and fraud status — 6 unrelated conditions
- Testing the fraud check requires setting up a valid shipping address first
- A new transition needs the customer verification check — must extract it from the god guard
- When the fraud check fails, the error message just says "Cannot ship" — which condition?
- The guard is never reusable because it's tied to one transition with all its conditions

### Preferred Alternative
```php
class OrderStatusGuard
{
    public function __invoke(Order $order): void
    {
        if ($order->status !== OrderStatus::Approved) {
            throw new InvalidTransitionException(...);
        }
    }
}

class ShippingAddressGuard
{
    public function __invoke(Order $order): void
    {
        if (! $order->shipping_address) {
            throw new MissingShippingAddressException($order->id);
        }
    }
}

class CompositeGuard
{
    public function __construct(private array $guards) {}

    public function __invoke(Order $order): void
    {
        foreach ($this->guards as $guard) {
            $guard($order);
        }
    }
}
```

### Refactoring Strategy
1. Identify guard classes with multiple conditions
2. Extract each distinct condition into its own guard class
3. Name each guard after the single condition it validates (`ShippingAddressGuard`, `CustomerVerificationGuard`)
4. Create a composite guard that iterates the individual guards for the transition
5. Update tests to test each guard independently
6. Reuse individual guards across transitions that share preconditions

### Detection Checklist
- [ ] Count conditions per guard class — more than 2 suggests problems
- [ ] Are any conditions duplicated across multiple guard classes?
- [ ] Can each condition be tested in isolation without setting up others?
- [ ] Do guard names reflect a single concern?
- [ ] Check if a single guard file exceeds 30 lines with multiple `if` blocks

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — One Guard, One Condition |
| Skill | `06-skills.md` — Implement a Transition Guard for State Changes |
| Decision Tree | `07-decision-trees.md` — Guard Granularity |

---

## 3. Guards with Side Effects

### Category
Architecture

### Description
Guard classes or methods that perform side effects — modifying state, dispatching events, writing logs, calling external APIs — in addition to validating preconditions. The guard becomes a command, not a query.

### Why It Happens
Developers add logging to guards "for debugging." They update a timestamp "while we're checking the address." The guard seems like a convenient place to "record" that a check happened. The team doesn't enforce Command-Query Separation for guards.

### Warning Signs
- Guards that call `Log::info()`, `Log::warning()`, or other logging methods
- Guards that assign values to model properties (`$order->verified_at = now()`)
- Guards that call `$order->save()` or other persistence methods
- Guards that dispatch events or queue jobs
- Guards that call external APIs or services beyond what's needed for the check
- Side effects that still execute even when the guard ultimately throws

### Why Harmful
- Log entries appear for transitions that ultimately fail — confusing debugging
- Model state is mutated even when the transition is rejected
- Event listeners fire for failed transitions — side effects that shouldn't happen
- Guard reusability is destroyed because the side effect may not be desired in all contexts
- Violates the principle that guards should be pure predicates — inspect state and decide

### Consequences
- `ShippingAddressGuard` writes `Log::warning('Missing address')` for every failed transition — the log is flooded with expected failures
- `CustomerVerificationGuard` updates `$order->verified_at` even when the transition to `Shipped` fails — timestamp says verified but order isn't shipped
- `FraudCheckGuard` dispatches `FraudCheckCompleted` even when the order doesn't transition — downstream listeners process a non-transition
- Testing the guard's logic requires asserting that side effects didn't happen — complex test setup
- A guard is reused in a CLI context and unexpectedly sends emails

### Preferred Alternative
```php
class ShippingAddressGuard
{
    public function __invoke(Order $order): void
    {
        if (! $order->shipping_address) {
            throw new MissingShippingAddressException($order->id);
        }
    }
}

// Side effects are separate:
$guard($order);
Log::info('Shipping address verified', ['order' => $order->id]);
$order->transitionTo(OrderStatus::Shipped);
```

### Refactoring Strategy
1. Identify side effects in guard classes (logging, state mutation, event dispatch, API calls)
2. Remove all side effects from guard classes — guards only inspect and throw
3. Move side effects to the caller (transition method, action class, or event listener)
4. For logging, log after the guard passes, not inside the guard
5. For timestamp updates, set them in the transition logic after guards pass
6. Verify guards can be called without triggering any side effects

### Detection Checklist
- [ ] Search for `Log::`, `Event::dispatch`, `Queue::`, `->save()`, `->update()` in guard classes
- [ ] Check if guards modify model properties (assignments to `$this->` or `$order->`)
- [ ] Test guards in isolation — do they produce any side effects?
- [ ] Verify logging happens after guard passes, not inside guard
- [ ] Confirm guards can be called without impacting the system state

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Guards Must Not Perform Side Effects |
| Skill | `06-skills.md` — Implement a Transition Guard for State Changes |
| Knowledge | `04-standardized-knowledge.md` — Transition Guards |

---

## 4. Mixed Authorization and Business Rule Guards

### Category
Security

### Description
Combining user authorization checks (permissions, roles, ownership) with business rule guards in the same class or method. The guard cannot be used from CLI commands, queue jobs, or tests without providing a user context.

### Why It Happens
Developers add authorization as "just another precondition" in the transition guard. It's convenient to check everything in one place. The team may not anticipate non-user-driven transitions from CLI, queues, or API integrations.

### Warning Signs
- Guard class constructor or method accepts a `User` parameter alongside the domain object
- `Gate::allow()`, `$user->can()`, or `$request->user()` inside a guard class
- Guard logic includes both `$order->status` checks and `$user->hasRole()` checks
- The guard cannot be invoked without an authenticated user
- CLI commands or queue jobs skip the guard entirely because they have no user context
- Business rules are bypassed because the guard is too coupled to auth

### Why Harmful
- The same guard cannot be used for user-driven (web) and system-driven (CLI/queue) transitions
- Security rules are hidden inside business logic — not auditable separately
- CLI/queue transitions must duplicate business rules to bypass the auth-mixed guard
- Testing business preconditions requires setting up a mock user
- Changes to authorization policies require modifying the same class as business rules

### Consequences
- A queue job that processes orders must duplicate business rule checks because the guard requires a `User` parameter
- An automated CLI script bypasses the `OrderCanBeShippedGuard` because it has no user context — business rules are skipped entirely
- A security audit cannot separately review authorization logic because it's mixed with shipping rules
- Tests for business preconditions must create mock users — wasted setup
- Adding a new user role requires shipping changes alongside business logic changes

### Preferred Alternative
```php
class OrderCanBeShippedGuard
{
    public function __invoke(Order $order): void
    {
        if ($order->status !== OrderStatus::Approved) {
            throw new InvalidTransitionException(...);
        }
        if (! $order->shipping_address) {
            throw new MissingShippingAddressException($order->id);
        }
    }
}

class ShipOrderAction
{
    public function execute(Order $order, User $user): void
    {
        Gate::authorize('ship', $order); // Separate authorization
        (new OrderCanBeShippedGuard())($order); // Separate business rules
        $order->transitionTo(OrderStatus::Shipped);
    }
}
```

### Refactoring Strategy
1. Identify guard classes that accept user or auth parameters
2. Extract authorization checks into separate `Gate::authorize()` calls or authorization guards
3. Remove user context from business rule guards
4. Update callers to call authorization separately before business guards
5. Verify CLI/queue transitions can use business guards without user context
6. Ensure authorization is still enforced for HTTP-driven transitions

### Detection Checklist
- [ ] Search for `User $user`, `$request->user()`, `Gate::`, `$user->can()` in guard classes
- [ ] Check if guards can be invoked without an authenticated user
- [ ] Verify CLI/queue transitions enforce business rules (not just authorization)
- [ ] Review if authorization and business logic can be reviewed separately
- [ ] Test that authorization changes don't require modifying business guard code

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Separate Authorization Guards from Business Rule Guards |
| Skill | `06-skills.md` — Implement a Transition Guard for State Changes |

---

## 5. Testing Guards Through Transitions Only

### Category
Testing

### Description
Only testing guard conditions indirectly by calling the full transition method on a model, never testing individual guards in isolation. Test failures don't pinpoint whether the guard or the transition logic caused the failure.

### Why It Happens
Integration testing through the model is the most obvious approach — it tests "the real thing." Developers may not think to test guards separately. The test suite evolves organically without guard-specific test cases.

### Warning Signs
- No tests named after guard classes (no `test_shipping_address_guard` tests)
- All guard conditions are tested only through `$order->transitionTo(...)` calls
- A guard failure is indistinguishable from a transition logic failure in test output
- Tests for guard conditions require full state machine setup (factory with correct state, all related models)
- Guard logic changes require updating transition tests, not guard tests
- Low confidence: guards not independently verified

### Why Harmful
- When a test fails, it's unclear whether the guard or the transition logic is broken
- Tests are slower because they must set up the full model and state machine
- Guard logic cannot be tested in isolation — must create models in correct states
- Multiple guard conditions in one transition require complex setup to test each individually
- Guard tests are tightly coupled to the model's factory and state machine configuration

### Consequences
- A `MissingShippingAddressException` test creates a full `Order` with relations, sets status to `Approved`, and calls `transitionTo(Shipped)` — all to test one `if` check
- When the test fails, the developer must debug whether the guard threw, the state machine rejected it, or the save failed
- Adding a new guard condition requires creating a new integration test with full model setup
- Guard tests take 10x longer than necessary because of model factory setup
- The team skips writing guard tests because "the transition test covers it"

### Preferred Alternative
```php
public function test_shipping_address_guard_rejects_null_address(): void
{
    $order = Order::factory()->create(['shipping_address' => null]);
    $guard = new ShippingAddressGuard();

    $this->expectException(MissingShippingAddressException::class);

    $guard($order);
}

public function test_shipping_address_guard_passes_with_address(): void
{
    $order = Order::factory()->create(['shipping_address' => '123 Main St']);
    $guard = new ShippingAddressGuard();

    $guard($order); // Should not throw

    $this->expectNotToPerformAssertions();
}
```

### Refactoring Strategy
1. Identify all guard conditions currently tested only through transition methods
2. Create dedicated test classes or methods for each guard class
3. Write tests that instantiate the guard directly and call it with a model
4. Test both passing and failing scenarios for each guard
5. Keep transition-level tests focused on transition orchestration, not individual guards
6. Remove duplicate guard testing from transition-level tests

### Detection Checklist
- [ ] Are there test methods named after guard classes specifically?
- [ ] Can each guard be tested without calling `transitionTo()`?
- [ ] Do guard tests create minimal setup (just the data the guard needs)?
- [ ] If a guard test fails, does the error message identify the guard?
- [ ] Are guard tests significantly faster than transition tests?

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Test Every Guard Independently |
| Skill | `06-skills.md` — Implement a Transition Guard for State Changes |
| Knowledge | `04-standardized-knowledge.md` — Transition Guards |

---

## 6. Expensive Operations Inside Guards

### Category
Performance

### Description
Performing expensive database queries, external API calls, or heavy computations inside guard conditions. Guards that should be fast property checks become slow I/O operations that block every transition attempt.

### Why It Happens
Developers treat guards as "just another place to put validation" without considering performance. The guard's check seems necessary, and the performance cost is accepted as "the price of correctness." The team doesn't distinguish between fast in-memory checks and expensive I/O operations.

### Warning Signs
- HTTP API calls inside guard classes (`Http::post()`, `Http::get()`)
- Expensive database queries inside guards (aggregate queries, cross-table joins)
- Heavy computations or external service calls in guards
- Guards that don't cache results that could be cached
- Transition methods that take seconds to execute due to guard overhead
- Multiple guards each making their own database queries for the same data

### Why Harmful
- Every transition attempt pays the cost: even failed transitions (guards that throw) still execute the expensive operation
- N+1 query problem: a composite guard with 3 guards each making a DB query multiplies the cost
- External API calls introduce latency, network failures, and rate limiting into every transition
- Queue workers processing transitions consume more time per job, reducing throughput
- The expensive operation runs even when another guard would fail first — wasted work

### Consequences
- `FraudCheckGuard` calls an external fraud API on every `transitionTo()` attempt — the first guard fails but the API was already called
- `CustomerVerificationGuard` queries a cross-database reporting system on every transition — adds 500ms per call
- Composite guard with 3 expensive guards takes 3 seconds per transition
- A queue worker processing 10,000 transitions blocks for hours due to guard overhead
- Rate limiting from the external fraud API causes transition failures during peak hours

### Preferred Alternative
```php
class FraudCheckGuard
{
    public function __invoke(Order $order): void
    {
        // Fast in-memory check using pre-computed data
        if ($order->total_cents > config('fraud.threshold_cents')) {
            throw new FraudDetectedException($order->id);
        }
    }
}

// Heavy fraud checks happen asynchronously via domain event listeners
```

### Refactoring Strategy
1. Identify guards making expensive operations (API calls, heavy queries, computations)
2. Replace expensive checks with fast in-memory alternatives where possible (cached data, pre-computed fields)
3. For unavoidable expensive checks, move them to asynchronous event listeners that run after the transition
4. Cache expensive guard results with a short TTL for repeated checks
5. Batch expensive operations: preload guard-relevant data before processing multiple transitions
6. Monitor guard execution time — add metrics for slow guards

### Detection Checklist
- [ ] Search for `Http::`, `::query()->`, `DB::`, `Cache::` in guard classes
- [ ] Measure transition execution time — how much is spent in guards?
- [ ] Check if guards make multiple queries for data that could be eager-loaded
- [ ] Verify guards don't make API calls for checks that could be cached
- [ ] Check if expensive operations run even when earlier guards would fail

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Avoid Expensive Operations Inside Guards |
| Skill | `06-skills.md` — Implement a Transition Guard for State Changes |
| Decision Tree | `07-decision-trees.md` — Guard Placement |
