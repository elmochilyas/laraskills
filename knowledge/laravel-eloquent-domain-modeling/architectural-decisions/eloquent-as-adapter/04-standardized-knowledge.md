# Eloquent as Adapter

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Architectural Decisions |
| Knowledge Unit | Eloquent as Adapter |
| Classification | Advanced |
| Last Updated | 2026-06-02 |

## Overview

Eloquent as Adapter treats Eloquent models as infrastructure-layer persistence adapters rather than domain models. In hexagonal architecture, the domain defines a repository interface (port); an Eloquent-backed class implements it (adapter). This decouples business logic from the ORM, making the domain persistence-ignorant and testable without database infrastructure.

## Core Concepts

- **Eloquent as Infrastructure**: Eloquent models are database access objects, not domain models
- **Domain Model (Plain PHP)**: The real domain model is a plain PHP class with no Active Record coupling
- **Mapping Layer**: The adapter converts between Eloquent records and domain objects
- **Persistence Ignorance**: Domain models have no `save()`, `::find()`, or database dependencies
- **Repository as Adapter**: The repository interface is domain-owned; the Eloquent implementation is infrastructure

## When To Use

- The domain contains complex business rules that would be polluted by Active Record concerns
- You need the domain to be persistence-ignorant and testable without a database
- You anticipate changing storage backends (file-based, event store, NoSQL)
- The domain model and database schema differ significantly

## When NOT To Use

- The domain model and database structure are nearly identical (mapping overhead isn't justified)
- The application is simple CRUD with minimal business rules
- Team size and delivery speed favor convention over architecture

## Best Practices

- **Domain models never extend Eloquent Model**: A plain PHP class with no `save()` or `::find()` methods enforces persistence ignorance at the type level. Static analysis (PHPStan level 8) can enforce this with path rules.
- **Always map at the boundary**: Never return Eloquent models from repository methods. Mapping at the boundary prevents Eloquent's lazy loading and global scopes from leaking into the domain.
- **Eager-load in the repository**: Since domain models can't lazy-load, the repository must eager-load all required relations before mapping to domain objects.
- **Use the same ID reference**: Map back and forth using the same ID to prevent identity drift between the Eloquent record and the domain model.

## Architecture Guidelines

- Define repository interfaces in the Domain layer, owned by the domain
- Implement repositories in the Infrastructure layer, using Eloquent internally
- Domain namespaces must have zero `use Illuminate\*` imports (enforce via PHPStan)
- Repository methods only accept/return domain models or primitives
- Repository should accept `$with` parameters for relation eager-loading

## Performance Considerations

- Mapping between Eloquent and domain models adds CPU overhead (~<1ms per 100 entities)
- Pagination must be handled in the repository layer before mapping
- Cache mapped domain models, not raw Eloquent instances, to avoid serialization issues
- Lazy loading must happen inside the repository before returning domain objects

## Security Considerations

- Domain models use `DateTimeImmutable` not Carbon — prevents time-based mutation
- Domain models use native PHP types and value objects — no Eloquent collections that could expose internal state
- Repository layer is the enforcement point for soft-delete filtering and tenant scoping

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Mixing Eloquent and domain models in the same collection | Convenience | Lazy loading leaks into domain | Always map at repository boundary |
| Domain models with `save()` methods | Incomplete decoupling | Persistence concern leaks into domain | Repository handles all persistence |
| Over-mapping for simple CRUD | Dogmatic architecture | 4-field mapping with zero benefit | Use Eloquent directly for simple models |
| Not using Eloquent features in adapter | "Purity" mindset | Worse performance, more code | Use eager-loading, withCount, chunk in adapter |

## Anti-Patterns

- **Mapping Explosion**: 50+ domain classes each needing a mapping function. Use a consistent mapping pattern (array serialization or a mapper library).
- **Eloquent Feature Lock-In**: Repository uses Eloquent-specific features (global scopes, soft deletes) that make swapping impossible. Keep adapter implementation generic.
- **N+1 Adapter**: Repository returns domain models without related data, causing the caller to loop and re-query. Always eager-load in the repository.
- **Identity Drift**: Domain model ID and Eloquent ID get out of sync. Always map back and forth using the same ID reference.

## Examples

```php
// Domain model — plain PHP, no Eloquent
class Invoice
{
    public function __construct(
        public readonly int $id,
        public InvoiceStatus $status,
        public Money $total,
    ) {}

    public function markAsPaid(): void
    {
        if ($this->status !== InvoiceStatus::Sent) {
            throw new \DomainException('Only sent invoices can be paid.');
        }
        $this->status = InvoiceStatus::Paid;
    }
}
```

```php
// Eloquent adapter — infrastructure layer
class EloquentInvoiceRepository implements InvoiceRepository
{
    public function findById(int $id): ?DomainInvoice
    {
        $eloquent = \App\Models\Invoice::with('lines')->find($id);
        return $eloquent ? $this->toDomain($eloquent) : null;
    }

    private function toDomain(\App\Models\Invoice $eloquent): DomainInvoice
    {
        return new DomainInvoice(
            id: $eloquent->id,
            status: InvoiceStatus::from($eloquent->status),
            total: Money::fromCents($eloquent->total_cents),
        );
    }
}
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Model Design |
| Prerequisite | Domain Modeling Patterns |
| Closely Related | Ports and Adapters |
| Closely Related | When Repositories Help |
| Closely Related | Framework Decoupling |
| Closely Related | Read Model Separation |
| Closely Related | Write Model Separation |

## AI Agent Notes

- Domain models should never `use Illuminate\Database\Eloquent\Model`
- Domain namespaces must have zero `use Illuminate\*` imports
- Repository methods should eager-load all required relations before mapping
- Always map Eloquent → domain at the boundary, never return Eloquent instances

## Verification

- [ ] Domain models are plain PHP classes (don't extend Model)
- [ ] Domain models have no `save()`, `::find()`, or `::query()` methods
- [ ] All Eloquent imports are restricted to the Infrastructure layer
- [ ] Repository methods only return domain models or primitives
- [ ] Static analysis enforces no `Illuminate\*` imports in Domain namespace
- [ ] Domain unit tests run without database (no RefreshDatabase)
