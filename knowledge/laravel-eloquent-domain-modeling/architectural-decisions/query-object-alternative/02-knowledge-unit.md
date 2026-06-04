# Query Object Alternative

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Architectural Decisions
- **Last Updated:** 2026-06-02

## Executive Summary
A Query Object is a dedicated class that encapsulates a reusable database query. It's an alternative to repositories for read operations. Instead of adding indByStatus, indByDateRange, indRecent methods to a repository, each distinct query gets its own class. This keeps the read side explicit, testable, and avoids repository bloat. Query Objects shine when an application has many distinct queries against the same model — the repository's method list grows, but query objects stay isolated.

## Core Concepts
- **Query Object:** A class named after a specific query, containing the query logic and returning a result.
- **Read Separation:** Queries are not mixed with write operations (different concerns).
- **Reusability:** A query object can be reused across controllers, actions, and CLI commands.
- **Composability:** Query objects can accept filters, sort orders, and pagination parameters.
- **Testability:** Query objects can be tested against a real database in isolation.

## Mental Models
- **The Filing Clerk:** Instead of having a librarian (repository) who does everything — fetch books, shelve books, catalog books — you have a specialist whose only job is "find me all overdue books." That's a query object.
- **The Recipe Card:** Each query is a recipe card. You read the card, follow the steps, get the dish (result). You don't need a whole cookbook (repository) if you only use two recipes.
- **The SQL Named Lens:** Think of it as a saved SQL query with a name, parameterized and reusable, but expressed in PHP.

## Internal Mechanics
1. A Query Object is typically a single class with a __invoke, handle, get, or execute method.
2. It receives filters/parameters via constructor or method arguments.
3. It builds an Eloquent query, executes it, and returns a Collection, LengthAwarePaginator, or a specific result.
4. It does NOT persist data — that's the domain model's or action's job.
5. It may accept query builder scopes for composability.

## Patterns
- **Simple Query Object:** 
ew RecentlyActiveUsersQuery( = 30)->__invoke().
- **Parameterized Query Object:** Constructor accepts filter DTO; method builds query dynamically.
- **Query Object + Caching:** Internal caching of the result with a cache key derived from parameters.
- **Query Object + Scopes:** Reuses model local scopes internally.
- **Paginated Query Object:** Returns a LengthAwarePaginator with pagination parameters passed in.

## Architectural Decisions
- Use a Query Object when the same complex query is needed in multiple places.
- Use a Query Object when a repository would accumulate too many finder methods.
- Use a Query Object for read-only operations that never need persistence abstraction.
- Use a Query Object when you want to unit-test a query's logic independently.
- Prefer model scopes for simple, single-use queries; extract to Query Object when the query has 3+ conditions or is reused.

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Isolates query logic for reuse | More files — one class per query | Acceptable for complex/used queries |
| Avoids repository method explosion | Can over-split if overused | Create query objects only when a query is reused or complex |
| Explicit naming documents intent | Query objects can duplicate scope logic | Let query objects call model scopes internally |
| Easy to test with real DB | No write concern — not a full persistence solution | Pair with models/write models for writes |
| Naturally cacheable | May tempt developers to include business logic | Query objects query; they don't decide business rules |

## Performance Considerations
- Query objects are the ideal place to apply select, with, and eagerLoad constraints.
- Paginated query objects should accept per-page and page parameters, not hard-code them.
- Caching: The query object is a natural unit for caching — the cache key can be derived from the query class name + parameters.
- Avoid lazy-loading inside query objects — always eager-load relations.

## Production Considerations
- **Naming:** Name query objects by what they return: OverdueInvoicesQuery, UsersByRoleQuery.
- **Reusability:** Inject query objects into actions or controllers, not the other way around.
- **Filtering:** Accept filter parameters as a DTO or named arguments, not raw request input.
- **Authorization:** Query objects should not check authorization — they query; authorization happens at the caller level.

## Common Mistakes
- Making query objects that mutate data (that's an action's job).
- Creating a query object for every simple where clause — scopes are sufficient for simple cases.
- Mixing pagination logic with business logic — the query object returns results; the caller decides presentation.
- Hard-coding eager loads that aren't always needed — accept an optional $with parameter.
- Using query objects for writes — the name says "Query Object." Don't put save() calls in them.

## Failure Modes
- **Query Object Proliferation:** 200 query objects, many unused. Mitigate: check usage before creating; delete unused ones.
- **Business Logic Leak:** Query object starts applying business rules beyond filtering. Mitigate: query objects should only filter/sort; domain decisions go in models or actions.
- **Performance Hiding:** Query object returns all rows without pagination. Mitigate: enforce pagination or limits at the query object level.
- **Over-Abstraction:** Query object wraps a single Model::where(...)->get() call. Mitigate: use model scopes for trivial cases.

## Ecosystem Usage
- **Laravel documentation:** Suggests query scopes for reusable query logic — query objects are the named class equivalent.
- **spatie/laravel-query-builder:** Popular package that builds query objects dynamically from request parameters.
- **eloquent-filter (Laravel package):** Filter classes that act as composable query objects.
- **Laravel Nova:** Uses query-like classes for filtering and searching under the hood.
## Related Knowledge Units

### Prerequisites
- [Model Design](../model-design/02-knowledge-unit.md)
- [Domain Modeling Patterns](../domain-modeling-patterns/02-knowledge-unit.md)

### Related Topics
- [When Repositories Help](../when-repositories-help/02-knowledge-unit.md) — Repository vs Query Object decision.
- [When Repositories Hurt](../when-repositories-hurt/02-knowledge-unit.md) — Query objects as a leaner alternative.
- [Read Model Separation](../read-model-separation/02-knowledge-unit.md) — Query objects often return read models.
- [Write Model Separation](../write-model-separation/02-knowledge-unit.md) — Query objects are the read side; write models handle the other.

### Advanced Follow-up Topics

## Research Notes
- **Martin Fowler (PoEAA):** Query Object pattern predates repositories and is simpler.
- **Adam Wathan:** Advocates for query objects over repositories for read operations in Laravel.
- **Laracon 2018 (Adam Wathan):** "Build a query object. It's a class with a get() method. That's it." Presentation showed query objects as a simpler alternative to repositories.
- **DDD community:** Query Objects are sometimes called "Specifications" when they include domain logic filtering, or "Criteria" in some frameworks.