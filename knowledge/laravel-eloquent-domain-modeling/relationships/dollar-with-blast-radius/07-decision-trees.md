## Model Loading Strategy ($with vs Explicit with())

Choosing between automatic eager loading via `$with` property and explicit `with()` at the query site.

---

## Decision Context

When a relationship is frequently needed alongside the parent model, you must decide whether to make it automatic via `$with` or require explicit loading at each query site.

---

## Decision Criteria

* scope of model usage across the application
* whether the relationship is truly needed on every query
* performance impact on batch jobs, tests, and seeders
* whether constraint loading is needed (not supported by $with)

---

## Decision Tree

Should a relationship be automatically loaded?

↓

Is this model used across many parts of the application (e.g., User)?

YES → NEVER use `$with` — the blast radius is too large

    Use explicit `with()` at each query site

NO → Is the model narrow in scope (single subsystem)?

    Is the relationship needed on EVERY query for this model?

    YES → `$with` may be acceptable (profile first to confirm)

        Can you use `$with` with constraints?

        NO — `$with` does not support constraint closures

        Consider explicit `with()` with constraints instead

    NO → Use explicit `with()` — `$with` would add unnecessary queries

---

## Rationale

`$with` on a widely-used model like User adds hidden queries to every controller, job, command, test, and seeder that touches the model. The blast radius is the entire application. Even for narrowly-scoped models, `$with` prevents using constraint closures (filtering, limiting, column reduction) that explicit `with()` supports.

---

## Recommended Default

**Default:** Never use `$with` on widely-used models; prefer explicit `with()` at the query site
**Reason:** Explicit loading is self-documenting, supports constraints, and has no blast radius

---

## Risks Of Wrong Choice

Hidden query overhead across the application, inability to opt out per query (before 9.33), cascading `$with` on nested relationships, query count regressions in tests.

---

## Related Rules

- Selective-Eager-Loading (eager-loading-fundamentals/05-rules.md)

---

## Related Skills

- Prevent N+1 with strategic eager loading (eager-loading-fundamentals/06-skills.md)

---

## Legacy Code Migration ($with Removal)

Strategy for safely removing `$with` relationships from legacy codebases.

---

## Decision Context

When auditing legacy code that uses `$with`, you must decide how to safely remove the automatic loading without breaking existing functionality.

---

## Decision Criteria

* number of query sites affected
* test coverage of affected models
* whether `withoutEagerLoads()` is available (Laravel 9.33+)
* batch-processing context (jobs, commands, seeders)

---

## Decision Tree

Auditing a model with `$with`?

↓

Remove `$with` from the model property

↓

Find all query sites for this model (grep for `Model::`)

↓

Does the relationship need to be loaded at each site?

YES → Add explicit `with('relation')` to that query

NO → Leave as is (no change needed)

↓

For batch jobs/commands:

Use `withoutEagerLoads()` for bulk operations on models that still have `$with`

---

## Rationale

Removing `$with` is safe because the relationship was already being loaded explicitly in most cases where it was needed. The blast radius is the key concern — individual query sites should own their loading decisions. `withoutEagerLoads()` provides a migration path for models where `$with` can't be removed immediately.

---

## Recommended Default

**Default:** Remove `$with` and add explicit `with()` at each query site where it's needed
**Reason:** Scoped, explicit, auditable, and supports constraint closures

---

## Risks Of Wrong Choice

Breaking queries that relied on `$with` for the relationship to be available; temporary query count increase if `withoutEagerLoads()` is used in production.
