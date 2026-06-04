# When Repositories Help

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Architectural Decisions |
| Knowledge Unit | When Repositories Help |
| Classification | Advanced |
| Last Updated | 2026-06-02 |

## Overview

Repositories abstract data storage behind a collection-like interface. They add value when the application connects to multiple data sources, has complex persistence logic, or needs to swap storage strategies. In Laravel, repositories are a tactical choice — use them when Active Record's direct database coupling becomes a liability, not as a default architectural layer.

## Core Concepts

- **Repository Pattern**: A mediator between domain and data mapping layers, acting as an in-memory collection of domain objects
- **Persistence Ignorance**: Domain code doesn't know about MySQL, Redis, or external APIs — only the repository interface
- **Collection Interface**: Repositories mimic collections with `find`, `findAll`, `store`, `delete` semantics
- **Multiple Backends**: Same interface backed by MySQL, Redis, external API, or in-memory
- **Aggregate Root Persistence**: Repositories typically manage only aggregate roots, not every entity

## When To Use

- You have multiple data sources for the same aggregate
- Storage logic is complex (custom serialization, event stream storage)
- You need to unit-test domain logic without database setup
- You expect to change storage backend
- Persistence strategy doesn't fit Eloquent conventions (e.g., event sourcing)

## When NOT To Use

- Only one data source exists and will ever exist
- The only reason is "testing" — Laravel's SQLite testing already solves this
- The repository interface mirrors Eloquent's API exactly (leaky abstraction)
- The aggregate only needs basic CRUD (save, find, delete)

## Best Practices

- **Design interfaces around domain concepts, not SQL**: A method named `findWhere(array $criteria)` leaks SQL. Name it `findActiveContracts()` — the domain's concept. This keeps the abstraction meaningful.
- **One repository per aggregate root**: Not every entity needs a repository. Aggregate roots are the natural unit for repository abstraction; child entities are accessed through the root.
- **Repositories should not manage transactions**: Transaction boundaries belong to the use-case/action layer. Repositories that wrap `save()` in transactions cause nested transaction bugs when the caller also uses transactions.
- **Accept `$with` for eager loading**: Repository methods should accept an optional `$with` parameter for relations to prevent N+1 queries.

## Architecture Guidelines

- Interface in `App\Contracts\Repositories\*` — domain-owned
- Eloquent implementation in `App\Repositories\*` — infrastructure
- Repository interface contains zero Eloquent-specific types (no `Builder`, no `Model`)
- Every repository method is unit-testable with an in-memory fake
- Repository only created for aggregate roots with actual storage variation needs

## Performance Considerations

- Repository method calls add a single PHP method invocation — negligible
- Repositories should eager-load required relations explicitly to prevent N+1
- Consider a caching decorator wrapping the Eloquent repository without changing its interface
- Pagination parameters should be accepted, not returning all rows

## Security Considerations

- Repository methods should not accept raw user input for query building
- Soft-delete filtering should be consistently applied in repository methods
- Repository is the enforcement point for tenant scoping and data isolation

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Repository for every model | Default pattern habit | 50 interfaces, 50 implementations | Only for aggregate roots with storage variation |
| Exposing Eloquent-specific methods | Leaky abstraction | Abstraction provides no hiding | Design interface around domain concepts |
| Repository manages transactions | Copy-paste from other patterns | Nested transaction bugs | Let caller manage transaction boundary |
| Repository for read-only queries | Misunderstanding purpose | Query objects are simpler | Use query objects for reads |
| `save()` wrapping `$model->save()` | Habit | Pointless indirection | Only if save logic is genuinely complex |

## Anti-Patterns

- **Leaky Abstraction**: Repository interface mirrors Eloquent's API exactly. Design the interface around domain concepts, not SQL operations.
- **Repository Per Entity Proliferation**: 50 repository interfaces for 50 database tables. Only create repositories for aggregate roots that genuinely need storage abstraction.
- **N+1 via Repository**: Repository returns a collection, then lazy-loads relations. Document required relations in the method signature.
- **Transaction Antipattern**: Repository manages its own transaction. Always let the caller manage the transaction boundary.

## Examples

```php
// Interface — domain owned
interface ContractRepository
{
    public function findById(int $id): ?Contract;
    public function findActive(): Collection;
    public function store(Contract $contract): Contract;
    public function delete(Contract $contract): void;
}

// Eloquent implementation — infrastructure
class EloquentContractRepository implements ContractRepository
{
    public function findById(int $id): ?Contract
    {
        return Contract::with('lines', 'signatures')->find($id);
    }

    public function store(Contract $contract): Contract
    {
        $contract->save();
        return $contract->fresh();
    }
}
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Model Design |
| Prerequisite | Domain Modeling Patterns |
| Closely Related | When Repositories Hurt |
| Closely Related | Query Object Alternative |
| Closely Related | Ports and Adapters |
| Closely Related | Eloquent as Adapter |

## AI Agent Notes

- Repository interface contains zero Eloquent-specific types
- Repository does not manage transactions — the caller does
- Repository methods return domain models or collections
- Repository only for aggregate roots with actual storage variation needs

## Verification

- [ ] Repository interface contains zero Eloquent-specific types (no `Builder`, no `Model`)
- [ ] Every repository method is unit-testable with an in-memory fake
- [ ] Repository does not manage transactions — the caller does
- [ ] Repository methods return domain models or collections of domain models
- [ ] Repository is only created for aggregate roots with actual storage variation needs
