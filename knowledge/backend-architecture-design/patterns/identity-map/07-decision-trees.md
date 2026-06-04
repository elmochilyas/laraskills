# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Design Patterns & Principles
**Knowledge Unit:** Identity Map pattern in PHP/Laravel context
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Rely on Eloquent's identity map vs custom identity map
* Decision 2: Identity map scope — request-bound vs process-wide
* Decision 3: Stale data handling — refresh vs fresh query vs bypass identity map

---

# Architecture-Level Decision Trees

---

## Decision: Rely on Eloquent's Identity Map vs Custom Identity Map

---

## Decision Context

Choose whether to rely on Eloquent's built-in primary-key identity map or implement a custom identity map for domain objects.

---

## Decision Criteria

* performance considerations: Eloquent's identity map is O(1); custom adds tracking memory
* architectural considerations: Eloquent's map covers only `find()` / `findOrFail()`; `where()` queries return new instances
* security considerations: identity map can prevent stale data; no direct security impact
* maintainability considerations: Eloquent's map is zero-config; custom requires maintenance

---

## Decision Tree

Does the application rely on object identity (same instance for same DB row)?
↓
YES → Does Eloquent's built-in identity map cover your use case?
    YES → Is your primary model access via `find()` / `findOrFail()`?
        YES → Eloquent's identity map is sufficient (same instance returned)
        ↓
        Are you also using `where()` queries that return new instances?
        YES → If identity consistency matters, use `find()` or `first()` + track via identity map
        NO → Eloquent's map covers your access pattern
        NO → Consider: can you change access pattern to use `find()`?
            YES → Rely on Eloquent's identity map
            NO → Custom identity map for non-primary-key access
    NO → Is the application using plain PHP domain objects (non-Eloquent)?
        YES → Custom identity map for domain objects
        NO → Eloquent's identity map is sufficient (it handles Eloquent models)

---

## Rationale

Eloquent's built-in identity map handles `find()` / `findOrFail()` — loading the same model by primary key returns the same instance. For `where()` queries, new instances are always returned. If identity consistency across query types is critical, implement a custom identity map. Most applications don't need custom identity maps — Eloquent's map covers the common access pattern.

---

## Recommended Default

**Default:** Rely on Eloquent's built-in identity map (`find()` by primary key). Custom identity map only for plain PHP domain objects or when `where()` query consistency is required.

**Reason:** Eloquent's identity map is zero-config and covers the most common access pattern (`find()`). Custom identity maps add tracking overhead and complexity that few applications need.

---

## Risks Of Wrong Choice

Custom identity map for all Eloquent models: unnecessary complexity, memory overhead, potential inconsistency with Eloquent's map. Relying only on `find()` map while using `where()` for identity-critical access: duplicate instances with inconsistent state.

---

## Related Rules

- Rule 1: Eloquent's identity map covers `find()` / `findOrFail()` — use these for identity-critical access
- Rule 2: `where()` queries always return new instances — be aware of identity inconsistency

---

## Related Skills

- Use Eloquent's Identity Map
- Implement Custom Identity Map

---

## Decision: Identity Map Scope — Request-Bound vs Process-Wide

---

## Decision Context

Choose whether the identity map lives for the duration of a single request or across requests (process-wide).

---

## Decision Criteria

* performance considerations: process-wide map persists across requests (memory leak risk); request-bound is freed after each request
* architectural considerations: request-bound is standard; process-wide may cause stale data across requests
* security considerations: process-wide map may leak data between users if not scoped properly
* maintainability considerations: request-bound is simpler; process-wide requires scoping logic

---

## Decision Tree

Is the application running in a long-lived process (Octane, RoadRunner, ReactPHP)?
↓
YES → Octane requires explicit identity map management
    ↓
    Does the identity map need to persist across requests?
    YES → Very risky — stale data, memory growth, data leakage
    ↓
    Use a scoped identity map: keyed by tenant/user/request ID
    Clear the map at the end of each request
    NO → Request-bound identity map (clear on request end)
    ↓
    Unset or reset the identity map between requests (Octane: flush in middleware)
    NO → Request-bound identity map (standard for traditional PHP-FPM)
