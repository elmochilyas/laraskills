## Repository vs Direct Eloquent

Choosing between adding a repository layer and using Eloquent models directly.

---

## Decision Context

When persisting/retrieving data, you must decide whether to wrap Eloquent in a repository interface or use models directly.

---

## Decision Criteria

* whether there are multiple data sources for the same aggregate
* whether storage backend may change
* whether domain logic needs persistence ignorance for testability
* whether storage logic is complex (event sourcing, custom serialization)

---

## Decision Tree

Persisting/retrieving domain data?

↓

Are there multiple data sources (MySQL + Redis + API) for the same aggregate?

YES → Use Repository pattern (interface + implementations)

NO → Is storage logic complex (event sourcing, non-standard persistence)?

    YES → Repository pattern

    NO → Will you ever change storage backend?

        YES → Repository pattern

        NO → Direct Eloquent is sufficient

---

## Rationale

Repositories add abstraction at the cost of indirection. They're valuable when multiple backends exist or when domain persistence must be tested without a database. For standard Eloquent-only storage, the abstraction provides little value.

---

## Recommended Default

**Default:** Direct Eloquent unless multiple backends or storage variation exists
**Reason:** Repository pattern adds overhead without benefit for simple Eloquent-only storage

---

## Risks Of Wrong Choice

Repository for every model creates 50+ unnecessary interfaces; direct Eloquent for multi-backend storage couples domain to specific database.

---

## Related Rules

- Repository interface conventions (from when-repositories-help standardized knowledge)

---

## Related Skills

- Repository implementation (architectural-decisions/06-skills.md)
