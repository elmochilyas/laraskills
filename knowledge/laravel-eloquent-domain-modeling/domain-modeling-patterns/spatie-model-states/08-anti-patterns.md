# Spatie Model States — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Domain Modeling Patterns |
| Knowledge Unit | Spatie Model States |
| Focus | Anti-patterns in Spatie model states usage |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Implicit All-Transitions-Allowed | Design | Critical |
| 2 | Side Effects in State Classes | Architecture | High |
| 3 | Bloated State Classes with Business Logic | Design | High |
| 4 | Missing StateCast Registration | Framework Usage | Critical |
| 5 | Duplicate Transition Validation in Controllers | Maintainability | Medium |
| 6 | Testing State Classes in Isolation | Testing | High |

## Repository-Wide Cross-Cutting Patterns

- The most critical anti-pattern is omitting `transitionableStates()` so all transitions are allowed by default, violating domain invariants silently
- Missing `StateCast` registration on the model causes the entire state machine to be non-functional — the state field returns a raw string
- Putting business logic and side effects in state classes violates Single Responsibility and makes them hard to test

---

## 1. Implicit All-Transitions-Allowed

### Category
Design

### Description
Failing to override `transitionableStates()` in state classes, relying on the Spatie package's default behavior which allows all transitions. The state machine has no guardrails — any state can transition to any other state regardless of domain rules.

### Why It Happens
Developers new to the package may not know `transitionableStates()` exists. The default "allow all" behavior seems convenient during development. Teams may add `transitionableStates()` for some states but forget others. The transition map is incomplete.

### Warning Signs
- State classes without a `transitionableStates()` override
- States accidentally using the base `State` class default (all transitions allowed)
- Domain transitions that succeed at runtime but violate business rules
- Test assertions for disallowed transitions that unexpectedly pass
- Production data in invalid states that "shouldn't be possible"
- Team relying on UI or controller logic to prevent transitions instead of the state machine

### Why Harmful
- Domain invariants are not enforced — invalid states are possible
- Data integrity depends on application-layer checks that can be bypassed
- New developers don't know what transitions are allowed because the state machine is permissive
- Adding a new state class without `transitionableStates()` silently opens all transition paths
- The state machine provides no value — it's essentially a string field with behavior

### Consequences
- An `Order` in `Shipped` state can transition back to `Pending` — a business disaster
- A `User` in `Banned` state can transition to `Premium` — violating subscription rules
- Data corruption from illegal state transitions is discovered weeks later
- No single place to understand the complete transition graph
- Compliance/audit concerns when state machines don't enforce rules

### Preferred Alternative
```php
class Pending extends OrderState
{
    public function transitionableStates(): array
    {
        return [
            Approved::class,
            Cancelled::class,
        ];
    }
}
```

### Refactoring Strategy
1. Identify all state classes missing `transitionableStates()`
2. For each, determine the valid transitions based on domain requirements
3. Add `transitionableStates()` returning the allowed target states
4. Add tests that verify allowed transitions succeed
5. Add tests that verify disallowed transitions throw `InvalidTransition`
6. Remove any duplicate validation from controllers or services

### Detection Checklist
- [ ] Search for `extends State` without a `transitionableStates()` method
- [ ] Test disallowed transitions — do they throw `InvalidTransition`?
- [ ] Review the state machine documentation — are all paths explicitly listed?
- [ ] Check production data for states that shouldn't be reachable
- [ ] Verify every state class has an explicit `transitionableStates()` override

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Define Allowed Transitions Explicitly in Each State Class |
| Skill | `06-skills.md` — Implement a State Machine Using Spatie Model States |
| Knowledge | `04-standardized-knowledge.md` — Spatie Model States |

---

## 2. Side Effects in State Classes

### Category
Architecture

### Description
Embedding side-effect logic (sending emails, dispatching events, logging, modifying related records) directly in state class methods instead of using dedicated Transition classes. State classes accumulate infrastructure concerns alongside transition rules.

### Why It Happens
Developers add side effects to state classes because it's the simplest place that has context about the transition. The state class is "right there" when the transition happens. Creating a separate Transition class feels like unnecessary ceremony.

### Warning Signs
- State classes with methods like `onTransitionTo*()` that perform side effects
- State classes that import infrastructure classes (`Mail`, `Log`, `Queue`, `Event`)
- Constructor or method injection of services into state classes
- State classes with more than one or two methods beyond `transitionableStates()` and query helpers
- Side effects that fire when only querying state metadata (e.g., checking if a transition is allowed)
- Transition logic that's hard to test because it triggers real side effects

