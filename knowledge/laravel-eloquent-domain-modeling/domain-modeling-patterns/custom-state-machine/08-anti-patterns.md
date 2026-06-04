# Custom State Machine — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Domain Modeling Patterns |
| Knowledge Unit | Custom State Machine |
| Focus | Anti-patterns in custom state machine implementation |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Raw String Status Values Without Enum | Reliability | Critical |
| 2 | Scattered Transition Logic in Controllers | Design | High |
| 3 | Guards and Transition Execution Mixed Together | Maintainability | Medium |
| 4 | Generic Exception for Invalid Transitions | Maintainability | Medium |
| 5 | No Transition Map — Implicit Transitions in Methods | Maintainability | High |
| 6 | Untested Invalid Transition Paths | Testing | High |

## Repository-Wide Cross-Cutting Patterns

- Status columns stored and manipulated as raw strings without backed enums is the most common and most dangerous pattern
- Transition logic scattered across controllers instead of encapsulated in the model or state machine class
- Transition maps are frequently absent — valid transitions are implicit in method implementation

---

## 1. Raw String Status Values Without Enum

### Category
Reliability

### Description
Storing state values as raw strings in the database column and manipulating them with string comparisons in business logic. Any string value can be assigned, and invalid states are not prevented at the type level.

### Why It Happens
Eloquent models default to string attributes. Adding an enum type seems like extra work. The state column "works fine" with strings. Developers may not know about PHP backed enums or Eloquent's enum casting.

### Warning Signs
- `$casts` array has no enum cast for the status column
- `$order->status === 'pending'` string comparisons throughout the codebase
- Status values defined as class constants (`STATUS_PENDING = 'pending'`)
- No enum class for state representation
- Invalid status values found in the database (misspellings, legacy values)
- `switch` or `match` statements comparing `$model->status` against string literals

### Why Harmful
- Any string can be assigned to the status column — including typos and invalid values
- No type safety: method parameters accept `string $status` instead of `OrderStatus $status`
- String comparisons are error-prone (case sensitivity, whitespace)
- Refactoring status values requires finding all string literals across the codebase
- IDEs cannot autocomplete or refactor string literal comparisons

### Consequences
- Invalid state values in the database from typos or legacy data
- Status comparisons that fail silently due to case mismatches
- Debugging time wasted on "status should be pending but is 'pendin'" issues
- No compile-time checking for state transitions
- Migration scripts needed to clean up invalid state values

### Preferred Alternative
```php
enum OrderStatus: string
{
    case Pending = 'pending';
    case Approved = 'approved';
    case Shipped = 'shipped';
    case Delivered = 'delivered';
    case Cancelled = 'cancelled';
}

class Order extends Model
{
    protected $casts = ['status' => OrderStatus::class];
}
```

### Refactoring Strategy
1. Define a backed enum with all valid states
2. Add the enum cast to the model's `$casts` array
3. Replace all string comparisons with enum comparisons
4. Replace string method parameters with enum type hints
5. Run a data migration to clean up any invalid string values

### Detection Checklist
- [ ] Search for status string comparisons: `->status === '` in application code
- [ ] Check model `$casts` for enum entries on state columns
- [ ] Search for class constants used as status values
- [ ] Query database for unexpected status values
- [ ] Verify method signatures use enum types, not strings

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Use PHP Backed Enums for State Representation |
| Rule | `05-rules.md` — Cast the State Column Using Eloquent's Enum or Custom Cast |
| Decision Tree | `07-decision-trees.md` — Enum vs Constants for States |
| Skill | `06-skills.md` — Build a Custom State Machine With PHP Enums |

---

## 2. Scattered Transition Logic in Controllers

### Category
Design

### Description
Implementing state transition logic — status checks, guards, and assignment — directly in controllers instead of encapsulating it in the model or a state machine class. Business rules are scattered across HTTP endpoints.

### Why It Happens
Controllers are the default place for request handling logic. Status transitions seem like "just setting a field." Developers may not recognize state management as domain logic that belongs in the model layer.

