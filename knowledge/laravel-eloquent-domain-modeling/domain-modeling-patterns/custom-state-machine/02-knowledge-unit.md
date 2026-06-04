# Custom State Machine

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Domain Modeling Patterns
- **Last Updated:** 2026-06-02

## Executive Summary
Not every state machine warrants a package. Building a custom state machine with PHP enums, array transition maps, and dedicated transition logic keeps the dependency footprint small and gives full control over the state machine implementation. This KU covers patterns for building lightweight, testable, and expressive state machines directly in your Laravel application.

## Core Concepts
- **State Enum:** A PHP backed enum representing all possible states.
- **Transition Map:** A data structure (usually an array or collection) mapping each state to its allowed transitions.
- **Transition Logic:** The code executed during a state change, separate from state representation.
- **Transition Guard:** A precondition check that must pass for a transition to be allowed.
- **State Machine Class:** A dedicated class encapsulating state configuration, validation, and transition execution.

## Mental Models
- **"Enum for Data, Class for Behavior":** Use PHP enums for the state identifier; use a dedicated class or method for transition logic.
- **"Explicit Transition Map Over Magic":** A visible array of `from => [to, to, ...]` pairs is easier to audit than implicit transitions in state classes.
- **"Stateless Machine, Stateful Context":** The state machine configuration is stateless and reusable; the model carries the current state.

## Internal Mechanics
A custom state machine typically consists of:

```php
enum OrderStatus: string
{
    case Pending = 'pending';
    case Approved = 'approved';
    case Shipped = 'shipped';
    case Delivered = 'delivered';
    case Cancelled = 'cancelled';
}

class OrderStateMachine
{
    private static array $transitions = [
        'pending' => ['approved', 'cancelled'],
        'approved' => ['shipped', 'cancelled'],
        'shipped' => ['delivered'],
        'delivered' => [],
        'cancelled' => [],
    ];

    public static function canTransition(OrderStatus $from, OrderStatus $to): bool
    {
        return in_array($to->value, self::$transitions[$from->value] ?? []);
    }

    public static function transition(Order $order, OrderStatus $newStatus): void
    {
        $from = $order->status;
        if (!self::canTransition($from, $newStatus)) {
            throw new InvalidTransitionException($from, $newStatus);
        }
        $order->status = $newStatus;
        $order->save();
    }
}
```

## Patterns
- **Enum + Lookup Table:** Central transition map as a static array or config file.
- **Guard Methods:** `canTransitionTo()`, `allowedTransitions()`, `transitionableStates()` as query methods.
- **State Machine Service:** A dedicated service class injected where transitions are needed.
- **Trait on Model:** Add `HasStateMachine` trait for `transitionTo()`, `inState()`, `hasState()` helpers.
- **State Graph Object:** A `StateGraph` value object that holds states, transitions, guards, and entry/exit actions.

## Architectural Decisions
- Whether to use enum backing strings or integers (strings are more readable in DB)
- Whether the transition map lives in a config file, a dedicated class, or an attribute-based declaration
- How to handle entry and exit actions (before/after hooks on transition)
- Whether to allow batch transitions via direct enum assignment or force all transitions through the machine

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Zero external dependencies | Must build and maintain transition infrastructure | Small investment for stateful domains |
| Full control over transition logic | No built-in history logging | Add manually or via model events |
| Easy to debug and extend | More boilerplate for each state machine | Abstract into reusable trait/class |
| No learning curve for new team members | Less discoverable than package conventions | Document the pattern in your project |

## Performance Considerations
- Enum comparison is faster than class instantiation; minimal overhead.
- Static transition maps are compiled once per request; no runtime parsing.
- Guard checks are O(1) lookups; no measurable impact.
- For thousands of simultaneous transitions, use optimistic locking with a version column.

## Production Considerations
- Test every transition path explicitly (happy path, guards, invalid transitions).
- Log all transitions produced by the custom machine for audit trail.
- Use `DB::transaction()` around transition logic to ensure atomicity.
- Consider splitting complex state machines into their own directory (`app/StateMachines/`).
- Provide a `allowedNextStates()` method for UI rendering (button visibility, dropdown options).

## Common Mistakes
- Putting transition logic inside controller methods (duplication across HTTP and CLI entrypoints)
- Forgetting to persist the state after transition (silently losing the change)
- Allowing direct property assignment (`$order->status = 'shipped'`) bypassing the state machine
- Making the transition map mutable at runtime, leading to unpredictable behavior
- Not handling enum serialization for API responses and form requests

## Failure Modes
- **Inconsistent State After Exception:** A transition fails mid-execution, model state is halfway changed. Mitigate by using early returns and transactional wrappers.
- **Enum vs DB Drift:** The PHP enum is updated but existing DB rows have old values. Write a migration to normalize states.
- **Forgotten Transition Path:** A new state is added to the enum but not added to the transition map. Catch with tests that verify full coverage.
- **Guard Contradiction:** Two guards with overlapping conditions produce unexpected denials. Test guard combinations.

## Ecosystem Usage
- Most Laravel apps start with enum-based state machines before adopting Spatie's package
- `spatie/enum` (now superseded by native PHP enums) was widely used before PHP 8.1
- Common in SaaS apps managing subscription states, order fulfillment, approval workflows
- Many OSS Laravel starter kits use simple enum state machines

## Related Knowledge Units

### Prerequisites
- state-pattern-fundamentals — states, transitions, and state machine theory
- PHP 8.1 Backed Enums — using enums as state identifiers
- domain-methods-on-models — behavioral methods for transition entry points

### Related Topics
- state-pattern-fundamentals
- transition-guards
- spatie-model-states

### Advanced Follow-up Topics
- domain-methods-on-models
- aggregate-boundaries

## Research Notes
- PHP 8.1 backed enums made custom state machines significantly cleaner
- Community preference has shifted from custom to Spatie package for 4+ state machines
- Enum-based machines are still preferred for simple workflows (2-3 states) where package overhead isn't justified
- Advanced: hierarchical state machines (states within states) are possible but rarely needed in typical Laravel apps
