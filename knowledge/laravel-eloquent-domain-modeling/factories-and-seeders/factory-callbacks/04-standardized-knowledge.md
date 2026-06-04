# Factory Callbacks

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Factories & Seeders |
| Knowledge Unit | Factory Callbacks |
| Classification | Intermediate |
| Last Updated | 2026-06-02 |

## Overview

Factory callbacks (`afterMaking`, `afterCreating`) execute logic after model instantiation or persistence. Defined in the factory's `configure()` method, they handle relationship setup, invoking model methods, and post-creation tasks that can't be expressed in the static `definition()` array.

## Core Concepts

- **afterMaking**: Called after `make()` instantiates the model but before returning it. Model is not persisted.
- **afterCreating**: Called after `create()` persists the model. Model has an ID and can use relationships.
- **configure() method**: Override in the factory to register callbacks
- **Closure signature**: Callbacks receive the model instance and `$faker`
- **Multiple callbacks**: Registered in order; execute sequentially

## When To Use

- Setting up related data after the primary model is created
- Calling domain methods on the model after creation
- Performing actions that require the model to have an ID

## When NOT To Use

- The logic is a simple attribute override (use `state()`)
- The logic doesn't depend on the model being persisted (use `afterMaking`)
- The relationship can be handled by `has()`/`for()`/`hasAttached()`

## Best Practices

- **Keep `definition()` pure; put side effects in callbacks**: `definition()` maps attributes; callbacks handle relationship creation, event dispatching, and model method calls. This separation makes the factory easier to understand and test.
- **Use `afterCreating` for relationships that need the parent ID**: Child models that reference the parent's foreign key must be created in `afterCreating` because the parent doesn't have an ID yet during `definition()`.
- **Avoid expensive operations in callbacks**: Callbacks run for every created model. Expensive operations (API calls, bulk inserts) should be extracted to the test or seeder.

## Architecture Guidelines

- Callbacks registered in `configure()` using `$this->afterMaking()` and `$this->afterCreating()`
- Callbacks are the correct place for `has()`/`for()` relationship chains that depend on the parent model
- Use `afterCreating` for attaching many-to-many relationships with pivot data

## Examples

```php
class PostFactory extends Factory
{
    public function configure(): static
    {
        return $this->afterCreating(function (Post $post) {
            $post->addMedia($this->fake()->image())->toMediaCollection('featured');
        });
    }
}
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Factory Definition |
| Closely Related | Factory States |
| Closely Related | Factory Relationships |

## AI Agent Notes

- Side effects go in callbacks, not `definition()`
- `afterCreating` for persistence-dependent logic
- `afterMaking` for non-persistent setup

## Verification

- [ ] Callbacks are registered in `configure()`
- [ ] `definition()` has no side effects
- [ ] `afterCreating` used for persistence-dependent logic
- [ ] Expensive operations are not in callbacks
