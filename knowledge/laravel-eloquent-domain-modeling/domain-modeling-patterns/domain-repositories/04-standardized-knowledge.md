# Domain Repositories

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Domain Modeling Patterns |
| Knowledge Unit | Domain Repositories |
| Classification | Advanced |
| Last Updated | 2026-06-02 |

## Overview

The repository pattern mediates between the domain model and data persistence, presenting domain objects as if they were in-memory collections. In Laravel, repositories are debated because Eloquent already provides data access abstraction. This KU examines when repositories add value in a Laravel DDD context, how to implement them without over-engineering, and what problems they solve that Eloquent doesn't.

## Core Concepts

- **Repository**: A mechanism encapsulating storage, retrieval, and search behavior as an in-memory collection of domain objects
- **Collection-Oriented Interface**: Methods like `find()`, `add()`, `remove()` operating in domain object terms
- **Persistence Ignorance**: Domain code using repositories doesn't know about databases, ORMs, or SQL
- **Repository vs Eloquent**: Eloquent's Builder is already an abstraction over SQL; a repository adds a further abstraction
- **Specification Pattern**: Encapsulating query criteria into reusable objects

## When To Use

- You need to abstract multiple data sources behind one interface
- The persistence strategy is not Eloquent (event store, file system, external API)
- You need in-memory test implementations without database setup
- The aggregate root has complex persistence requirements

## When NOT To Use

- The only data source is Eloquent with a single MySQL/PostgreSQL database
- The repository would mirror Eloquent's API exactly (leaky abstraction)
- Testing is already handled by SQLite in-memory + RefreshDatabase

## Best Practices

- **Design interfaces around domain concepts, not data operations**: A method named `findWhere(array $criteria)` leaks SQL. `findActiveContracts()` expresses the domain concept. The interface should speak the ubiquitous language.
- **One repository per aggregate root**: Not every entity needs a repository. Only aggregate roots with complex persistence needs or multiple data sources warrant the abstraction.
- **Repositories should not manage transactions**: Transaction boundaries belong to the use-case layer. Repositories that wrap saves in transactions cause nested transaction bugs.

## Architecture Guidelines

- Repository interfaces in the domain layer (or `App\Contracts\Repositories\*`)
- Implementations in the infrastructure layer (`App\Repositories\*`)
- Repository methods return domain objects or collections
- Repository interface contains no Eloquent-specific types

## Performance Considerations

- Repository methods add a single method call — negligible overhead
- Strategies like eager loading should be explicit in repository methods
- Caching decorators can wrap repositories without changing interfaces

## Examples

```php
interface OrderRepository
{
    public function findById(int $id): ?Order;
    public function findPending(): Collection;
    public function save(Order $order): void;
    public function delete(Order $order): void;
}

class EloquentOrderRepository implements OrderRepository
{
    public function findById(int $id): ?Order
    {
        return Order::with('items')->find($id);
    }

    public function save(Order $order): void
    {
        $order->push(); // Save root + children
    }
}
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Aggregate Roots |
| Prerequisite | Aggregate Boundaries |
| Closely Related | When Repositories Help |
| Closely Related | When Repositories Hurt |
| Advanced | Eloquent as Adapter |

## AI Agent Notes

- Design interfaces around domain concepts, not SQL operations
- One repository per aggregate root, not per entity
- Repositories don't manage transactions

## Verification

- [ ] Repository interface uses domain language, not SQL terms
- [ ] Repository is created only for aggregate roots with storage variation needs
- [ ] Repository does not manage transactions
- [ ] Repository is testable with an in-memory alternative
