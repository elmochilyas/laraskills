# Factory Callbacks

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Factories & Seeders
- **Last Updated:** 2026-06-02

## Executive Summary
Factory callbacks (`afterMaking`, `afterCreating`) let you execute logic immediately after a model is instantiated or persisted. They are defined in the factory's `configure()` method and are the primary mechanism for setting up related data, calling additional methods on the model, or performing post-creation tasks that cannot be expressed in the static `definition()` array.

## Core Concepts
- **afterMaking:** Called after `make()` instantiates the model but before it is returned. Model is not persisted.
- **afterCreating:** Called after `create()` persists the model. The model has an ID and can use relationships.
- **configure() method:** Override in the factory class to register callbacks using `$this->afterMaking()` and `$this->afterCreating()`. Called once when the factory instance is first built.
- **Closure signature:** Callbacks receive the model instance and the current `$faker` instance as parameters.
- **Multiple callbacks:** Multiple `afterMaking`/`afterCreating` callbacks can be registered. They execute in registration order.

## Mental Models
- **Assembly line with inspection points:** The factory pipeline is an assembly line. `definition()` builds the raw parts, `afterMaking` inspects the assembled model, `afterCreating` runs it through a functional test, `create()` ships it to the database.
- **Side-effect zone:** Callbacks are the place for side effects â€” attaching relationships, queuing events, calling model methods. Keep `definition()` pure (attribute mapping) and callbacks impure (side effects).
- **Lifecycle hook analogy:** Think of `afterMaking` as a constructor event and `afterCreating` as a post-persist event â€” similar to Eloquent model events but scoped to factory creation.

## Internal Mechanics

> **Reference:** 
- `configure()` is called by the factory builder's `make()` if not already invoked. It registers callbacks via `$this->afterMaking[]` and `$this->afterCreating[]` arrays.
- In `make()`, after states and sequences are resolved and attributes are merged, `callAfterMaking()` iterates the `$afterMaking` callbacks and invokes each with the model and faker.
- In `create()`, after `save()` succeeds, `callAfterCreating()` invokes registered callbacks.
- Callbacks receive the concrete model instance (`$model`) and the Faker generator (`$faker`). The model is fully hydrated before callbacks run.

## Patterns
### Attach Related Models After Create
```php
class UserFactory extends Factory
{
    public function configure(): void
    {
        $this->afterCreating(function (User $user) {
            $user->profile()->create(Profile::factory()->raw());
        });
    }
}
```

### Call Model Methods After Making
```php
$this->afterMaking(function (User $user) {
    $user->setRememberToken(Str::random(60));
});
```

### Conditional Callbacks
```php
$this->afterCreating(function (User $user) {
    if ($user->role === 'admin') {
        $user->assignRole('super-admin');
    }
});
```

### Notification or Event Side Effects
```php
$this->afterCreating(function (User $user) {
    Notification::fake(); // Don't send real notifications in factories
    // Instead, assert notifications were sent in tests
});
```

### Stacking Multiple Callbacks
```php
$this->afterCreating(function (User $user) {
    $user->markEmailAsVerified();
});
$this->afterCreating(function (User $user) {
    Log::info('Factory created user: ' . $user->id);
});
```

## Architectural Decisions
### Decision: Callbacks vs. States for Side Effects
- **Callbacks:** Execute code after model creation. Support any PHP logic â€” relationship creation, event dispatching, service calls. Not limited to attribute overrides.
- **States:** Limited to attribute overrides. Pure data transformations, no side effects.
- **Tradeoff:** States are simpler and composable. Callbacks handle everything states cannot.