↓
Does the application use queue workers (long-running processes)?
YES → Identity map must be scoped to each job (not shared across jobs)
    ↓
    Initialize fresh identity map at job start
    Dispose identity map at job completion
NO → Request-bound is the default (freed when the request completes)

---

## Rationale

In traditional PHP-FPM, the identity map is naturally request-bound (everything is freed after the request). In long-lived processes (Octane, queue workers), the identity map must be explicitly scoped — each request/job gets its own map, and the map is cleared at the end of the unit of work.

---

## Recommended Default

**Default:** Request-bound identity map. In Octane/queue workers, explicitly clear the map between requests/jobs.

**Reason:** Request-bound maps prevent stale data, memory growth, and cross-request data leakage. Long-lived processes require explicit scoping to avoid these issues.

---

## Risks Of Wrong Choice

Process-wide map without scoping: memory leak (identity map grows unbounded), stale data (models from request 1 are reused in request 2), cross-user data leakage. Request-bound map for shared computation: repeated hydration of the same row within a single request.

---

## Related Rules

- Rule 3: Identity map is request-bound — not shared across requests or jobs
- Rule 5: In Octane, flush identity map between requests (middleware)

---

## Related Skills

- Manage Identity Map in Octane
- Scope Identity Map for Queue Jobs

---

## Decision: Stale Data Handling — Refresh vs Fresh Query vs Bypass Identity Map

---

## Decision Context

Choose how to handle stale data in the identity map when the underlying database row has changed.

---

## Decision Criteria

* performance considerations: `refresh()` executes an additional query; `fresh()` creates a new instance; bypass loads from DB directly
* architectural considerations: `refresh()` updates the existing instance; `fresh()` returns a new instance
* security considerations: stale data may show outdated information to users
* maintainability considerations: explicit refresh is clearer; auto-refresh may cause unexpected queries

---

## Decision Tree

Has the model been modified externally (another process/request) since it was loaded into memory?
↓
YES → Is the model about to be used for a decision (auth, pricing, state check)?
    YES → Refresh the model: `$model->refresh()` (updates existing instance in-place)
    ↓
    Does the model also need its relationships refreshed?
    YES → `$model->load(['relation1', 'relation2'])` after `refresh()`
    NO → `refresh()` is sufficient
    NO → Is a completely fresh instance needed (don't modify the identity map)?
        YES → `$model->fresh()` (returns new instance, identity map still has old data)
        ↓
        Use the fresh instance for the current operation
        The identity map retains the original instance for subsequent accesses
        NO → Stale data is acceptable (the field isn't time-sensitive)
NO → Is the model about to be saved and might overwrite someone else's changes?
    YES → Check if the model is dirty (has been modified locally)
    ↓
    Was the model loaded from the identity map (might be stale)?
    YES → `refresh()` before computing changes, then `save()`
    ↓
    Consider optimistic locking (add `lock_version` column, check on save)
    NO → Just `save()` (model is fresh enough)

---

## Rationale

`refresh()` reloads the model from the database and updates the existing instance in place — the identity map retains the same instance with fresh data. `fresh()` creates a new instance that bypasses the identity map. Use `refresh()` when the identity must stay consistent (same instance, fresh data). Use `fresh()` when you need a clean copy without modifying the identity map.

---

## Recommended Default

**Default:** `$model->refresh()` before making decisions based on model state. `$model->fresh()` when you need a clean copy without affecting the identity map.

**Reason:** `refresh()` keeps identity consistent — all references to the model now see fresh data. `fresh()` is for temporary use when the identity map should retain its current state.

---

## Risks Of Wrong Choice

Not refreshing stale data: decisions made on outdated state, potential data corruption. Over-refreshing: unnecessary queries on every access. Using `fresh()` when `refresh()` was needed: two versions of the same DB row in memory, inconsistent state.

---

## Related Rules

- Rule 4: Refresh models from the identity map before making state-based decisions
- Rule 3: Identity map is request-bound

---

## Related Skills

- Use Model Refresh and Fresh
- Implement Optimistic Locking
