# Lazy Eager Loading

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships
- **Knowledge Unit:** Lazy Eager Loading
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-02

---

## Executive Summary

Lazy eager loading — via `load()` and `loadMissing()` — is the post-retrieval counterpart to `with()`. It loads relationships on an already-hydrated model or collection, executing the same eager-loading queries but after the initial query has already run. This is essential when you don't know which relationships you'll need until after the initial query, when conditionally loading relationships based on runtime logic, or when you need to load relationships in API resources and middleware after the controller has already executed.

---

## Core Concepts

`load()` is called on a single model instance or a `Collection` of models, accepting the same relationship syntax as `with()`: string names, dot-notation for nesting, and array syntax with constraint closures. `loadMissing()` does the same but only loads relationships that aren't already loaded — checking `$model->relationLoaded('name')` before executing the query. Both methods return the model/collection for chaining. The underlying queries are identical to `with()` eager loading: the relationship's query is built and executed, then results are mapped onto the model(s). The key difference from `with()` is timing: `with()` executes the relationship query immediately after the parent query in the same Builder chain, while `load()` can be deferred to any point after the parent models exist.

---

## Mental Models

Think of `load()` as a **lazy breadth-first expansion** — you've already fetched the graph's root nodes, and now you're going back to fetch specific neighborhoods on demand. This is analogous to "just-in-time" batch loading: rather than predicting all needed relationships upfront (which `with()` requires), you react to runtime conditions. The mental model shifts from "fetching a complete graph" to "fetching a graph incrementally, but in batches rather than one row at a time." `loadMissing()` adds a guard: "only fetch this relationship if we haven't already."

---

## Internal Mechanics

`Model::load($relations)` calls `Model::newCollection([$this])->load(...)` — it wraps the single model in a collection and delegates to `Collection::load()`. `Collection::load()` iterates the loaded relations and calls `Builder::eagerLoadRelations()` on the collection, exactly as `with()` does. The same `Relation::getRelationExistenceQuery()` and `match()` methods are used. `loadMissing()` calls `$this->relationLoaded($name)` before proceeding, which checks the model's `$relations` array (the `Illuminate\Database\Eloquent\Concerns\HasRelationships` trait method). If the key exists (even as `null`), the relationship is considered loaded. The query construction, hydration, and mapping are identical to `with()` — the only difference is when the eager load is triggered.

---

## Patterns

- **Conditional loading based on runtime condition**: `if (auth()->user()->isAdmin()) { $post->load('hiddenNotes'); }` — load sensitive relationships only when authorized.
- **Collection batch loading**: `$users = User::all(); $users->load('posts'); $users->load('profile');` — multiple separate loads for clarity.
- **Load in API resources**: Override `toArray()` and call `$this->resource->loadMissing('comments')` to ensure the relationship is available for serialization without double-loading.
- **Load after middleware**: A middleware can attach a loaded relationship to the request model for downstream use: `$request->user()->load('permissions')`.
- **Chained constrained loading**: `$users->load(['posts' => fn($q) => $q->where('published', true)->limit(5)])`.
- **Deferred loading for performance**: Load common relationships immediately, defer expensive ones until needed: `$users = User::with('profile')->get(); if ($someCondition) { $users->load('expensiveRelation'); }`.

---

## Architectural Decisions

The `load()` vs `with()` distinction exists because Eloquent separates "query building" from "model hydration." `with()` is a query-builder concern — it registers relationships to be loaded when the query executes. `load()` is a model/collection concern — it operates on already-hydrated models. This separation allows loading to happen anywhere in the request lifecycle, not just during query construction. The `loadMissing()` variant was added to solve the idempotency problem: when multiple components (middleware, controller, resource) might load the same relationship, `loadMissing()` ensures a relationship is loaded exactly once.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Flexible timing — load relationships anywhere in the request | Model hydration must happen before loading — can't combine with parent query constraints | For scenarios where you only need subset of parents, `with()` is more efficient |
| `loadMissing()` prevents redundant queries | Double-loading risk if `loadMissing()` is forgotten | Each redundant `load()` executes an unnecessary SQL query |
| Works on both single models and collections | No lazy loading on raw arrays (must be Collection) | Ensure model collections, not plain arrays, when calling `load()` |
| Constraint closures work identically to `with()` | More verbose than `with()` for relationships known at query time | Use `with()` when you know upfront; `load()` when you discover later |

---

## Performance Considerations

