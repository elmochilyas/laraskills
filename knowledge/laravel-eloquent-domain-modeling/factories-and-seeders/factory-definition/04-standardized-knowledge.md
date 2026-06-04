# Factory Definition

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Factories & Seeders |
| Knowledge Unit | Factory Definition |
| Classification | Foundation |
| Last Updated | 2026-06-02 |

## Overview

Model factories generate fake model instances for testing and seeding. Each factory class defines a `definition()` method returning attribute arrays, then exposes `make()`, `create()`, and `raw()` builders. The `HasFactory` trait links the model to its factory. Factories are the foundational building block for all test data generation in Laravel.

## Core Concepts

- **Factory class convention**: `database/factories/{Model}Factory.php` — factory name resolves to model class by convention
- **HasFactory trait**: Added to models to expose `Model::factory()`
- **definition() method**: Returns an array mapping column names to fake values
- **make vs create vs raw**: `make()` = in-memory (no DB write), `create()` = persisted, `raw()` = attribute array only
- **Model resolution**: `$model` property overrides the default model class resolution

## When To Use

- Generating test data for feature/unit tests
- Seeding development databases with realistic sample data
- Creating model instances with consistent default attributes

## When NOT To Use

- The data is reference/static data that should always exist (use explicit `create()` in seeders)
- Performance-critical bulk inserts with no need for model events (use `DB::table()->insert()`)
- The model has no relationships and minimal attributes (manual creation may be clearer)

## Best Practices

- **Keep definition() pure**: `definition()` should return a static attribute array. Side effects (relationship creation, event dispatching) belong in `afterCreating` callbacks.
- **Use Faker for realistic data**: `fake()->name()`, `fake()->email()` produce realistic test data that surfaces UI/validation issues that static data would miss.
- **Set sensible defaults**: Default factory values should produce a valid, "happy path" model. States handle variations. Tests should not need to override every attribute.

## Architecture Guidelines

- Factory at `database/factories/{Model}Factory.php`
- Model has `use HasFactory` trait
- `definition()` returns array with `fake()` and `fake()->unique()` for unique constraints

## Performance Considerations

- `create()` triggers model events — use `make()` when persistence isn't needed
- Bulk creation with `->count(100)->create()` is efficient (single transaction)
- For thousands of records, consider `raw()` + `DB::table()->insert()` to skip hydration

## Examples

```php
class UserFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'password' => bcrypt('password'),
        ];
    }
}
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Model Design |
| Closely Related | Factory States |
| Closely Related | Factory Relationships |
| Closely Related | Seeder Classes |

## AI Agent Notes

- `definition()` returns a plain array, no side effects
- Use `fake()` for realistic test data
- `make()` for in-memory, `create()` for persisted

## Verification

- [ ] Factory has `definition()` method returning array
- [ ] Model uses `HasFactory` trait
- [ ] Sensible default values produce a valid model
- [ ] Faker provides realistic default values
