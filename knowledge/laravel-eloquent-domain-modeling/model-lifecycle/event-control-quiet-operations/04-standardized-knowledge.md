# Event Control — Quiet Operations

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Model Lifecycle |
| Knowledge Unit | Event Control — Quiet Operations |
| Classification | Intermediate |
| Last Updated | 2026-06-02 |

## Overview

Quiet operations allow model persistence to execute without dispatching lifecycle events. Methods like `saveQuietly()`, `deleteQuietly()`, `forceDeleteQuietly()`, `restoreQuietly()`, and the `withoutEvents()` scoper provide control over when events fire. Essential for preventing infinite loops, avoiding side effects in batch operations, and controlling observers in test setup.

## Core Concepts

- **saveQuietly()**: Persists without firing any model events
- **deleteQuietly()**: Deletes/soft-deletes without delete or trash events
- **forceDeleteQuietly()**: Force deletes without forceDelete events
- **restoreQuietly()**: Restores without restore events
- **withoutEvents(callable)**: Executes callable with all model events suppressed
- **Model::withoutEvents()**: Static variant for scoped suppression

## When To Use

- Bulk operations where event listeners would add significant overhead
- Preventing infinite event loops (an event listener that saves a model)
- Test setup where event side effects are not desired
- Data migration scripts

## When NOT To Use

- Default save/delete operations (use quiet only when necessary)
- Hiding event side effects that should always run (prefer explicit events)

## Best Practices

- **Use `withoutEvents()` for scoped suppression**: Instead of calling `saveQuietly()` everywhere, wrap a block of code in `Model::withoutEvents(fn () => { ... })` for clearer intent.
- **Document quiet usage**: Quiet operations bypass observers that may contain critical logic. Document why events are suppressed to prevent confusion.
- **Suppress in test setup, not in test assertions**: Use quiet operations to seed test data without triggering side effects. Test assertions should verify that events fire correctly.

## Architecture Guidelines

- Use quiet operations for data migrations and seeding
- Use quiet operations to break infinite event loops
- `withoutEvents()` is nestable — inner calls restore outer suppression state

## Examples

```php
// Prevent infinite loop: observer saves model → triggers observer again
class AuditObserver
{
    public function saved(Model $model): void
    {
        AuditLog::withoutEvents(fn () =>
            AuditLog::create(['action' => 'saved', 'model' => get_class($model)])
        );
    }
}

// Bulk import without event overhead
Model::withoutEvents(fn () =>
    User::factory()->count(1000)->create()
);
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Event Catalog |
| Prerequisite | Event Propagation |
| Closely Related | Observer Pattern |
| Closely Related | Factory Callbacks |

## AI Agent Notes

- `withoutEvents()` scoped suppression is safer than individual quiet methods
- Document why events are suppressed
- Use in migrations and test setup to avoid side effects

## Verification

- [ ] Quiet operations are justified (documented reason)
- [ ] `withoutEvents()` used for scoped suppression where possible
- [ ] Infinite event loops are prevented with quiet operations
