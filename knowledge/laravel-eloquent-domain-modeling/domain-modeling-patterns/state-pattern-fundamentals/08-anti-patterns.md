# State Pattern Fundamentals — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Domain Modeling Patterns |
| Knowledge Unit | State Pattern Fundamentals |
| Focus | Anti-patterns in state machine design and implementation |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Raw String State Values (No Typed Enum) | Design | Critical |
| 2 | Runtime-Only Transition Validation Without Explicit Map | Architecture | Critical |
| 3 | Monolithic Model with Mixed State Data and Behavior | Architecture | High |
| 4 | Scattered Implicit Transitions Across Methods | Maintainability | High |
| 5 | Missing Enum Cast on State Column | Framework Usage | High |
| 6 | Incomplete Transition Testing (Happy-Path Only) | Testing | High |

## Repository-Wide Cross-Cutting Patterns

- The most critical anti-pattern is storing state as raw strings or integers with no typed enum, allowing invalid states to silently enter the database
- Scattering transition rules across individual model methods (`approve()`, `ship()`, `deliver()`) creates an invisible state machine — the complete transition graph cannot be audited
- Precondition guards duplicated in controllers create drift — some entry points bypass validation while others are over-validated

---

## 1. Raw String State Values (No Typed Enum)

### Category
Design

### Description
Storing state values as raw strings or integers in the database without a backed enum type. Any string value can be assigned to the state column, including typos, unexpected values, or states that don't exist.

### Why It Happens
Setting up an enum class and cast seems like extra work compared to just adding a string column. The team may start with strings "for simplicity" and plan to add an enum later. The codebase may predate PHP 8.1 enums.

### Warning Signs
- `$fillable = ['status']` with no cast — any string accepted
- String comparisons throughout the codebase: `$order->status === 'pending'`
- `in_array($order->status, ['pending', 'approved', 'shipped'])` patterns
- State-related bugs from typos: `'shipped'` vs `'shippped'` vs `'shiped'`
- Database queries filtering state with hardcoded string literals
- No single source of truth for valid state values

### Why Harmful
- Invalid state values are stored silently — no type error at assignment time
- A typo in a migration, seeder, or manual query introduces unrecoverable state
- Refactoring state names requires searching for all string literals in the codebase
- No IDE autocompletion or type checking for state values
- Downstream code must handle "impossible" state values defensively

### Consequences
- `$order->status = 'shipped'` (missing 'p') creates an order that can never transition
- A migration sets status to `'pending'` but the enum says `'Pending'` — mismatch
- Every read of the state field must handle unknown values: `OrderStatus::tryFrom($order->status) ?? OrderStatus::Pending`
- Renaming a state requires a full-text search across the entire codebase
- New states added to documentation but never validated by the type system

### Preferred Alternative
```php
enum OrderStatus: string
{
    case Pending = 'pending';
    case Approved = 'approved';
    case Shipped = 'shipped';
}

class Order extends Model
{
    protected $casts = ['status' => OrderStatus::class];
}
// $order->status = 'invalid' — type error at assignment
```

### Refactoring Strategy
1. Create a backed enum with all valid states
2. Add the enum cast to the model
3. Update all string assignments to use enum cases: `$order->status = OrderStatus::Pending`
4. Update all string comparisons to use enum instances: `$order->status === OrderStatus::Pending`
5. Run a data migration to convert existing string values to valid enum values
6. Add database CHECK constraint or validation for any remaining raw assignments

### Detection Checklist
- [ ] Search for string assignments to state columns in the codebase
- [ ] Check `$casts` array for state columns — is the enum cast registered?
- [ ] Count string literal state comparisons vs enum comparisons
- [ ] Review the database schema — is the state column untyped (varchar)?
- [ ] Verify that invalid state values would be caught at the type level

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Represent Each State as a Backed PHP Enum |
| Skill | `06-skills.md` — Model a Finite State Machine With Backed Enums |
| Knowledge | `04-standardized-knowledge.md` — State Pattern Fundamentals |

---

## 2. Runtime-Only Transition Validation Without Explicit Map

### Category
Architecture

### Description
Implementing transition validation through individual `if` checks in each transition method without maintaining an explicit, consolidated transition map. The allowed paths are implicit in the code structure and cannot be audited without reading every method.

### Why It Happens
Developers add transition methods one at a time as new states are needed. Each method has its own precondition checks. The full state machine emerges organically but is never documented in a single place. The team doesn't realize they've built a state machine without a map.

### Warning Signs
- Separate `approve()`, `ship()`, `deliver()`, `cancel()` methods with individual `if` checks
- No `allowedTransitions()` or equivalent consolidated map anywhere
- Understanding the state machine requires reading 5+ method bodies
- Adding a new state requires modifying 3-4 methods to update their individual checks
- Developers guess at allowed transitions by reading method names
- Documentation of the state machine (if it exists) is out of sync with the code