### Why Harmful
- State classes become coupled to infrastructure — can't test transition rules without mocking side effects
- Side effects may fire when they shouldn't (e.g., during validation queries, migration scripts)
- State class responsibility expands from "define state rules" to "do everything during transition"
- Testing side effects requires testing through the state class rather than the transition
- Violates Single Responsibility — state classes should define behavior, not execute side-effect orchestration

### Consequences
- Calling `$state->transitionableStates()` triggers email sending because of an `onTransitionTo*` listener
- Refactoring the email logic requires changing every state class that sends email
- Testing transition rules requires mocking `Mail::fake()` even when not testing email
- State classes grow to 100+ lines mixing transition rules, business logic, and infrastructure
- New team members don't know where to add side effects — states or transitions?

### Preferred Alternative
```php
class ShipOrderTransition extends Transition
{
    public function __construct(private Order $order) {}

    public function handle(): OrderState
    {
        $this->order->shipped_at = now();
        $this->order->save();
        Event::dispatch(new OrderShipped($this->order->id));
        return new Shipped($this->order);
    }
}

// Usage:
$order->status->transitionTo(Shipped::class, ShipOrderTransition::class);
```

### Refactoring Strategy
1. Identify side-effect methods in state classes (onTransition*, send*, dispatch*, log*)
2. Extract each side-effect group into a dedicated Transition class
3. Move event dispatching, logging, email sending, and related-record updates to the Transition
4. Remove the side-effect methods from state classes
5. Update transition calls to use the new Transition classes
6. Verify that transition rule queries no longer trigger side effects

### Detection Checklist
- [ ] Search for `Mail::`, `Event::dispatch`, `Log::`, `Queue::` in state class files
- [ ] Check for methods named `onTransition*`, `after*`, `before*` in state classes
- [ ] Review whether calling `transitionableStates()` triggers any side effects
- [ ] Check if state classes import infrastructure namespaces
- [ ] Verify transition side effects are in `App\Transitions\*` or listener classes

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Use Transition Classes for Side Effects |
| Skill | `06-skills.md` — Implement a State Machine Using Spatie Model States |
| Decision Tree | `07-decision-trees.md` — State Class vs Transition Class Scope |

---

## 3. Bloated State Classes with Business Logic

### Category
Design

### Description
State classes that contain not only transition rules and state-specific display logic but also complex business logic, calculations, and orchestration that should live in domain services, actions, or listeners.

### Why It Happens
Developers see state classes as "the place to put state-related logic" without defining a clear boundary. The state class is easily accessible from the model, so adding methods there is convenient. Over time, query scopes, fee calculations, reminder logic, and reporting methods accumulate.

### Warning Signs
- State classes with 5+ methods beyond `transitionableStates()` and display helpers
- Methods that perform calculations (fees, discounts, taxes) in state classes
- Methods that call repositories or other services from state classes
- State classes that reference models other than their host model
- Query scopes in state classes that belong in dedicated scope classes
- Difficulty finding business logic because it's spread across state classes

### Why Harmful
- Business logic is hidden inside state classes instead of being in domain services where it's discoverable
- Logic that applies across multiple states is duplicated or must be extracted from each state
- State classes become god classes for their state — doing everything related to that state
- Testing business logic requires instantiating state classes with model instances
- The Single Responsibility of "defining state behavior" is lost

### Consequences
- A `Pending` state class contains `calculateLateFee()`, `sendReminder()`, `canBeModified()`, `color()`, `label()`, `getAllowedActions()`, `notifyCustomer()` — 7 responsibilities
- The `calculateLateFee()` logic is duplicated in `Approved` and `Shipped` states because they need different fee logic
- A new pricing calculation requires changing 5 state classes instead of 1 service
- Tests for state transition rules must set up complex business logic mocks
- The team adds more logic to states because "that's where the other logic is"

### Preferred Alternative
```php
class Pending extends OrderState
{
    public function transitionableStates(): array
    {
        return [Approved::class, Cancelled::class];
    }

    public function color(): string
    {
        return 'yellow';
    }

    public function canBeModified(): bool
    {
        return true;
    }
}
// Late fee calculation → PricingCalculator service
// Reminder sending → dedicated listener or job
```

### Refactoring Strategy
1. List all methods in each state class and categorize as: transition rules, display helpers, business logic, side effects
2. Extract business logic methods to appropriate domain services
3. Extract side effects to Transition classes or event listeners
4. Keep only transition rules and display helpers in state classes
5. Update callers to use the services instead of state class methods
6. Verify each state class has a clearly defined role