### Warning Signs
- `if ($order->status === 'pending')` checks in controller methods
- `$order->status = 'approved'; $order->save();` in controllers
- Same transition guard logic repeated in multiple controllers
- Controllers handling what should be a model-level `transitionTo()` call
- No `transitionTo()` method on the model — transitions are managed externally
- Tests for transitions written as HTTP integration tests instead of model unit tests

### Why Harmful
- Business rules about valid transitions are duplicated across endpoints
- Adding a new transition endpoint requires reimplementing all guard logic
- Transition behavior cannot be reused from command-line or queue contexts
- Testing transitions requires HTTP tests instead of simple model tests
- Domain logic is tightly coupled to the HTTP layer

### Consequences
- Duplicated transition logic across controllers
- Some code paths may skip guard checks (inconsistency)
- Business rule changes require updating multiple controllers
- Transitions are inaccessible from non-HTTP contexts (CLI, queues)
- Test suite is slower and more complex than necessary

### Preferred Alternative
```php
// In model:
public function transitionTo(OrderStatus $newStatus): void
{
    $this->guardTransition($newStatus);
    $this->status = $newStatus;
    $this->save();
}

// In controller:
$order->transitionTo(OrderStatus::Approved);
```

### Refactoring Strategy
1. Identify all controller methods that manage state transitions
2. Extract the guard logic and status assignment into a `transitionTo()` method on the model
3. Replace controller transition logic with `$model->transitionTo()` calls
4. Remove duplicated guard logic from controllers
5. Add model-level tests for transitions

### Detection Checklist
- [ ] Search for `->status =` assignments in controllers
- [ ] Search for `->status ===` or `->status !==` in controllers
- [ ] Check if the model has a `transitionTo()` method
- [ ] Count the number of controllers implementing the same transition logic
- [ ] Verify transitions work from CLI commands or queued jobs

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Keep State Machine Logic Out of Controllers and Actions |
| Skill | `06-skills.md` — Build a Custom State Machine With PHP Enums |

---

## 3. Guards and Transition Execution Mixed Together

### Category
Maintainability

### Description
Precondition checks (guards) and the actual state transition code are interleaved in a single method. Guards cannot be tested independently, and the transition method is bloated with validation logic.

### Why It Happens
The simplest implementation puts everything in one method. Guards are "just a few if statements at the top." The distinction between guard logic and transition logic may not be recognized.

### Warning Signs
- `transitionTo()` method that contains both guard conditions and `$this->status = ...`
- Guards implemented as inline `if` blocks before the status assignment
- No separate guard method or guard class
- Tests for transition validation go through the full `transitionTo()` path
- Guard logic and transition logic share local variables
- Adding a new guard requires modifying the `transitionTo()` method

### Why Harmful
- Guards cannot be unit tested independently — every test goes through the full transition
- The transition method violates single responsibility (guards + transition + persistence)
- Adding or changing guards modifies the transition method, risking regression in the transition itself
- Callers cannot check preconditions without attempting the transition
- Guard logic is coupled to transition execution, making reuse impossible

### Consequences
- Guard tests are slower (they execute the full transition path)
- Guard logic cannot be reused by other methods that need similar preconditions
- Adding a guard requires modifying (and potentially breaking) the transition method
- The transition method becomes harder to read as guards accumulate
- Callers must attempt and catch exceptions to check preconditions

### Preferred Alternative
```php
public function transitionTo(OrderStatus $newStatus): void
{
    $this->guardTransition($newStatus);
    $this->status = $newStatus;
    $this->save();
}

private function guardTransition(OrderStatus $newStatus): void
{
    if (! $this->isVerified()) {
        throw new CustomerNotVerifiedException();
    }
    if (! in_array($newStatus, $this->status->allowedTransitions())) {
        throw new InvalidTransitionException($this->status, $newStatus);
    }
}
```