### Why Harmful
- The complete transition graph is unknowable without reading every method
- Adding a new state requires changing multiple methods — easy to miss one
- Code review cannot verify the entire state machine correctness without cross-referencing methods
- New developers must reverse-engineer the state machine from scattered logic
- Undocumented transition paths may exist that even the original developers forgot

### Consequences
- A method exists that allows `delivered → pending` — no one knows if it's intentional
- Adding a `Refunded` state requires updating 6 methods — one is missed
- A new developer accidentally creates a transition path that bypasses business rules
- Compliance audit cannot verify state machine correctness without reading 200 lines of methods
- The team is afraid to refactor transitions because the full graph isn't documented

### Preferred Alternative
```php
enum OrderStatus: string
{
    case Pending = 'pending';
    case Approved = 'approved';
    case Shipped = 'shipped';

    public function allowedTransitions(): array
    {
        return match ($this) {
            self::Pending => [self::Approved, self::Cancelled],
            self::Approved => [self::Shipped],
            self::Shipped => [self::Delivered],
            self::Delivered => [],
            self::Cancelled => [],
        };
    }
}
// Complete transition graph visible in one method — fully auditable
```

### Refactoring Strategy
1. Document the current (implicit) state machine by reading all transition methods
2. Create a single `allowedTransitions()` method on the enum or a dedicated class
3. Replace individual `if` checks in each method with the consolidated map
4. Remove duplicate precondition logic from individual methods
5. Add tests that prove the consolidated map matches the previously implicit behavior
6. Delete the now-unnecessary individual validation methods

### Detection Checklist
- [ ] Is there a single method or data structure showing all allowed transitions?
- [ ] Count transition methods — how many places define allowed paths?
- [ ] Can a new team member enumerate all valid transitions in 30 seconds?
- [ ] Review if individual transition methods duplicate validation logic
- [ ] Check if adding a new state requires changes in 3+ separate locations

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Make Invalid State Transitions Impossible at the Type Level |
| Rule | `05-rules.md` — Define the Complete Transition Map in a Single Visible Location |
| Skill | `06-skills.md` — Model a Finite State Machine With Backed Enums |

---

## 3. Monolithic Model with Mixed State Data and Behavior

### Category
Architecture

### Description
Putting both state data (the state field) and all transition behavior (validation, side effects, queries) directly on the Eloquent model. The model class grows with state-specific methods, mixing persistence concerns with state machine logic.

### Why It Happens
The model is the most natural place to put transition methods — it has access to all model state. Laravel's convention of "fat models" encourages this. Separating state machine logic into its own class or the enum itself seems like unnecessary indirection.

### Warning Signs
- Model class with 5+ transition methods (`approve()`, `ship()`, `deliver()`, `cancel()`, `refund()`)
- Model class imports infrastructure classes (Mail, Queue, Event) for transition side effects
- Transition logic mixed with validation, event dispatching, and persistence in the same method
- Model tests must persist to the database even for simple transition rule checks
- The `Order` model file exceeds 300 lines largely due to state-related methods
- Domain logic that's hard to reuse across multiple models with similar state machines

