# Active Record as Domain Layer

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Domain Modeling Patterns |
| Knowledge Unit | Active Record as Domain Layer |
| Classification | Advanced |
| Last Updated | 2026-06-02 |

## Overview

The Active Record pattern, embodied by Eloquent, binds data access logic directly into domain entities. In domain modeling, embracing Active Record means treating Eloquent models as the domain layer itself rather than persistence-only objects. This KU examines using Eloquent models as both persistence wrappers and domain entities, carrying behavioral responsibilities alongside data access.

## Core Concepts

- **Active Record**: Each model instance wraps a database row and exposes both persistence methods (`save()`, `delete()`) and domain behavior
- **Domain Entity**: An object defined by identity and continuity across state changes — in Active Record, Eloquent models serve as these entities
- **Rich Domain Model**: Models encapsulating both state and behavior, enforcing invariants through method APIs
- **Anemic Domain Model**: Models reduced to public getters/setters with business logic in controllers or services

## When To Use

- The application is built with Laravel conventions (Eloquent as the primary data access layer)
- The domain logic maps naturally to individual model boundaries
- You want low ceremony — no separate domain model layer
- The team is productive with Active Record conventions

## When NOT To Use

- The domain is complex with business rules that cross multiple aggregate boundaries
- You need persistence-ignorant domain models for framework independence
- The application requires event sourcing or complex persistence strategies
- You want to enforce strict separation between domain and infrastructure

## Best Practices

- **Embrace model methods for domain behavior**: Instead of `$order->update(['status' => 'paid'])`, write `$order->markAsPaid()`. Named methods capture domain intent and provide a single point for invariant enforcement.
- **Keep persistence concerns thin**: The model's persistence methods (`save()`, `delete()`) are inherited from the base Model class. Domain methods use these internally but should not expose raw persistence to callers.
- **Use `shouldBeStrict()`**: Enable `Model::shouldBeStrict()` in non-production to catch lazy loading and missing attributes early. This prevents the "Active Record is slow" anti-pattern by making N+1 visible.

## Architecture Guidelines

- Models in `App\Models\*` serve as both entities and persistence objects
- Domain methods use `$this->attribute` and `$this->save()` internally
- Cross-aggregate logic is extracted to actions
- Use traits for cross-cutting concerns (SoftDeletes, HasRoles)

## Performance Considerations

- Active Record loads all columns on every query — use `select()` and `$visible` for column control
- Lazy loading is the primary performance trap — enable `preventLazyLoading()`
- Model hydration overhead is negligible for typical page loads

## Security Considerations

- Mass assignment protection (`$fillable`/`$guarded`) prevents unintended attribute writes
- Domain methods should validate state before mutation
- Sensitive attributes should be `$hidden` from serialization

## Examples

```php
class Order extends Model
{
    public function markAsPaid(): void
    {
        $this->status = 'paid';
        $this->paid_at = now();
        $this->save();
    }

    public function isOverdue(): bool
    {
        return $this->status === 'sent' && $this->due_at->isPast();
    }
}
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Model Design |
| Closely Related | Domain Methods on Models |
| Closely Related | Aggregate Boundaries |
| Advanced | Eloquent as Adapter |
| Cross-Domain | Architectural Decisions |

## AI Agent Notes

- Active Record models serve as both domain entities and persistence objects
- Write expressive model methods instead of inline attribute updates
- Enable `preventLazyLoading()` to catch N+1 queries early

## Verification

- [ ] Model methods capture domain intent with expressive names
- [ ] Model methods use `$this->attribute` and `$this->save()` internally
- [ ] `preventLazyLoading()` or `shouldBeStrict()` is enabled in non-production
- [ ] Models are not anemic — they contain domain behavior