### Refactoring Strategy
1. Extract guard conditions from the transition method into a separate `guardTransition()` method
2. Ensure the guard method throws specific exceptions for each condition
3. Call `guardTransition()` at the beginning of `transitionTo()`
4. Write independent tests for `guardTransition()` that verify each guard condition
5. Simplify transition tests to only verify the happy path

### Detection Checklist
- [ ] Check `transitionTo()` for inline guard conditions mixed with assignment
- [ ] Verify there's a separate guard method or guard class
- [ ] Check if guard tests exist independently of transition tests
- [ ] Review how callers check preconditions — do they try/catch exceptions?
- [ ] Verify that guards can be tested without persisting changes

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Separate Guard Conditions from Transition Execution Logic |
| Skill | `06-skills.md` — Build a Custom State Machine With PHP Enums |

---

## 4. Generic Exception for Invalid Transitions

### Category
Maintainability

### Description
Throwing a generic `\DomainException` or `\InvalidArgumentException` for all transition failures. Callers cannot distinguish between "invalid transition," "customer not verified," and "outstanding balance" without parsing error messages.

### Why It Happens
Generic exceptions are the default choice. Creating custom exception classes seems like boilerplate. The developer may not anticipate that callers would need to distinguish between failure types.

### Warning Signs
- `throw new \DomainException('Cannot transition...')` in transition guards
- `throw new \InvalidArgumentException('Invalid status')` for state machine errors
- Callers catching `\DomainException` and checking `$e->getMessage()` for string patterns
- No custom exception classes for the state machine
- Error handling that logs and returns a generic "invalid operation" message
- Tests asserting on exception messages instead of exception types

### Why Harmful
- Callers must parse exception messages to determine the failure reason (brittle)
- Different failure types cannot be handled differently (different HTTP status codes, different user messages)
- Adding a new guard requires no new exception type — it just adds another string message
- Tests assert on message strings, which are fragile and change with refactoring
- Monitoring cannot distinguish between different failure types without message parsing

### Consequences
- All transition failures return the same HTTP 422 with a generic error message
- User-facing error messages are unhelpful ("Cannot transition" vs "Customer not verified")
- Monitoring cannot track specific failure types
- Tests break when error messages are reworded
- Adding new guards silently conflates with existing failure types

### Preferred Alternative
```php
throw new InvalidTransitionException(OrderStatus::Pending, OrderStatus::Shipped);
// Or:
throw new CustomerNotVerifiedException($this->id);
```

### Refactoring Strategy
1. Identify all transition-related exceptions thrown as generic types
2. Create custom exception classes for each distinct failure mode
3. Update guard methods to throw the specific exceptions
4. Update callers to catch specific exceptions
5. Update tests to assert on exception types, not messages

### Detection Checklist
- [ ] Search for `throw.*DomainException` and `throw.*InvalidArgument` in state machine code
- [ ] Check if callers parse exception messages to determine failure type
- [ ] Review the project's exception hierarchy for state-machine-specific exceptions
- [ ] Check tests for `expectExceptionMessage` vs `expectException` patterns
- [ ] Verify that API error responses distinguish between different failure types

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Throw Domain-Specific Exceptions on Invalid Transitions |
| Skill | `06-skills.md` — Build a Custom State Machine With PHP Enums |

---

## 5. No Transition Map — Implicit Transitions in Methods

### Category
Maintainability

### Description
Defining individual transition methods (`approve()`, `ship()`, `deliver()`) each with their own inline guard logic, without an explicit transition map that shows all valid state transitions in one place.

### Why It Happens
Each transition method seems natural: `approve()` sets status to approved, `ship()` sets status to shipped. The transition map is implicit — you must read every method to understand the state machine.

### Warning Signs
- Individual methods like `approve()`, `cancel()`, `ship()` each setting `$this->status = ...`
- No `allowedTransitions()` or equivalent method on the enum or state machine class
- Impossible to determine valid transitions without reading all methods
- New transitions require adding a new method with no central validation
- Missing transitions discovered during testing when someone tries them
- `switch` or `if/else` chains for behavior based on status, with no upfront transition map

