# Factory Sequences

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Factories & Seeders |
| Knowledge Unit | Factory Sequences |
| Classification | Intermediate |
| Last Updated | 2026-06-02 |

## Overview

Factory sequences cycle through predefined attribute values across multiple generated models. `Sequence` produces ordered, repeating values; `CrossJoinSequence` produces the Cartesian product of multiple arrays. Sequences enable deterministic, predictable datasets for testing scenarios requiring known distributions.

## Core Concepts

- **Sequence**: Accepts an array of values, returns them in order across successive `make()`/`create()` calls, wrapping around when exhausted
- **CrossJoinSequence**: Generates all combinations (Cartesian product) of multiple arrays
- **Index awareness**: Sequence callables receive the current index (`$index`) for position-dependent logic
- **Sequence lifecycle**: Each factory instance maintains its own sequence pointer

## When To Use

- You need a known distribution of values (3 admins, 2 editors, 1 viewer)
- You want deterministic test data that doesn't depend on random values
- You need exhaustive testing of all value combinations

## When NOT To Use

- The variation is random and realism matters (use Faker)
- The sequence is single-use — just pass a static array

## Best Practices

- **Use sequences for deterministic tests**: When a test must produce the same data on every run regardless of Faker seed, use sequences instead of random values.
- **Use `CrossJoinSequence` for combinatorial coverage**: When testing every combination of states (e.g., all status × all payment methods), `CrossJoinSequence` generates the full matrix automatically.

## Architecture Guidelines

- Define sequences inline in the factory call: `->sequence(['a'], ['b'], ['c'])`
- For reusable sequences, define them as static methods on the factory
- Sequences are typically used in `definition()` or chained on the builder

## Performance Considerations

- Sequences add negligible overhead — just value lookups
- `CrossJoinSequence` can generate large result sets with many inputs

## Examples

```php
User::factory()
    ->count(6)
    ->sequence(
        ['role' => 'admin'],
        ['role' => 'editor'],
        ['role' => 'viewer'],
    )
    ->create();
// Produces: admin, editor, viewer, admin, editor, viewer
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Factory Definition |
| Closely Related | Factory States |
| Closely Related | Factory Callbacks |

## AI Agent Notes

- Sequences produce deterministic, ordered values
- Use `CrossJoinSequence` for exhaustive combinatorial coverage
- Sequence index is available for position-dependent logic

## Verification

- [ ] Sequence values produce the expected distribution
- [ ] Deterministic sequences are used when test repeatability matters
- [ ] Sequence wraps around correctly when exhausted