### Detection Checklist
- [ ] Count methods per state class — 3+ methods beyond `transitionableStates()` and helpers is a warning
- [ ] Review method names for verbs indicating business operations (`calculate`, `send`, `validate`, `process`)
- [ ] Check if business logic is duplicated across multiple state classes
- [ ] Verify that services, not state classes, contain calculation and orchestration logic
- [ ] Test whether state class methods require complex mocking of business dependencies

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Keep State Classes Focused on Transition Rules and State-Specific Behavior |
| Skill | `06-skills.md` — Implement a State Machine Using Spatie Model States |
| Decision Tree | `07-decision-trees.md` — State Class vs Transition Class Scope |

---

## 4. Missing StateCast Registration

### Category
Framework Usage

### Description
Failing to register the state column with the Spatie `StateCast` in the model's `$casts` array, causing the state field to return a raw string instead of a state object. The entire state machine is non-functional.

### Why It Happens
Developers follow standard Eloquent casting conventions and cast the state column as a string. The `StateCast` requirement is unique to the Spatie package and can be missed during setup. Copying a migration from another model may omit the cast registration.

### Warning Signs
- `$casts` array has `'status' => 'string'` instead of `StateCast::class . ':' . OrderState::class`
- `$model->status` returns a string instead of a state object
- `$model->status->transitionTo()` throws "method not found" or "call to a member function on string"
- State-specific query scopes not working (e.g., `$query->whereState(...)`)
- State classes never instantiated — no state methods available on the field
- `$model->status` is used in string comparisons instead of `$model->status->equals(...)`

### Why Harmful
- The state machine is completely broken — no transition validation, no state behavior
- `$order->status->transitionTo(Approved::class)` throws a runtime error
- No state-specific methods available on the field
- Developers may not notice until they try to use state machine features in production
- The model appears to have state support but it's non-functional

### Consequences
- A critical `transitionTo()` call fails in production — user sees 500 error
- State-specific logic is unreachable because the state object is never instantiated
- Debugging takes hours because the issue is a missing cast registration
- Developers work around it by using string comparisons, never fixing the root cause
- All state machine features (query scopes, transition validation, state methods) are unavailable

### Preferred Alternative
```php
use Spatie\ModelStates\Casts\StateCast;

class Order extends Model
{
    protected $casts = [
        'status' => StateCast::class . ':' . OrderState::class,
    ];
}
```

### Refactoring Strategy
1. Check the `$casts` array on models with state columns
2. Replace string casts with `StateCast::class . ':' . BaseState::class`
3. Verify the base state class is specified correctly (the abstract parent, not a concrete state)
4. Test that `$model->status` returns a state object, not a string
5. Test that `$model->status->transitionTo(...)` works
6. Remove any workaround string comparisons

### Detection Checklist
- [ ] Check `$casts` on models with state columns — is `StateCast` registered?
- [ ] Verify `$model->status` returns a state object instance
- [ ] Test that `$model->status->transitionTo(SomeState::class)` works
- [ ] Search for string comparisons against state fields (`if ($order->status === 'pending')`)
- [ ] Check that state query scopes work (`Order::whereState('status', Pending::class)`)

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Register the State Field Using StateCast in the Model's `$casts` |
| Skill | `06-skills.md` — Implement a State Machine Using Spatie Model States |

---

## 5. Duplicate Transition Validation in Controllers

### Category
Maintainability

### Description
Re-implementing transition validation logic in controllers, form requests, or frontend code instead of relying on the state class's `transitionableStates()` as the single source of truth. The controller duplicates or pre-empts the state machine's own validation.

### Why It Happens
Developers want to return user-friendly error messages or disable UI buttons. They add checks in controllers to validate transitions before calling the state machine. Over time, the controller validation drifts from the state machine's actual rules.

### Warning Signs
- `if ($order->status->label() === 'Pending')` checks in controllers before transition calls
- Controller-level validation of allowed transitions that mirrors state class logic
- Frontend code that hardcodes allowed transitions instead of querying `transitionableStates()`
- Form requests with transition-specific validation rules
- A transition failing at the state machine level after passing controller validation
- Controller and state machine having different "allowed transitions" lists

### Why Harmful
- Two sources of truth for transition rules — they will drift over time
- Changing a transition rule requires updating both the state class and controller logic
- The state machine's built-in `InvalidTransition` exception is caught and ignored
- Developers fix transition rules in the wrong place (controller instead of state class)
- New team members don't know where transition rules are defined

### Consequences
- Adding `Refunded` state requires changes to 3 controllers that duplicate transition logic
- UI shows a transition as allowed but the state machine rejects it — confusing users
- A controller's `if` check uses string comparison (`'pending'`) and misses a renamed state
- The state class's `transitionableStates()` is ignored — developers look at controllers first
- Duplicate logic increases test surface — must test both controller and state class validation

