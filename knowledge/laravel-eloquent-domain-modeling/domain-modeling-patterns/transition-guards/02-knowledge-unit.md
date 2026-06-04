# Transition Guards

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Domain Modeling Patterns
- **Last Updated:** 2026-06-02

## Executive Summary
Transition guards are precondition checks that must pass before a state transition is allowed. They enforce business rules, authorization policies, and data integrity constraints at the point of transition. This KU covers guard patterns, implementation strategies, and common guard scenarios in Eloquent-based state machines.

## Core Concepts
- **Guard:** A predicate that returns true (allow) or false/throws (deny) for a proposed transition.
- **Precondition:** A condition that must be true before a transition can execute.
- **Authorization Guard:** Checks whether the current actor is permitted to perform the transition.
- **Business Rule Guard:** Checks domain invariants (e.g., "order cannot be shipped before payment").
- **Data Integrity Guard:** Checks that required data exists (e.g., shipping address must be present).
- **Composite Guard:** Multiple guards evaluated in sequence (all must pass).

## Mental Models
- **"Guard at the Gate":** Before entering a new state, all guards must clear. Like security checkpoints at different stages of a building.
- **"Fail Fast, Fail Clearly":** Guards should evaluate first and fail immediately with specific, actionable messages rather than letting the transition fail ambiguously later.
- **"The Bouncer Analogy":** Each guard is a bouncer checking a different credential. All bouncers must wave the person through.

## Internal Mechanics
Guards typically execute in the transition pipeline:
1. Current state is read from the model
2. All guards are evaluated against the proposed `from -> to` + model state + actor
3. If any guard fails, an exception is thrown and the transition is aborted
4. If all guards pass, the transition logic executes

Implementation approaches:
- **Method on model:** `$order->canShip(): bool`
- **Dedicated guard class:** `new OrderCanShipGuard()->check($order)`
- **Closure in transition map:** `'shipped' => ['guards' => [fn($order) => $order->isPaid]]`
- **State class method:** `Pending::canTransitionTo(Shipped::class, $model): bool`

## Patterns
- **Single Responsibility Guard:** Each guard checks exactly one condition.
- **Guard Collection:** An ordered array of guard objects or closures.
- **Guard That Throws vs Returns Bool:** Throwing yields detailed error messages; bool is simple but less informative.
- **Authorization within Guard:** Call `Gate::authorize()` or `$user->can()` inside a guard.
- **Lazy Data Loading:** Guards load additional data only if needed, minimizing queries on every check.
- **UI Hint Guards:** `canTransitionTo()` variant that returns reasons for denial, enabling UI to show why a button is disabled.

## Architectural Decisions
- Throw exceptions vs return result objects from guards
- Hard-coded guards per transition vs configurable/composable guard chains
- Whether guards are allowed to have side effects (generally, no)
- How guards access the current actor (injected via container, passed explicitly, or fetched from `Auth`)

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Clear, testable transition preconditions | More code per state machine | Abstract into guard library |
| Fail-fast with specific error messages | Guard logic scattered if not organized | Centralize in Guard classes or traits |
| Enables UI hinting (disable buttons, show reasons) | Dual implementation: check + execution | Use `canTransition` for UI, `transition` for execution |
| Composability — mix and match guards | Complex guard ordering dependencies | Keep guards independent and order-agnostic |

## Performance Considerations
- Guards are executed on every `transitionTo()` call; keep them lightweight (avoid DB queries where possible).
- Cache authorization results within a request if multiple guards check the same permission.
- Eager-load data needed by guards before the transition to avoid N+1 inside guard checks.
- For batch transitions, consider precomputing guard results across all items to avoid repeated queries.

## Production Considerations
- Log every guard failure as a warning with context (actor, model, attempted transition, reason).
- Monitor high-frequency guard failure rates — may indicate UI confusion or automated abuse.
- Write explicit tests for each guard: both passing and failing scenarios.
- Guard failures should emit user-friendly messages for HTTP responses and actionable messages for logs.
- Consider rate-limiting transition attempts if guard failures indicate brute-force patterns.

## Common Mistakes
- Checking the same guard at multiple layers (controller, model, database) without consolidating
- Mixing guards with transition side effects (a guard should never modify state)
- Writing guards that silently pass when data is missing (failing to check nulls or defaults)
- Using guards for simple transition map checks that the state machine already handles
- Putting heavy computation or external API calls inside guards

## Failure Modes
- **Stale Guard Data:** A guard checks a condition based on stale in-memory data. Refresh the model before guard evaluation.
- **Guard Race Condition:** Two concurrent requests pass the guard, but the first response invalidates the second's guard. Use optimistic locking.
- **Missing Guard:** A critical precondition isn't guarded, allowing an invalid transition. Review guard coverage with state graph tests.
- **Overly Permissive Guard:** A guard that always returns true provides false security. Test guards for both pass and fail cases.

## Ecosystem Usage
- `spatie/laravel-model-states` supports `canTransition()` and optional Transition classes for guards
- Laravel's `Gate` / `Policy` system commonly used within transition guards for authorization
- `laravel-actions` encourages guard-like validation as a separate step before action execution
- Form request validation acts as an HTTP-level guard before domain transitions

## Related Knowledge Units

### Prerequisites
- state-pattern-fundamentals — understanding states and transition mechanics
- PHP Exception Handling — custom exception classes and try/catch patterns
- Laravel Authorization (Gates/Policies) — permission checks inside guards

### Related Topics
- state-pattern-fundamentals
- spatie-model-states
- custom-state-machine

### Advanced Follow-up Topics
- domain-methods-on-models
- aggregate-boundaries

## Research Notes
- Guard pattern is derived from Design by Contract (Eiffel, Bertrand Meyer)
- In state machine theory, guards are conditions on transitions in UML state diagrams
- Fowler: guards execute before transition actions in *UML Distilled*
- Laravel community guard patterns tend to emerge organically as models grow; formalizing them early prevents scattered conditionals
