# State Pattern Fundamentals

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Domain Modeling Patterns
- **Last Updated:** 2026-06-02

## Executive Summary
The State pattern models behavior as a finite set of states with defined transitions, encapsulating state-specific logic in separate classes. For Laravel developers, this is the theoretical foundation for packages like `spatie/laravel-model-states` and custom enum-based state machines. This KU covers the pure object-oriented state pattern and its application to Eloquent model lifecycle management.

## Core Concepts
- **State:** A distinct condition of an object during its lifecycle, represented as a first-class object.
- **Transition:** A directed move from one state to another, triggered by an event or method call.
- **Context:** The object whose behavior varies based on its current state (the Eloquent model).
- **State-Specific Behavior:** Methods that behave differently depending on which state the context is in.
- **Finite State Machine (FSM):** A mathematical model of computation with a finite number of states and transitions.

## Mental Models
- **"State as a Strategy":** Each state is a strategy object that handles behavior differently. The context delegates to the current state.
- **"The Model Changes Personality":** When a model transitions states, it effectively changes how it responds to the same messages.
- **"A Railroad Track with Stations":** States are stations. Transitions are the tracks between them. Not every station connects to every other station.

## Internal Mechanics
The classic State pattern involves:
- A `Context` class (Eloquent model) that maintains a reference to a `State` instance
- A `State` interface or abstract class declaring all behavior methods
- Concrete `State` classes implementing behavior for each specific state
- State transitions by swapping which `State` instance the context holds

In Eloquent, the state is typically stored as a database column (e.g., `status` VARCHAR) and mapped to state objects via a state factory or registry.

```
$order->state = new PendingState($order);
$order->state->approve(); // delegates to PendingState::approve()
// PendingState::approve() transitions to ApprovedState
```

## Patterns
- **State Interface:** Declares all operations that vary by state.
- **Concrete States:** One class per state, implementing the interface.
- **State Transition Method:** A method on State that returns or sets the next State.
- **State Registry:** A mapping from database values (strings, integers) to State class names.
- **Context Delegation:** The context delegates all state-variant calls to the current state object.

## Architectural Decisions
- Whether to use PHP enums or dedicated state classes
- How transitions are validated (each state decides its valid transitions)
- Whether state objects are shared (singletons) or per-context instances
- How to persist state: in a single column vs state history table

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Eliminates switch/if-else chains on status | More classes to maintain | Acceptable for 3+ states; overkill for binary states |
| Each state's logic is isolated and testable | Transition logic distributed across state classes | Use transition guard classes to centralize rules |
| New states can be added without modifying existing code | Requires careful interface design upfront | Design state interface early; expect iterations |
| Explicit, documented state graph | Runtime overhead of state object construction | Negligible; cache state instances per context |

## Performance Considerations
- State object instantiation per request is cheap; no measurable overhead for typical web apps.
- Avoid serializing state objects to cache; store the state identifier and reconstruct.
- For high-throughput contexts, consider stateless state objects (flyweight pattern) shared across contexts.
- Database column state lookups are single-row reads; no performance concern.

## Production Considerations
- Log all state transitions with actor, timestamp, and reason for audit compliance.
- Implement a `canTransitionTo($targetState)` method for UI hinting (disable buttons, hide options).
- Monitor illegal transition attempts as potential security or bug indicators.
- Provide admin tooling to force-transition out of stuck states.

## Common Mistakes
- Using state pattern for binary states (active/inactive) where a boolean would suffice
- Allowing transitions from any state to any other state (no transition map)
- Putting too much logic (not just state-variant) into state classes
- Forgetting to persist the new state after a transition
- Creating cyclic state graphs without proper guards

## Failure Modes
- **Orphaned States:** A transition fails mid-way, leaving the context in an inconsistent state. Mitigate by persisting state at the end of a successful transition.
- **Missing Transition:** A required transition is accidentally omitted from the state map. Catch with comprehensive transition tests.
- **State Explosion:** Too many states make the graph unwieldy. Group related states or simplify the model.
- **Transition Side-Effects:** External effects in transition logic cause partial failures. Use domain events for side effects.

## Ecosystem Usage
- Laravel itself uses state-like patterns in `Illuminate\Foundation\Http\Kernel` (bootstrapping sequence)
- `spatie/laravel-model-states` — the primary Eloquent state machine package
- `artemis-psekas/laravel-fsm` — alternative FSM implementation
- `php-state/state-machine` — framework-agnostic PHP state machine

## Related Knowledge Units

### Prerequisites
- OOP Design Patterns — understanding the Strategy pattern and pattern fundamentals
- PHP 8.1 Backed Enums — enum syntax, backing values, and methods
- domain-methods-on-models — behavioral methods on Eloquent models

### Related Topics
- spatie-model-states
- custom-state-machine
- transition-guards

### Advanced Follow-up Topics
- domain-methods-on-models
- aggregate-boundaries

## Research Notes
- Gamma et al.: *Design Patterns: Elements of Reusable Object-Oriented Software* (1994) — State pattern origin
- Fowler: *Patterns of Enterprise Application Architecture* (2002) — State pattern in enterprise context
- UML State Machine diagrams formalize states, transitions, guards, and actions
- Finite State Machine theory from computational theory; in practice, hierarchical state machines (HSM) are sometimes useful
