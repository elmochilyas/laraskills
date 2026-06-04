# Domain Repositories

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Domain Modeling Patterns
- **Last Updated:** 2026-06-02

## Executive Summary
The repository pattern mediates between the domain model and data persistence, presenting domain objects to the application as if they were in-memory collections. In Laravel, the value of repositories is debated because Eloquent already provides a data access abstraction. This KU examines when repositories add genuine value in a Laravel DDD context, how to implement them without over-engineering, and what problems they solve that Eloquent doesn't.

## Core Concepts
- **Repository:** A mechanism for encapsulating storage, retrieval, and search behavior, emulating an in-memory collection of domain objects.
- **Collection-Oriented Interface:** Repositories expose methods like `find()`, `add()`, `remove()`, and `findBy()` — operating in terms of domain objects, not queries.
- **Persistence Ignorance:** Domain code that uses repositories doesn't know about databases, ORMs, or SQL.
- **Repository vs Eloquent:** Eloquent's `Builder` is already an abstraction over SQL; a repository adds a further abstraction above Eloquent.
- **Specification Pattern:** Encapsulating query criteria into reusable objects that repositories accept.

## Mental Models
- **"Repository as Collection":** Think of a repository as an in-memory collection of domain objects. You `add()` an order, you `find()` one by ID, you `remove()` one. The database is invisible.
- **"The Firewall Between Domain and Persistence":** Domain code talks only to the repository interface. The implementation (Eloquent, file, API) is interchangeable.
- **"Repository for Aggregates, Eloquent for Everything Else":** Only complex aggregates with performance-critical querying need repositories. Simple CRUD models don't.

## Internal Mechanics
A repository typically wraps Eloquent queries:
```php
interface OrderRepository
{
    public function find(OrderId $id): Order;
    public function add(Order $order): void;
    public function remove(Order $order): void;
    public function findByCriteria(Criteria $criteria): Collection;
}

class EloquentOrderRepository implements OrderRepository
{
    public function find(OrderId $id): Order
    {
        return Order::query()
            ->with('items.product')
            ->findOrFail($id->value());
    }

    public function add(Order $order): void
    {
        $order->push(); // saves aggregate + children
    }
}
```

The `add()` method typically calls `save()` or `push()`. The `remove()` method calls `delete()` or `forceDelete()`. The repository manages transactionality and eager-loading strategies.

## Patterns
- **Interface in Domain, Implementation in Infrastructure:** The repository interface lives in the domain layer; the Eloquent implementation lives in infrastructure.
- **Repository per Aggregate Root:** One repository per aggregate root, not per database table.
- **Specification-Based Queries:** Repositories accept specification objects for complex query criteria.
- **Read-Only Repositories:** Separate read-only repository interfaces for queries that don't mutate.
- **Caching Repository:** A decorator around the repository that caches results (especially for expensive queries).
- **Empty Collection Return:** Repositories return empty collections, never null, for query methods.

## Architectural Decisions
- Whether to use repositories at all (vs direct Eloquent usage in services/controllers)
- Interface granularity: one method per query type vs generic `findBy()` methods
- Whether repositories return Eloquent models or custom DTOs
- How repositories handle transactions — internally or externally managed
- Whether repositories load full aggregates or allow partial loading strategies

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Domain code is persistence-agnostic | Additional abstraction layer with little gain in single-DB apps | Introduce only when testing or DB-switching demands it |
| Simplifies unit testing (swap implementation) | Repositories often mirror Eloquent API exactly | Use only when abstraction > cost |
| Centralizes eager-loading strategies | Adds boilerplate for each aggregate | Consider generator or base repository class |
| Enforces aggregate boundaries | Repositories may be bypassed for "quick queries" | Establish convention: all reads through repository |
| Works well with DDD and complex domains | Overkill for CRUD-heavy applications | Apply selectively to complex aggregates only |

## Performance Considerations
- Repository methods should use eager-loading to avoid N+1 in consuming code.
- Batch operations (saving 1000 orders) should have a dedicated `addMany()` method to avoid 1000 individual transactions.
- Caching repositories should use cache tags for aggregate-specific invalidation.
- Repository query methods should support pagination for large result sets.
- Repository `find()` operations should use query scoping and indexing strategies defined outside the repository.

## Production Considerations
- Monitor repository method call counts and durations to identify N+1 or missing eager loads.
- Implement a base repository with logging/telemetry around Eloquent operations.
- Repository interfaces enable swapping implementations for testing (in-memory repository for tests).
- Ensure aggregate-level caching with TTL is implemented in the caching repository decorator.
- Transaction boundaries should be managed at the application service level, not inside repositories.

## Common Mistakes
- Creating a repository for every Eloquent model (unnecessary abstraction)
- Writing repository methods that exactly mirror Eloquent methods (`get()`, `where()`, `first()`)
- Making repositories responsible for transactions (should be managed by the caller)
- Returning `null` from `find()` methods instead of throwing or returning `Optional`
- Loading all aggregate children for every query, including read-only listings

## Failure Modes
- **Repository Proliferation:** Too many repository classes that do nothing useful. Consolidate or remove.
- **Leaky Abstraction:** Repository methods expose Eloquent-specific features (query builder patterns, pagination). Keep the interface generic.
- **N+1 in Repository Consumer:** Consumer iterates repository results and accesses lazy-loaded relationships. Repository should eager-load known access patterns.
- **Transaction Across Repositories:** Caller modifies two aggregates through two repositories in one transaction. This breaks aggregate boundary rules.

## Ecosystem Usage
- Laravel docs mention repositories as an optional pattern
- `laravel-actions` + `laravel-data` (Spatie) used together can reduce repository boilerplate
- `prettus/l5-repository` — popular but controversial repository generator for Laravel
- OSS projects: repositories used primarily for aggregates, not single tables
- Community consensus: repositories are optional and most beneficial in complex domains

## Related Knowledge Units

### Prerequisites
- active-record-domain-layer — Eloquent as the data access foundation
- aggregate-roots — what repositories manage
- Repository Pattern Fundamentals — collection-oriented interfaces and persistence ignorance

### Related Topics
- active-record-domain-layer
- aggregate-roots
- aggregate-boundaries

### Advanced Follow-up Topics
- domain-services
- bounded-contexts

## Research Notes
- Evans: *Domain-Driven Design* (2003), Chapter 6 — Repository pattern as "a mechanism for encapsulating storage"
- Fowler: *Patterns of Enterprise Application Architecture* (2002) — Repository pattern
- Controversial in Laravel community: many argue Eloquent already IS a repository
- Taylor Otwell has stated repositories are generally unnecessary with Eloquent
- Pragmatic approach: use repositories only when testing demands or when aggregate loading is complex