### Preferred Alternative
```php
class OrderController extends Controller
{
    public function approve(Order $order): JsonResponse
    {
        try {
            $order->status->transitionTo(Approved::class);
        } catch (InvalidTransition $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }
}
```

### Refactoring Strategy
1. Identify controller methods with pre-transition validation checks
2. Remove the duplicate checks — let the state machine handle validation
3. Catch `InvalidTransition` exception for user-friendly error handling
4. For UI hints, query `$order->status->transitionableStates()` instead of hardcoding
5. Move any custom validation that's not strictly about allowed transitions to a Transition class
6. Test transitions at the state machine level, not the controller level

### Detection Checklist
- [ ] Search for string comparisons against state field values in controllers
- [ ] Check for `if` blocks that validate state before calling `transitionTo()`
- [ ] Review form request rules for transition-specific validation
- [ ] Verify UI components query `transitionableStates()` rather than hardcoding lists
- [ ] Test that removing controller validation doesn't allow invalid transitions

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Use `transitionableStates()` for Validation, Not for UI Filtering |
| Skill | `06-skills.md` — Implement a State Machine Using Spatie Model States |

---

## 6. Testing State Classes in Isolation

### Category
Testing

### Description
Writing tests that instantiate state classes directly (e.g., `new Approved(new Order())`) and test `transitionableStates()` or other methods without persisting a model instance. These tests miss cast integration issues, serialization problems, and transition guard failures that only surface with real persisted models.

### Why It Happens
Unit-testing state classes in isolation is faster — no database, no factories. The developer may think "I'm testing the state class, not the model." They may not be aware that the Spatie package's internal behavior differs when states are loaded from the database vs instantiated in memory.

### Warning Signs
- Tests that create state objects with `new StateClass(new Model())` instead of `Model::factory()->create()`
- Tests that never persist a model or call `fresh()` to verify database state
- `transitionableStates()` tests that pass in isolation but fail when called through the model
- Cast-related bugs discovered in production (states not saving/loading correctly)
- Transition guard (`authorize()`) methods never tested with real persisted data
- Test suite coverage of allowed transitions that passes but production transitions fail

### Why Harmful
- Cast/deserialization bugs are not caught — the state works in memory but not from the database
- Transition guard methods that check database conditions are not tested
- The test suite provides false confidence that the state machine works end-to-end
- Serialization differences between in-memory and database-loaded states cause production bugs
- The `fresh()` method may reveal that transitions didn't actually persist

### Consequences
- All state tests pass, but `$order->status->transitionTo()` fails in production because `StateCast` wasn't registered
- A transition guard checking `$order->total > 0` passes in tests (unpersisted model has default values) but fails with real data
- `$order->fresh()->status` returns a string because the cast is wrong — not caught in tests
- State comparisons using `equals()` fail because serialization produces different objects
- The team lacks confidence in the state machine without end-to-end tests

### Preferred Alternative
```php
public function test_order_can_transition_from_approved_to_shipped(): void
{
    $order = Order::factory()->create(['status' => Approved::class]);

    $order->status->transitionTo(Shipped::class);

    $this->assertInstanceOf(Shipped::class, $order->fresh()->status);
}

public function test_order_cannot_transition_from_approved_to_cancelled(): void
{
    $order = Order::factory()->create(['status' => Approved::class]);

    $this->expectException(InvalidTransition::class);

    $order->status->transitionTo(Cancelled::class);
}
```

### Refactoring Strategy
1. Identify state tests that don't use persisted model instances
2. Rewrite tests to create models via factories and persist to the test database
3. Test allowed transitions succeed end-to-end (model → transition → fresh → assert)
4. Test disallowed transitions throw `InvalidTransition` with persisted models
5. Test transition guards with database conditions (e.g., insufficient balance)
6. Remove tests that instantiate state classes directly, replacing with integration tests
7. Verify the test uses `fresh()` to confirm the state persisted correctly

### Detection Checklist
- [ ] Search for `new StateClass(` in test files — direct instantiation without persistence
- [ ] Check if tests call `$model->fresh()` after transitions to verify persistence
- [ ] Verify that cast registration issues would be caught by the test suite
- [ ] Test with a real database — do in-memory SQLite and production MySQL behave the same?
- [ ] Check if transition guards are tested with realistic persisted model data

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Test All Transitions with Actual Model Instances |
| Skill | `06-skills.md` — Implement a State Machine Using Spatie Model States |
