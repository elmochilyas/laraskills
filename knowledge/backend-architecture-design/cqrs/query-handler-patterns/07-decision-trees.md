# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** CQRS
**Knowledge Unit:** Query handler patterns in PHP/Laravel context
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Dedicated query object vs repository method
* Decision 2: Return DTO vs ORM entity from query handler
* Decision 3: Cache at query handler level vs HTTP caching layer

---

# Architecture-Level Decision Trees

---

## Decision: Dedicated Query Object vs Repository Method

---

## Decision Context

Choose between creating a dedicated query object or adding a method to an existing repository for data retrieval.

---

## Decision Criteria

* performance considerations: dedicated objects add file overhead but enable targeted optimization
* architectural considerations: complex queries deserve their own object; simple lookups don't
* security considerations: dedicated query objects can have specific security checks
* maintainability considerations: too many query objects = navigation nightmare; too few = repository bloat

---

## Decision Tree

Is the query a simple lookup by ID?
↓
YES → Repository method (findById is always fine as a repository method)
NO → Does the query require filtering, sorting, or pagination?
    YES → Dedicated query object (encapsulates query parameters and logic)
    NO → Does the query return data from multiple aggregates?
        YES → Dedicated query object (complex query needs its own home)
        NO → Repository method (simple enough for repository)

---

## Rationale

Repository methods are appropriate for basic CRUD lookups. Complex queries with filtering, sorting, pagination, or cross-aggregate data need dedicated query objects to remain testable, optimized, and independently maintainable.

---

## Recommended Default

**Default:** Repository method for simple lookups (findById); dedicated query object for anything with filtering, sorting, or pagination.

**Reason:** Simple lookups don't benefit from the overhead of a dedicated class. Complex queries benefit significantly from encapsulation in a focused query object.

---

## Risks Of Wrong Choice

Repository for complex queries: repository grows too large, method becomes complex and untestable. Dedicated object for simple lookups: unnecessary file count, YAGNI violation.

---

## Related Rules

- Rule 2: Create specific query objects for complex queries; simple finders need only a repository method

---

## Related Skills

- Implement Query Handlers
- Implement Read Model Strategies

---

## Decision: Return DTO vs ORM Entity from Query Handler

---

## Decision Context

Choose whether query handlers should return DTOs/read models or ORM entities.

---

## Decision Criteria

* performance considerations: DTOs may duplicate data; ORM entities have lazy loading overhead
* architectural considerations: DTOs decouple query results from ORM; entities couple to ORM
* security considerations: DTOs can hide sensitive fields; entities may expose them
* maintainability considerations: DTOs create parallel structures; entities reuse existing classes

---

## Decision Tree

Will the query result be serialized to JSON (API response)?
↓
YES → Return DTO/read model (controls exactly what is exposed)
NO → Is the query result going to be used for further domain operations?
    YES → Return ORM entity if staying within the domain; otherwise DTO
    NO → Return DTO (consumer only needs data; entity coupling is unnecessary)
        ↓
        Does the query need lazy-loaded relationships?
        YES → Return ORM entity with relationships (DTOs don't support lazy loading)
        NO → Return DTO (simpler, safer, no lazy loading surprises)

---

## Rationale

DTOs provide a stable contract independent of the ORM, preventing serialization issues and accidental data exposure. ORM entities should only be returned when the consumer needs lazy-loaded relationships or domain operations on the result.

---

## Recommended Default

**Default:** Return DTOs or read models from query handlers; return ORM entities only when domain operations are needed.

**Reason:** DTOs provide a stable, secure contract. ORM entities couple the consumer to the persistence layer and may trigger lazy loading in unexpected contexts.

---

## Risks Of Wrong Choice

Returning ORM entities: serialization issues, lazy loading in unexpected contexts, accidental data exposure. DTOs everywhere: parallel class hierarchies, additional mapping code.

---

## Related Rules

- Rule 4: Query handlers must return DTOs or read models, never ORM entities

---

## Related Skills

- Implement Query Handlers
- Implement Read Model Strategies

---

## Decision: Cache at Query Handler Level vs HTTP Caching Layer

---

## Decision Context

Choose the caching layer for query results to optimize read performance.

---

## Decision Criteria

* performance considerations: query handler caching is more targeted; HTTP caching is broader
* architectural considerations: query handler caching is application-level; HTTP caching is infrastructure-level
* security considerations: HTTP caching may cache sensitive data in shared caches
* maintainability considerations: query handler caching is code-level; HTTP caching is config-level

---

## Decision Tree

Can the query result be cached based on its data, not its HTTP response?
↓
YES → Query handler level caching (targeted, cache key includes query parameters)
NO → Is the result the same for all users (no user-specific data)?
    YES → HTTP caching (reverse proxy, CDN — fastest for public data)
    NO → Does the query have user-specific data in the response?
        YES → Query handler level caching with user-specific cache keys
        NO → HTTP caching if public; query handler caching if authenticated
            ↓
            Is cache invalidation triggered by domain events?
            YES → Query handler level caching (invalidate from event listeners)
            NO → HTTP caching with TTL (simpler, no explicit invalidation)

---

## Rationale

Query handler level caching provides the most control over cache keys and invalidation. HTTP caching is simpler but less flexible. Choose based on whether cache invalidation is event-driven (handler level) or time-based (HTTP level).

---

## Recommended Default

**Default:** Query handler level caching with event-driven invalidation for most queries; HTTP caching only for truly public, user-agnostic data.

**Reason:** Event-driven invalidation ensures cache freshness without TTL guesswork. HTTP caching is simpler but can't respond to data changes immediately.

---

## Risks Of Wrong Choice

HTTP caching for user-specific data: data leakage between users. Query handler caching without invalidation: stale data served indefinitely. No caching for slow queries: poor user experience.

---

## Related Rules

- Rule 5: Handle query caching at the query handler level

---

## Related Skills

- Implement Query Handlers
- Implement Read Model Strategies