### Decision: Callbacks vs. Model Events for Post-Creation Logic
- **Callbacks:** Factory-scoped. Only run during factory usage. Test data setup does not leak into production model behaviour.
- **Model Events:** Run on every create/update, including in production. Can be used but require careful guarding.
- **Tradeoff:** Callbacks keep factory concerns in factories. Model events pollute production code with test concerns.

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Enables complex relationship setups | Callbacks can hide expensive operations | Keep callbacks fast; defer heavy work to test setUp |
| Scoped to factory â€” no production leakage | Sequential test failures if callbacks fail mid-batch | Wrap callback bodies in try-catch for resilience |
| Multiple callbacks compose naturally | Execution order affects outcomes | Keep callbacks independent; test in isolation |
| Access to full model instance and faker | Easy to create deep object graphs unintentionally | Be explicit about depth; use `recycle()` for shared models |

## Performance Considerations
- `afterCreating` callbacks run synchronously per model. For batches of 1,000+ models, each callback adds linear overhead.
- Database writes inside callbacks (e.g., creating related models) multiply the total query count. Each `afterCreating` that persists data adds 1+ queries per parent model.
- Use `raw()` inside callbacks and defer persistence to `create()` if the related model is the primary concern. Avoid nested `create()` calls in callbacks for large batches.

## Production Considerations
- Never put production-logic side effects in factory callbacks. Factories should never trigger real email dispatches, payment processing, or external API calls.
- Use `Notification::fake()`, `Event::fake()`, `Queue::fake()` inside tests that use factories with callbacks to prevent side effects.
- If a callback must be disabled for a specific test, wrap it in a condition check or use a dedicated factory class without the callback.

## Common Mistakes
**Mistake: Using `afterMaking` for persistence.**
Why it happens: Confusing `afterMaking` with `afterCreating`.
Why it's harmful: The model isn't persisted yet, so relationship `create()` calls fail or create orphaned data.
Better approach: Use `afterCreating` for any logic that requires the model to have an ID or be in the database.

**Mistake: Creating circular callback dependencies.**
Why it happens: Factory A's callback creates model B, and Factory B's callback creates model A.
Why it's harmful: Infinite recursion or stack overflow.
Better approach: Use `recycle()` or explicit factory setup in tests to break the cycle.

**Mistake: Relying on callback ordering implicitly.**
Why it happens: Callback B assumes data set up by Callback A.
Why it's harmful: Reordering callback registration breaks the test suite.
Better approach: Make callbacks independent, or document ordering requirements explicitly.

## Failure Modes
1. **Stack overflow on circular callbacks:** Factory A creates B which creates A which creates B... Mitigation: detect cycles with depth limits or use `recycle()`.
2. **Orphaned related data:** Callbacks create related models but the parent create fails (transaction rollback). Mitigation: ensure factory callbacks respect transactions.
3. **Callback exception halts batch:** An exception in one model's callback stops the entire batch. Mitigation: wrap non-critical callbacks in try-catch.

## Ecosystem Usage
- **Laravel Jetstream:** Uses `afterCreating` in `TeamFactory` to attach the creator as a team member.
- **Spatie Media Library:** Factory callbacks attach media files to models after creation.
- **Laravel Nova:** Factory callbacks set up resource fields and permissions for test scenarios.

## Related Knowledge Units


### Prerequisites
- Model Design
- Model Lifecycle
- Factory Definition
- Factory States

### Related Topics
- Factory Sequences
- Eloquent Model Events

### Advanced Follow-up Topics
- Custom Factory Builders
- Test Fixture Patterns


## Research Notes
- **Source Analysis:** `Factory::configure()` is called lazily. `afterMaking` callbacks are invoked after state/sequence merging but before `newModelInstance()`. `afterCreating` callbacks execute after `save()` in `create()`.
- **Key Insight:** Callbacks bridge the gap between declarative attribute definitions and imperative side effects. They are the escape hatch for factory logic that doesn't fit the array-override model.
- **Version-Specific Notes:** Laravel 8 introduced `configure()` and callback registration. Laravel 9+ passes `$faker` as a second parameter to callbacks. Laravel 10+ allows callbacks to return early (skip further callbacks) by returning `false`.
