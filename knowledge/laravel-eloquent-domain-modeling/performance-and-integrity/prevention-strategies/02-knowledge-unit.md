# Prevention Strategies — N+1 Prevention

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Performance & Data Integrity
- **Knowledge Unit:** Prevention Strategies
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-02

---

## Executive Summary

Prevention strategies are the proactive counterpart to detection: patterns and practices that eliminate N+1 queries before they reach production. Unlike detection (which finds existing problems) or strict mode enforcement (which throws exceptions), prevention embeds eager loading discipline into the development workflow through conventions, code structure, and defensive programming.

---

## Core Concepts

- **Eager loading before access:** Always call `load()` or `loadMissing()` before iterating related data. The golden rule: if you will access a relationship for each model in a collection, eager-load it first.
- **Constrained loading:** Load only the relations you need: `Post::with('comments')->get()` loads all comments; `Post::with(['comments' => fn($q) => $q->where('approved', 1)])` loads only approved ones.
- **Lazy eager loading:** `load()` and `loadMissing()` for post-hoc loading on hydrated collections. `loadMissing()` only loads relations not already present.
- **Default eager loading via `$with`:** Set `protected $with = ['relation']` on the model to always eager-load a relation. Use sparingly — it applies globally.
- **`loadCount()` / `loadExists()`:** Load scalar values instead of full relation collections when only counts or existence checks are needed.
- **`setEagerLoads()`:** Dynamically disable eager loading on a per-query basis when the default `$with` is too aggressive.

---

## Mental Models

### The Grocery List Metaphor
Eager loading is making one trip for all ingredients. Lazy loading is going to the store once per ingredient. Prevention strategies ensure you always write your full grocery list before leaving the house — you batch-errand the relationships you'll need.

### The Compile-Time Check Metaphor
Prevention strategies function like compile-time checks in statically typed languages: they prevent the problem from existing rather than catching it at runtime. Where detection is a linter warning, prevention is a type error.

---

## Internal Mechanics

- `load()` builds a new query per relation: `$posts->load('comments')` executes `SELECT * FROM comments WHERE post_id IN (...ids)`.
- `loadMissing()` checks `$model->relationLoaded($name)` before executing the load query, skipping already-loaded relations.
- `setEagerLoads()` on the query builder allows toggling default eager loads: `Post::setEagerLoads([])->get()` bypasses `$with`.
- `withoutEagerLoads()` is a convenience wrapper for the above, returning a new query instance with defaults stripped.

---

## Patterns

- **Always eager in controllers:** Controller methods eagerly load all relations that the view or API resource will consume.
- **`loadMissing` in accessors:** When an accessor needs a relation, use `loadMissing` to ensure it's loaded without re-querying if already present.
- **View-level loading:** Blade components that access relations accept pre-loaded models as parameters rather than lazy-loading internally.
- **Repository-level eager loading map:** Define an `$withMap` array on repositories mapping view contexts to required relations.

---

## Architectural Decisions

- **`$with` on models vs. explicit `with()` on queries:** `$with` is global and affects all queries, including relationship resolution and serialization. Prefer explicit `with()` scoped to the specific query path. Use `$with` only for relationships that are nearly always needed (e.g., a `User` always needing its `Profile`).
- **Eager loading in API resources:** `Laravel\JsonResource` objects should load all needed relations in the controller or via `whenLoaded()` checks. Resource-level loading couples serialization to data fetching.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Eliminates N+1 entirely | Over-eager loading fetches unused data | Profile to identify truly needed relations |
| `loadMissing` avoids redundant queries | Adds method call overhead | Negligible — a single `isset` check per call |
| `$with` simplifies common paths | Global scope makes optimization hard | Use only for universally-needed relations |
| Repository-level maps centralize loading | Requires discipline to maintain | Document the map; review on schema changes |

---

## Performance Considerations

- Eager loading with `with()` adds a query per relation — loading 10 relations on a parent collection executes 10 `WHERE IN` queries. The database cost is bounded, but network round trips add latency.
- Large `WHERE IN (...ids)` clauses (10k+ IDs) can exceed MySQL's `max_allowed_packet` or PostgreSQL's parameter limit. Batch via `chunk()` or use `whereIntegerInRaw()`.
- Constrained eager loading (`with(['comments' => $closure])`) filters the loaded result set, reducing memory and query payload.

---

## Production Considerations

- Use `loadMissing()` in API resources to avoid re-loading relations that the controller already loaded. Duplicate loads add unnecessary queries.
- Monitor eager loading costs in APM — an eager load that retrieves 100k+ child rows per parent group may need pagination on the relation.
- Cache expensive eager loads: `Cache::remember('posts_with_comments', 3600, fn() => Post::with('comments')->get())`.
- For serialization-heavy endpoints, review that `whenLoaded()` guards are in place for optional relations.

---

## Common Mistakes

- **Using `$with` for rarely-needed relations:** Every query pays the join cost even when the relation is never accessed. Move to explicit `with()`.
- **Eager loading but never accessing:** Loaded but unused relations waste memory and database I/O. Remove them.
- **Nested eager loading without constraints:** `Post::with('comments.replies')` loads all nested data — constrain with closures: `with(['comments' => fn($q) => $q->limit(5)])`.
- **Forgetting eager loading in serialization:** `$post->toArray()` on a model without loaded relations triggers lazy loading. Use `loadMissing()` before serialization.

---

## Failure Modes

- **Over-eager loading timeout:** Loading a deeply nested relation tree (5+ levels) on 1000 parent rows can produce queries returning millions of rows, exhausting memory.
- **Circular `$with` references:** Model A's `$with` references Model B, which references Model A in its own `$with`. Infinite query loop. Avoid cross-model `$with` references.
- **Stale `$with` after schema change:** A removed column used in an eager loading constraint causes runtime errors. Keep `$with` in sync with schema.

---

## Ecosystem Usage

- **Laravel Nova:** Resource `$with` property defines which relations Nova eagerly loads for index and detail views.
- **Laravel API Resources:** `whenLoaded()` method conditionally includes relation data only if it was loaded.
- **Laravel Folio / Jetstream:** Page components pre-load relations in controller methods before rendering.

---

## Related Knowledge Units

### Prerequisites
- Relationship definition (`hasMany`, `belongsTo`, etc.)
- Eager loading basics (`with()`, `load()`)

### Related Topics
- `detection` (identify what to prevent)
- `lazy-loading-violations` (enforcement)
- `select-constraints` (reducing payload of loaded relations)

### Advanced Follow-up Topics
- Lazy loading via dedicated query objects
- GraphQL-inspired relation loading strategies

---

## Research Notes

### Source Analysis
`Illuminate\Database\Eloquent\Builder::load()` hydrates relation queries. `Illuminate\Database\Eloquent\Collection::load()` and `loadMissing()` dispatch to the same builder methods. `Model::$with` is read in `Builder::eagerLoadRelations()`.

### Key Insight
The most effective prevention strategy is architectural: separate data-fetching code from data-access code so that eager loading is centrally managed rather than scattered across views and accessors.

### Version-Specific Notes
- Laravel 8+: `loadMissing()` introduced — prevents double-fetching relations.
- Laravel 9+: `Builder::setEagerLoads()` and `withoutEagerLoads()` for dynamic control.
- Laravel 10+: Performance improvements in `with()` constraint closures for better index utilization.