### Why Harmful
- Testing transition rules requires a database connection (can't test in isolation)
- The model violates Single Responsibility — it handles persistence, validation, and state machine logic
- Transition logic coupled to Eloquent — can't use the same state machine for non-ORM objects
- Side effects in transition methods make the model hard to mock in other tests
- Extracting the domain layer for reuse requires unwinding the model's transition logic

### Consequences
- `Order` model with 400 lines — 200 are state-related methods
- Testing `canTransitionTo()` requires creating a full `Order` in the database
- The state machine logic cannot be reused for a different entity with the same workflow
- Changing storage from Eloquent to something else requires rewriting all transition logic
- Unit tests become integration tests because transition logic is on the model

### Preferred Alternative
```php
// State data is the enum
enum OrderStatus: string
{
    public function allowedTransitions(): array { ... }
}

// State behavior is a dedicated class
class OrderStateMachine
{
    public function __construct(private Order $order) {}

    public function transitionTo(OrderStatus $newStatus): void
    {
        if (! in_array($newStatus, $this->order->status->allowedTransitions())) {
            throw new InvalidTransitionException(...);
        }
        // Apply guards, dispatch events...
        $this->order->status = $newStatus;
        $this->order->save();
    }
}
```

### Refactoring Strategy
1. Identify all state-related methods on the model
2. Extract transition validation logic to the enum's `allowedTransitions()` method
3. Extract transition execution logic to a dedicated state machine class
4. Move side effects (event dispatching, logging) to the state machine or transition classes
5. Leave only the state field and cast on the model
6. Update callers to use the state machine class instead of model transition methods

### Detection Checklist
- [ ] Count state-related methods on the model — 5+ signals extraction is needed
- [ ] Review model imports — are infrastructure classes imported for transition side effects?
- [ ] Check if state transition logic is independent of Eloquen'ts save mechanism
- [ ] Verify the model has a single responsibility (persistence) vs multiple
- [ ] Test whether transition rules can be verified without a database connection

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Separate State Data from State Behavior |
| Skill | `06-skills.md` — Model a Finite State Machine With Backed Enums |
| Knowledge | `04-standardized-knowledge.md` — State Pattern Fundamentals |

---

## 4. Scattered Implicit Transitions Across Methods

### Category
Maintainability

### Description
Defining allowed transitions implicitly through individual model methods like `approve()`, `ship()`, `deliver()` where each method has its own precondition check. No single consolidated transition map exists — the state machine is distributed across method bodies.

### Why It Happens
Each method is added independently when the feature is needed. The team may not recognize that they're building a state machine until it's already scattered. Individual methods seem simpler than defining a centralized transition map upfront.

### Warning Signs
- `approve()` method checks `$this->status === 'pending'` before changing to `'approved'`
- `ship()` method checks `$this->status === 'approved'` before changing to `'shipped'`
- Each method duplicates the "check current state, change to new state" pattern
- No `allowedTransitions()` or equivalent map
- Changing a transition rule requires modifying the method body, not a configuration
- New team members can't quickly answer "what states can Pending transition to?"

### Why Harmful
- Transition rules are buried inside method bodies — not discoverable without reading all methods
- Duplicate validation logic across methods (each is similar but slightly different)
- Missing a transition check in one method creates an unintended path
- Code review cannot verify completeness of the state machine
- Adding a new state requires modifying multiple method bodies

### Consequences
- A new `refund()` method is added without checking the current state — `Pending` orders can be refunded accidentally
- Changing `Approved` to not allow direct-to-`Delivered` requires finding and updating the `deliver()` method
- Compliance audit requires printing 6 source files to understand the state machine
- A developer removes an `if` check in `approve()` thinking it's redundant — opens an invalid transition
- The state machine is only fully understood by the developer who wrote it

### Preferred Alternative
```php
enum OrderStatus: string
{
    public function allowedTransitions(): array
    {
        return match ($this) {
            self::Pending => [self::Approved, self::Cancelled],
            self::Approved => [self::Shipped],
            self::Shipped => [self::Delivered],
            self::Delivered => [],
            self::Cancelled => [],
        };
    }
}
// The entire state machine is visible in one method — 100% auditable
```

### Refactoring Strategy
1. Document the implicit transitions by reading all model methods that change state
2. Create the complete transition map in the enum's `allowedTransitions()` method
3. Replace individual precondition checks with a single `transitionTo()` that uses the map
4. Add tests for every possible transition using a data provider
5. Remove the old individual methods (or make them delegates to the new unified method)
6. Verify that no transition paths exist outside the consolidated map

### Detection Checklist
- [ ] Search for methods that check state before reassigning state
- [ ] Count how many places define allowed transition logic
- [ ] Ask team members: "What states can `Pending` transition to?" — do answers match?
- [ ] Verify there's a single method that can enumerate all transitions
- [ ] Check if adding a new state requires changes in 3+ separate locations

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Define the Complete Transition Map in a Single Visible Location |
| Skill | `06-skills.md` — Model a Finite State Machine With Backed Enums |
| Decision Tree | `07-decision-trees.md` — State Pattern vs Enum + Conditional |

---

## 5. Missing Enum Cast on State Column

### Category
Framework Usage

### Description
Not registering Eloquent's `enum` cast on the model attribute that stores the state value. The state field returns a raw string from the database, requiring manual conversion everywhere and allowing invalid values to exist at runtime.

### Why It Happens
Developers may not know about Eloquent's `enum` cast. The column may have been added to `$fillable` or `$guarded` but forgotten in `$casts`. The application appears to work because string comparisons still function — until an invalid value is encountered.

### Warning Signs
- `$casts` array references a state column as `'string'` or omits it entirely
- Code that calls `OrderStatus::tryFrom($order->status)` to convert the raw value
- Inconsistent null checks before using state values
- `$order->getOriginal('status')` returning a string instead of an enum
- State comparisons using string equality: `$order->status === 'pending'`
- Errors when the database contains values not in the enum — no automatic validation

### Why Harmful
- The state field is untyped — any string can be read from the database
- Manual conversion code is scattered throughout the codebase
- Invalid database values only surface when accessed, not when loaded
- Eloquent's automatic hydration doesn't validate the state value
- String comparisons bypass the type system — no IDE support for refactoring
- The enum's behavior methods are unavailable on the raw field

### Consequences
- A seeder sets status to `'pending '` (trailing space) — no cast to catch it
- `$order->status` returns a string — calling `$order->status->allowedTransitions()` fails
- Every state read must be wrapped in `OrderStatus::tryFrom()` with null handling
- A migration sets status to `'PENDING'` (wrong case) — not validated until a comparison fails silently
- Refactoring enum values requires finding all string literals used in comparisons

### Preferred Alternative
```php
class Order extends Model
{
    protected $casts = ['status' => OrderStatus::class];
}
// $order->status is always an OrderStatus instance
// Invalid database values throw a CastError on access
```

### Refactoring Strategy
1. Add the enum cast to the model's `$casts` array
2. Remove all `tryFrom()` and manual conversion code from the codebase
3. Update string comparisons to use enum comparison syntax
4. Run a data migration to fix any existing invalid values in the database
5. Test that invalid database values now throw appropriate cast errors
6. Remove any defensive null handling around state field access

### Detection Checklist
- [ ] Check the `$casts` array for state columns — is the enum cast registered?
- [ ] Search for `tryFrom` calls against the state field
- [ ] Search for string comparisons against state field values
- [ ] Verify the database doesn't contain values that don't exist in the enum
- [ ] Check that accessing the state field returns an enum instance, not a string

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Use Eloquent's Enum Cast for the State Column |
| Skill | `06-skills.md` — Model a Finite State Machine With Backed Enums |
| Knowledge | `04-standardized-knowledge.md` — State Pattern Fundamentals |

---

## 6. Incomplete Transition Testing (Happy-Path Only)

### Category
Testing

### Description
Writing tests that only verify valid transitions succeed without testing invalid transitions. The test suite covers the happy path but leaves invalid paths undiscovered until they cause production issues.

### Why It Happens
Writing tests for invalid transitions feels like testing "what shouldn't happen" — it seems less important. The number of test cases grows quadratically with the number of states. Developers may not realize that invalid transitions are just as important as valid ones.

### Warning Signs
- Tests only cover `Pending → Approved`, `Approved → Shipped` — the main workflow
- No tests for transitions like `Shipped → Pending` (should be invalid)
- No tests for `Cancelled → Approved` (should be invalid)
- Tests added only after a production bug from an invalid transition
- Manual testing relies on UI to restrict transitions, not automated verification
- The transition matrix is partially tested — some states never appear as `from` states in tests

### Why Harmful
- Invalid transitions can reach production without detection
- A state machine change that accidentally allows an invalid path is not caught
- Regression: adding a new state may inadvertently create new invalid paths
- The test suite provides false confidence — it passes but the state machine is broken
- Production data corruption from invalid transitions requires manual database fixes

### Consequences
- An `Approved → Cancelled` transition reaches production because no test verified it's invalid for shipped orders
- A refactoring of `allowedTransitions()` accidentally adds `Delivered → Pending` — not caught
- Production data contains unreachable state combinations that must be repaired
- Support team manually reverts invalid state transitions weekly
- Compliance audit finds state violations that the "tested" state machine should have prevented

### Preferred Alternative
```php
#[DataProvider('transitionProvider')]
public function test_transition(OrderStatus $from, OrderStatus $to, bool $shouldSucceed): void
{
    $order = Order::factory()->create(['status' => $from]);

    if ($shouldSucceed) {
        $order->transitionTo($to);
        $this->assertEquals($to, $order->fresh()->status);
    } else {
        $this->expectException(InvalidTransitionException::class);
        $order->transitionTo($to);
    }
}

public static function transitionProvider(): array
{
    $cases = [];
    foreach (OrderStatus::cases() as $from) {
        foreach (OrderStatus::cases() as $to) {
            $cases["{$from->value} → {$to->value}"] = [
                $from, $to,
                in_array($to, $from->allowedTransitions()),
            ];
        }
    }
    return $cases;
}
```

### Refactoring Strategy
1. List all states and enumerate all possible `from → to` combinations
2. Write a data-driven test that iterates all combinations
3. For each combination, assert either success or `InvalidTransitionException`
4. Use `allowedTransitions()` as the source of truth for expected results
5. Add the data provider to the test suite
6. Run the full matrix after any state machine change

### Detection Checklist
- [ ] Are invalid transitions tested, not just valid ones?
- [ ] Is there a data-driven test covering all `from → to` combinations?
- [ ] Count tested transitions vs possible transitions — is there gap?
- [ ] Have production bugs been caused by untested invalid transitions?
- [ ] Does the test suite catch a change that accidentally allows a previously invalid transition?

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Test the Complete Transition Matrix |
| Skill | `06-skills.md` — Model a Finite State Machine With Backed Enums |
| Knowledge | `04-standardized-knowledge.md` — State Pattern Fundamentals |