Each `load()` call executes a separate database query. Multiple `load()` calls on the same collection execute multiple queries — consider batching independent relationships into a single `load(['relation1', 'relation2'])` call to reduce query count. `loadMissing()` adds a lightweight `relationLoaded()` check (array key lookup) and avoids the query if the relation is already present. Calling `load()` on a collection of thousands of models triggers hydration of thousands of related model instances — identical memory considerations to `with()`. For very large collections, consider chunking before `load()`.

---

## Production Considerations

API resources often use `loadMissing()` to ensure relationships are available without assuming the controller loaded them. This is a defensive pattern: the resource works correctly whether or not the controller remembered to eager load. However, `loadMissing()` still executes a query if the relationship isn't loaded — ensure this doesn't mask N+1 problems that should be fixed in the controller. Use `Model::preventLazyLoading()` in development to detect unloaded relationships, then fix at the query level with `with()` rather than relying on `loadMissing()` in production. Telescope's "N+1 watcher" also detects post-retrieval lazy loading via `load()` that could have been `with()`.

---

## Common Mistakes

- **Calling `load()` in a loop**: Why it happens: `foreach ($users as $user) { $user->load('posts'); }`. Why it's harmful: N queries instead of 1. Better approach: call `$users->load('posts')` on the collection.
- **Using `load()` when `with()` would be more efficient**: Why it happens: loading is done in the controller after the query, but the relationship was known from the start. Why it's harmful: an unnecessary extra round trip vs combining in one query chain. Better approach: prefer `with()` for relationships known at query definition time.
- **Not using `loadMissing()` when multiple components may load the same relationship**: Why it happens: assuming only one component touches relationships. Why it's harmful: middleware loads `user.roles`, then controller loads `user.roles` again — 2 queries for the same data. Better approach: use `loadMissing()` defensively.
- **Load after pagination limiting the scope**: Why it happens: calling `load()` on paginated model results. Why it's harmful: `load()` loads relationships only for the current page's models, which is correct. But if the relationship was expected to be available globally, the developer gets fewer related models than expected. Better approach: this is actually correct behavior — just ensure expectations match.

---

## Failure Modes

- **Query on already-loaded collection**: Calling `load('relation')` on a collection where the relation is already loaded executes a redundant query. Use `loadMissing()` to prevent this.
- **Memory spike from large collection load**: `$users->load('posts')` on 10,000 users with 100 posts each loads 1M models into memory — likely to exhaust PHP memory.
- **Serialization before load**: If a model is serialized (e.g., JSON response, queue job) before `load()` is called, the relationship won't be included. Ensure loading happens before serialization.
- **Stale relations after load**: If a relationship was previously lazy-loaded, calling `load('relation')` replaces the loaded relation entirely — any in-memory modifications to the previous relation are lost.

---

## Ecosystem Usage

Livewire components use `load()` after hydration to load relationships based on component state. Nova actions and lenses use `loadMissing()` to ensure relationship data is available for field display. Filament forms load relationship data conditionally based on form state changes. API resources universally use `loadMissing()` as a defensive pattern against missing eager loads from controllers. Queue job middleware uses `load()` to attach necessary relationships before job execution.

---

## Related Knowledge Units

### Prerequisites
- eager-loading-fundamentals (must understand `with()` mechanics)
- Eloquent Collections (understand collection operations)

### Related Topics
- constrained-eager-loading (applying constraints in `load()` closures)
- dollar-with-blast-radius (`$with` vs explicit `load()` tradeoffs)

### Advanced Follow-up Topics
- Lazy loading vs eager loading decision framework
- Load cascading patterns in complex request lifecycles
- Defensive loading strategies for package development

---

## Research Notes

### Source Analysis
`Illuminate\Database\Eloquent\Model::load()` at `src/Illuminate/Database/Eloquent/Model.php` delegates to `newCollection([$this])->load()`. `Illuminate\Database\Eloquent\Collection::load()` at `src/Illuminate/Database/Eloquent/Collection.php` uses the same `eagerLoadRelations()` method as the Builder. `Model::loadMissing()` calls `relationLoaded()` before delegating.

### Key Insight
`load()` and `with()` are the same mechanism at different points in the request lifecycle. `load()` is not a different kind of loading — it's the same eager loading engine, invoked later. The choice between them is a timing decision, not a query optimization decision.

### Version-Specific Notes
`loadMissing()` has been available since Laravel 5.x. `Collection::load()` with constraint closures is available since the same version as `with()` closures (Laravel 5.3+). No changes in Laravel 11.
