# Factory States

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Factories & Seeders |
| Knowledge Unit | Factory States |
| Classification | Intermediate |
| Last Updated | 2026-06-02 |

## Overview

Factory states define discrete variations of a factory's default attribute set. Using `state()` method calls or dedicated state classes, you override specific attributes for different scenarios (admin user, pending order, cancelled subscription). States compose on the base `definition()` and each other, enabling combinatorial test data with minimal repetition.

## Core Concepts

- **state() method**: Chains onto a factory builder with a closure or array of overrides
- **State closures**: Receive `array $attributes` (current accumulated attributes) and optionally the model instance
- **Dedicated state classes**: Extend `Illuminate\Database\Eloquent\Factories\State` for complex states
- **Trashed state**: Built-in `trashed()` for soft-deletable models — sets `deleted_at`
- **State composition**: Multiple states chain; later states override earlier ones

## When To Use

- A model has distinct variations (admin vs regular user, paid vs pending invoice)
- You need to reuse attribute overrides across multiple tests
- You want to express test intent with named methods: `->admin()->create()`

## When NOT To Use

- The override is test-specific and used once (pass attributes directly)
- The variation requires fundamentally different relationships (use a separate factory or callback)

## Best Practices

- **Name states after domain conditions, not attributes**: `->admin()` not `->isAdmin(true)`. The state method expresses the business scenario, not the implementation detail.
- **Create convenience methods for common states**: Define `admin()`, `verified()`, `unverified()` on the factory. These encapsulate the attribute changes and document available variations.
- **States compose in order**: Later states override earlier ones for the same key. Document which states conflict.

## Architecture Guidelines

- States defined as factory methods: `public function admin(): static`
- Complex states use dedicated state classes in `database/factories/States/`
- States always return `$this` for method chaining

## Examples

```php
class UserFactory extends Factory
{
    public function admin(): static
    {
        return $this->state(['is_admin' => true]);
    }

    public function verified(): static
    {
        return $this->state(['email_verified_at' => now()]);
    }
}

// Usage
User::factory()->admin()->verified()->create();
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Factory Definition |
| Closely Related | Factory Sequences |
| Closely Related | Factory Callbacks |
| Closely Related | Factory Testing |

## AI Agent Notes

- Name states after domain conditions, not implementation
- States return `$this` for chaining
- Composition: later states override earlier ones

## Verification

- [ ] State methods have domain-meaningful names
- [ ] States return `$this` for chaining
- [ ] State composition is documented (which conflict)
