# Spatie Model States

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Domain Modeling Patterns
- **Last Updated:** 2026-06-02

## Executive Summary
`spatie/laravel-model-states` is the dominant Laravel package for implementing state machines on Eloquent models. It formalizes states as dedicated PHP classes, auto-discovers allowed transitions, and provides a fluent API for transitioning and querying state. This KU covers installation, configuration, advanced usage, and integration patterns for the package.

## Core Concepts
- **State Class:** A PHP class extending `Spatie\ModelStates\State` representing one state in the machine.
- **Transition Class:** An optional class extending `Spatie\ModelStates\Transition` defining logic that runs during a transition.
- **State Field:** An Eloquent cast on the model that serializes/deserializes state objects to/from the database.
- **Default State:** The state a model assumes when first created (set via `$this->state->initial()` or attribute default).
- **Allowed Transitions:** Defined in the state class by overriding `transitionableStates()` or `publicTransitions()`.

## Mental Models
- **"States as Classes, Transitions as Methods":** Each state is a class. Moving between them is a method call: `$model->state->transitionTo(Shipped::class)`.
- **"Declarative Transition Map":** States declare which other states they can transition to, creating an explicit graph.
- **"Guard at the State Level":** The state class decides who can enter it; the transition class controls what happens during the move.

## Internal Mechanics
The package uses Eloquent's custom cast system:
- `StateCast` implements `CastsAttributes` to convert between database strings and state objects
- State instances receive a reference to the model and the field name
- `transitionTo()` follows a pipeline: validate allowed transitions -> execute transition class (if provided) -> update the database column -> fire model events
- Transition classes are resolved through the Laravel container, enabling dependency injection
- `hasState()` and `state()` methods on the model expose state querying

State classes register allowed transitions via:
```php
protected function transitionableStates(): array
{
    return [Pending::class, Approved::class];
}
```

## Patterns
- **Transition Classes for Side Effects:** Extract complex transition logic into dedicated `Transition` classes (e.g., `PendingToApproved` that sends a notification).
- **State Querying Scopes:** Use `$model->state->equals(Pending::class)` or `$model->state->isNot(...)` in queries.
- **State-Specific Validation:** Override `canTransitionTo()` in state classes for business rule guards.
- **Default State on Creation:** Override `initialState()` or set column default in migration.
- **State History Logging:** Use model events (e.g., `updated` / `saved`) or a dedicated observer to log transitions.

## Architectural Decisions
- Whether to use transition classes or rely on model events for side effects
- How to handle states with lifecycle methods (onEntry/onExit vs event listeners)
- Whether to use the package's built-in `Transition` class or plain `transitionTo()` calls
- How to integrate with authorization (add policy checks in transitions or controllers)

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Declarative, explicit state graph | Adds package dependency | Well-maintained by Spatie; low risk |
| Auto-discovers transitions from state classes | Learning curve for the class-per-state approach | Worthwhile for 3+ states |
| Transition classes support DI | More files per domain feature | Organize under Model/States/ directory |
| Works with existing Eloquent casts | Custom cast binding can conflict with other casts | Avoid multiple state fields per model |

## Performance Considerations
- State class instantiation is negligible; instances are created per model hydration.
- Transition classes are resolved once per transition; dependency injection overhead is minimal.
- Avoid heavy database queries inside state `canTransitionTo()` methods; they're called on every check.
- For bulk operations, loop `transitionTo()` carefully; each call updates the database.

## Production Considerations
- Monitor for illegal transition attempts (caught exceptions) as operational signals.
- Write dedicated tests for each transition path (happy path, guard failures, invalid transitions).
- Use `transitionTo()` in jobs with retry logic for eventually-consistent workflows.
- Consider admin fallback transitions for manual intervention when states are stuck.

## Common Mistakes
- Forgetting to register all allowed transitions, causing cryptic `InvalidTransition` exceptions
- Using transition classes for everything when a simple `transitionTo()` suffices
- Putting heavy business logic in transition classes that belongs in domain services
- Not defining an `initialState()` for new models, causing null state errors
- Calling `$model->update()` in transition classes and triggering recursive model events

## Failure Modes
- **Stale State Reads:** A model's in-memory state differs from the database if not refreshed after a transition. Call `$model->refresh()` when needed.
- **Bidirectional Transition Confusion:** State A allows transition to B, but B does not allow transition to A. Verify full graph symmetry where required.
- **Missing Transition Class Registration:** If a transition class has dependencies not resolvable via the container, transitions fail silently.
- **State Cast Collision:** Two state fields on the same model require careful configuration.

## Ecosystem Usage
- Widely adopted in Spatie ecosystem; used in their own packages (e.g., `laravel-medical`)
- Recommended in Laravel community for order management, subscription lifecycles, approval workflows
- Compatible with `laravel-nova` for admin state management
- Used alongside `spatie/laravel-event-sourcing` for event-sourced aggregates

## Related Knowledge Units

### Prerequisites
- state-pattern-fundamentals — the theoretical foundation for state machines
- Composer Package Installation — adding and configuring Laravel packages
- casts-attributes-interface — how custom Eloquent casting works

### Related Topics
- state-pattern-fundamentals
- transition-guards
- domain-methods-on-models

### Advanced Follow-up Topics
- custom-state-machine
- aggregate-boundaries

## Research Notes
- Package docs: https://spatie.be/docs/laravel-model-states
- Spatie uses this package internally for subscription/product lifecycle management
- Community feedback: excellent DX for standard workflows; may need custom solutions for complex branching
- Alternative: `artemis-psekas/laravel-fsm` (less adopted)