### Why Harmful
- The full state space is not visible in any single location
- Adding a new state requires understanding all existing methods to avoid conflicts
- Code review cannot verify the state machine's correctness without the full transition map
- Missing transitions (state A → state C skipping B) may be accidentally allowed
- The state machine is harder to audit and reason about

### Consequences
- Unintended state transitions discovered in production
- Difficulty onboarding: new developers must read all transition methods
- Missing transitions that should be allowed are discovered reactively
- State machine logic scattered across individual methods
- Higher risk of transition bugs compared to a single visible transition map

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

// Single transition method that uses the map
public function transitionTo(OrderStatus $newStatus): void
{
    if (! in_array($newStatus, $this->status->allowedTransitions())) {
        throw new InvalidTransitionException(...);
    }
    $this->status = $newStatus;
    $this->save();
}
```

### Refactoring Strategy
1. Document all valid state transitions based on current methods
2. Add an `allowedTransitions()` method to the state enum
3. Add a generic `transitionTo()` method on the model that uses the transition map
4. Replace individual transition methods with `transitionTo()` calls
5. Remove individual transition methods

### Detection Checklist
- [ ] Search for methods that set the status field (`$this->status = `)
- [ ] Check for an `allowedTransitions()` or transition map method
- [ ] Count how many methods you must read to understand all transitions
- [ ] Verify the transition map is visible in a single location
- [ ] Test all possible transition combinations — are any missing?

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Define All Transitions in a Single Visible Map |
| Skill | `06-skills.md` — Build a Custom State Machine With PHP Enums |

---

## 6. Untested Invalid Transition Paths

### Category
Testing

### Description
Testing only the "happy path" transitions while ignoring invalid or disallowed transitions. Invalid state changes can be made in production without detection.

### Why It Happens
Happy-path testing is natural — test that `Pending → Approved` works. Testing invalid transitions requires iterating over all `from* → *to` combinations, which seems tedious. Developers assume invalid transitions won't be attempted.

### Warning Signs
- Tests only verify allowed transitions succeed
- No tests for disallowed transitions (e.g., `Delivered → Pending`)
- No full transition matrix coverage
- Transition tests are sparse or cover only the most common paths
- Invalid transitions discovered in production testing
- Bug reports of models in impossible states

### Why Harmful
- Anyone can call `transitionTo()` with any state — the only protection is guards
- Untested guard paths may have bugs or missing checks
- Invalid state data in production requires manual database fixes
- The state machine's correctness is not validated — it's a runtime trust exercise
- Adding new states or transitions may introduce gaps without test detection

### Consequences
- Production data in impossible states (e.g., cancelled order later shipped)
- Manual data remediation required
- Business logic failures from unexpected state combinations
- Customer-facing errors from invalid state assumptions
- Developer confidence undermined in the state machine's correctness

### Preferred Alternative
```php
public function test_full_transition_matrix(): void
{
    foreach (OrderStatus::cases() as $from) {
        foreach (OrderStatus::cases() as $to) {
            $order = Order::factory()->create(['status' => $from]);

            if (in_array($to, $from->allowedTransitions())) {
                $order->transitionTo($to);
                $this->assertEquals($to, $order->fresh()->status);
            } else {
                $this->expectException(InvalidTransitionException::class);
                $order->transitionTo($to);
            }
        }
    }
}
```

### Refactoring Strategy
1. Create a test that iterates over all `from × to` combinations
2. Verify allowed transitions succeed and result in the correct state
3. Verify disallowed transitions throw the appropriate exception
4. Add guard-specific tests for each precondition check
5. Run the matrix test on every state change to catch regressions

### Detection Checklist
- [ ] Check if transition tests cover all state combinations
- [ ] Search for "expectException" or "expectExceptionObject" in state machine tests
- [ ] Verify that attempted invalid transitions throw exceptions
- [ ] Run the full transition matrix and count untested paths
- [ ] Review bug reports for state machine violations — are they tested now?

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Test Every Valid and Invalid Transition Path |
| Skill | `06-skills.md` — Build a Custom State Machine With PHP Enums |
