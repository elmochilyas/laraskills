# Factory States

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Factories & Seeders
- **Last Updated:** 2026-06-02

## Executive Summary
Factory states allow you to define discrete variations of a factory's default attribute set. Using `state()` method calls or dedicated state classes, you can override specific attributes for different scenarios (e.g., an "admin" user, a "pending" order, a "cancelled" subscription). States compose on top of the base `definition()` and each other, enabling combinatorial test data generation with minimal repetition.

## Core Concepts
- **state() method:** Chains onto a factory builder. Accepts a closure (receives attributes array + model instance) or an array of overrides.
  ```php
  User::factory()->state(['is_admin' => true])->create();
  ```
- **State as closures:** The closure receives `array $attributes` (current accumulated attributes) and optionally the model instance for `afterCreating` context.
- **Dedicated state classes:** For complex states, create a class extending `Illuminate\Database\Eloquent\Factories\State`. Define an `__invoke()` method returning the override array.
- **Trashed state:** Built-in `trashed()` method on factories for soft-deletable models. Sets `deleted_at` to now.
- **State composition:** Multiple states can be chained. Later states override earlier ones for the same keys. States stack hierarchically.

## Mental Models
- **State as a diff layer:** Think of states as transparent overlays on the base definition. The base `definition()` is the bottom layer; each state adds or overrides attributes above it. The final model is the composition of all layers.
- **Named scenarios:** States are named scenarios â€” "admin user," "verified email," "expired subscription." Name them after the domain condition they represent, not after their attribute values.
- **Boolean flags vs. states:** A single boolean attribute (`is_admin`) can be a state. Use states to express intent: `->state(['is_admin' => true])` becomes `->admin()` via a dedicated state method.

## Internal Mechanics

> **Reference:** 
- `state()` stores the callable or array in `$states` array on the factory instance.
- When `make()` is called, states are resolved in order: `definition()` is called first, then each state closure receives the accumulated attributes and returns new overrides which are merged via `array_merge`.
- `Illuminate\Database\Eloquent\Factories\State` classes are resolved via the container. The `__invoke` method receives the same signature as a closure state.
- `trashed()` adds `[$this, 'trashed']` to states â€” an internal method that sets `deleted_at = now()` on the model.

## Patterns
### Simple Attribute Override
```php
return User::factory()->state(['is_admin' => true])->create();
```

### Named State Method on Factory
```php
class UserFactory extends Factory
{
    public function admin(): static
    {
        return $this->state(fn (array $attrs) => ['is_admin' => true]);
    }

    public function unverified(): static
    {
        return $this->state(fn (array $attrs) => ['email_verified_at' => null]);
    }
}
```

### State Class for Reusable Complex Logic
```php
class VerifiedState extends State
{
    public function __invoke(array $attributes): array
    {
        return [
            'email_verified_at' => now(),
            'verification_token' => null,
        ];
    }
}

User::factory()->state(new VerifiedState())->create();
```

### Composing Multiple States
```php
User::factory()->admin()->unverified()->create();
// Combines: is_admin=true + email_verified_at=null
```

### Trashed State
```php
User::factory()->trashed()->create();
// Sets deleted_at to current timestamp
```

## Architectural Decisions
### Decision: Dedicated State Methods vs. Inline `state()` Calls
- **Dedicated methods:** Encapsulate domain-specific variations. More readable at call sites: `->admin()` vs `->state(['is_admin' => true])`. Recommended for states used in multiple tests.
- **Inline calls:** Quick, no extra boilerplate. Suitable for one-off overrides in a single test.
- **Tradeoff:** Methods add factory surface area; inline calls are less discoverable.

### Decision: State Classes vs. State Methods
- **Classes:** Reusable across factories, testable in isolation, can have dependencies injected. Useful when state logic is complex (multi-attribute, database lookups).
- **Methods:** Keep state logic close to the definition. Simpler, no additional files. Prefer for straightforward attribute overrides.

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Named states are self-documenting scenarios | State proliferation bloats factory classes | Limit to domain-relevant states; use inline overrides for one-offs |
| States compose combinatorially | Implicit state ordering can cause unexpected overrides | Document ordering dependencies; test composed states |
| Dedicated state classes are testable in isolation | Extra files and indirection for simple overrides | Use classes only when logic is non-trivial |
| Trashed state is built-in and zero-config | Only covers soft-delete; no other lifecycle states built in | Implement `archived()`, `suspended()` manually if needed |

## Performance Considerations
- State closures are resolved at `make()` time. For 10,000 models, each state closure is called 10,000 times. Keep closures lightweight.
- State classes are resolved once via the container, then invoked per model. Overhead is negligible unless the state does heavy computation.
- Composing many states increases the number of array merges per model. Measure if you chain >5 states on large batches.

## Production Considerations
- States should not contain environment-specific logic. Use environment-aware seeding for that concern.
- Test composed state combinations that reflect real-world data scenarios (e.g., `admin()->unverified()` â€” an admin with unverified email).
- Avoid states that depend on external state (database reads, API calls) â€” they make tests non-deterministic.

## Common Mistakes
**Mistake: Defining states that conflict with each other silently.**
Why it happens: Two states override the same attribute; the last one wins.
Why it's harmful: Composed states produce unexpected results.
Better approach: Document attribute conflicts; test composed states explicitly.

**Mistake: Using `state()` after a terminal method like `create()`.**
Why it happens: `$model = User::factory()->create()->state(...)` treats the returned model as a factory.
Why it's harmful: `state()` is not available on models.
Better approach: Chain `state()` before `create()` or `make()`.

**Mistake: Forgetting that states merge, not replace.**
Why it happens: Assuming a state resets all attributes.
Why it's harmful: Base `definition()` attributes leak through unintentionally.
Better approach: Return explicit overrides; set unwanted attributes to `null` or remove them from the array.

## Failure Modes
1. **State mutation across models:** If a state closure captures an external variable by reference, all models share the same value. Mitigation: use `function () use (&$counter)` carefully or avoid mutable captures.
2. **State class resolution failure:** If the state class has constructor dependencies not bound in the container, resolution throws. Mitigation: keep state classes simple or bind them in a service provider.
3. **Trashed state on non-soft-delete models:** Calling `trashed()` on a factory for a model without `SoftDeletes` silently adds `deleted_at` to the attributes array, but the model won't behave as trashed. Mitigation: only use `trashed()` on models with `SoftDeletes`.

## Ecosystem Usage
- **Laravel Jetstream:** Uses `->withPersonalTeam()` as a named state on `UserFactory`.
- **Laravel Cashier:** Stripe subscription factories define states for `trialing()`, `pastDue()`, `canceled()`, `onGracePeriod()`.
- **Laravel Nova:** Resource factories use `->withFields()`, `->locked()` states for testing permission scenarios.

## Related Knowledge Units


### Prerequisites
- Model Design
- Model Lifecycle
- Factory Definition
- Model Events

### Related Topics
- Factory Sequences
- Factory Callbacks
- Soft Deletes

### Advanced Follow-up Topics
- State Composition Patterns
- Test Scenario Factories


## Research Notes
- **Source Analysis:** `Illuminate\Database\Eloquent\Factories\Factory::state()` â€” stores callable in `$states[]`. `make()` iterates `$states`, calling each with accumulated attributes and merging results.
- **Key Insight:** States use array merge, not array replace. Nested keys are not deep-merged â€” only top-level keys are overridden. This is intentional for flat attribute structures.
- **Version-Specific Notes:** Laravel 8 introduced class-based factories and state methods. Laravel 10+ allows `state()` to accept an array directly (previously only closures). The `trashed()` helper was added in Laravel 9.x.
