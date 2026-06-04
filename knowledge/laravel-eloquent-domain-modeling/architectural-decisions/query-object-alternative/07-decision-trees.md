# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Architectural Decisions
**Knowledge Unit:** Query Object Alternative
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Query Object vs Model Local Scope
* Decision 2: Query Object vs Repository Finder Method
* Decision 3: To Cache or Not to Cache Query Results
* Decision 4: Paginated vs Unbounded Result Sets

---

# Architecture-Level Decision Trees

---

## Decision 1: Query Object vs Model Local Scope

---

## Decision Context

Choose between a dedicated query object class and a model local scope for encapsulating a read-side query.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Does the query have 3+ where conditions?
↓
YES → Query Object
NO → Is the query reused in 5+ places across the codebase?
    YES → Query Object (even with 1-2 conditions)
    NO → Is the query likely to grow in complexity?
        YES → Query Object
        NO → Model Local Scope

---

## Rationale

Model scopes keep simple queries close to the model definition, which is the natural place for straightforward filtering. Query objects add a file and indirection cost justified when the query is complex enough that a scope would bloat the model, or when the query needs explicit parameter control like optional filters and eager loading.

---

## Recommended Default

**Default:** Start with a model local scope. Extract to a query object when the query reaches 3+ conditions or is reused in 3+ places.
**Reason:** Premature query objects create unnecessary files for trivial filters. Scopes are simpler and keep the query definition near the model it filters.

---

## Risks Of Wrong Choice

* Query object for trivial queries: 200 query objects for simple `where` clauses, navigation burden, decreased development velocity
* Scope for complex queries: model file bloat, difficult to test in isolation, no pagination defaults, hard to parameterize

---

## Related Rules

* Rule 3: Prefer model local scopes for simple queries; extract to query objects at 3+ conditions (`05-rules.md`)
* Rule 7: Name query objects by what they return (`05-rules.md`)

---

## Related Skills

* Create a Query Object (`06-skills.md` Skill 1)

---

## Decision 2: Query Object vs Repository Finder Method

---

## Decision Context

Choose between adding a finder method to a repository interface or extracting it into a standalone query object.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Does the repository already have 5+ finder methods?
↓
YES → Extract less-frequently-used finders to query objects
NO → Does the finder method have 3+ joins or 5+ conditions?
    YES → Query Object
    NO → Is the finder reused across multiple callers independently?
        YES → Query Object
        NO → Is the finder a simple lookup (findById, findByName)?
            YES → Keep in repository
            NO → Evaluate based on complexity

---

## Rationale

Repository interfaces grow bloated when every distinct query gets a method. Query objects isolate each query into its own testable, named class, keeping the repository focused on its core persistence contract (store, findById, delete). Simple identity-based lookups belong on the repository.

---

## Recommended Default

**Default:** Keep simple identity finders (findById, findBySlug) on the repository. Extract complex or multi-caller queries to dedicated query objects.
**Reason:** The repository's core contract is CRUD at the aggregate boundary. Complex read queries are a separate concern best encapsulated in their own class.

---

## Risks Of Wrong Choice

* Repository with 20+ finders: interface becomes a dumping ground, SRP violation, query logic hidden in repository implementation
* Query object for every finder: class explosion, navigation overhead, finders that should be grouped are scattered

---

## Related Rules

* Rule 1: Never call `save()`, `update()`, or `delete()` inside a query object (`05-rules.md`)
* Rule 6: Keep business logic out of query objects (`05-rules.md`)

---

## Related Skills

* Refactor a Repository Finder to a Query Object (`06-skills.md` Skill 2)

---

## Decision 3: To Cache or Not to Cache Query Results

---

## Decision Context

Determine whether an expensive query object's results should be cached to reduce database load.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Does the query involve 3+ joins, aggregations, or full-text searches?
↓
YES → Is the data staleness-tolerant (not real-time)?
    YES → Does the query run on every request or frequently?
        YES → Cache with appropriate TTL
        NO → Do not cache (infrequent queries don't need it)
    NO → Do not cache (real-time accuracy required)
NO → Does the query take >100ms to execute?
    YES → Cache
    NO → Do not cache (fast enough)

---

## Rationale

Caching reduces database load for expensive queries but introduces staleness. The decision depends on query cost and data freshness requirements. Dashboard reports and lookup data are good caching candidates; inventory counts and user balances are not.

---

## Recommended Default

**Default:** Do not cache until the query is measured to be expensive (>100ms) and the data is staleness-tolerant. Cache with TTL of 5-15 minutes for dashboards, 1-24 hours for lookup data.
**Reason:** Premature caching adds complexity (invalidation logic, cache key management, TTL tuning) before performance data justifies it.

---

## Risks Of Wrong Choice

* Caching real-time data: users see stale balances or inventory counts, leading to business errors
* Not caching expensive queries: unnecessary database load, slow endpoints, higher infrastructure costs, reactive performance incidents

---

## Related Rules

* Rule 8: Cache query object results when the query is expensive and data is stale-tolerant (`05-rules.md`)

---

## Related Skills

* Add Caching to a Query Object (`06-skills.md` Skill 3)

---

## Decision 4: Paginated vs Unbounded Result Sets

---

## Decision Context

Choose whether a query object should return paginated results with a default page size or return all matching rows.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Is the result set guaranteed to have fewer than 100 rows?
↓
YES → Is the caller a lookup/dropdown that needs all values?
    YES → Unbounded (with explicit opt-out documentation)
    NO → Paginate with reasonable default (15-50)
NO → Paginate with reasonable default (15-50)
→ In both cases: is the caller an API endpoint?
    YES → Always paginate
    NO → Evaluate based on expected dataset size

---

## Rationale

Unbounded queries risk memory exhaustion and slow responses as data grows. A default pagination protects against production incidents. Exceptions exist for lookup tables where returning all rows is intentional and safe.

---

## Recommended Default

**Default:** Always paginate with a page size of 15-50. Require explicit caller opt-out with documentation for unbounded queries.
**Reason:** Pagination is a safety net against data growth. Retrofit pagination after a production incident is costly and reactive.

---

## Risks Of Wrong Choice

* No pagination: memory exhaustion on large datasets, API timeouts, production outages on data growth
* Pagination for lookup tables: unnecessary overhead for small, stable datasets (<100 rows)

---

## Related Rules

* Rule 5: Default to pagination or limits — never return unbounded result sets (`05-rules.md`)
* Rule 4: Always eager-load relations inside query objects (`05-rules.md`)

---

## Related Skills

* Create a Query Object (`06-skills.md` Skill 1)
