# $with Blast Radius

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships
- **Knowledge Unit:** $with Blast Radius
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

The `$with` property on an Eloquent model defines relationships that are **always eager-loaded** whenever the model is queried. This seems convenient but is a hidden performance drain: every query for the model — regardless of context — executes the extra eager loading queries. A single `$with` declaration can silently multiply query count and memory usage across every controller, command, job, test, and Artisan command that touches the model. Understanding the blast radius of `$with` is critical for avoiding accidental performance regressions that are hard to trace back to their source.

---

## Core Concepts

The `$with` property is an array of relationship names (using the same syntax as `with()`) defined on the model class. Whenever a query is executed on that model — via `Model::all()`, `Model::find()`, `Model::where()->get()`, `Model::first()`, or any other retrieval method — the listed relationships are automatically eager-loaded. This applies to the base model only, not to related models in eager loading chains (unless they also have `$with`). The property is defined at the class level, meaning all instances share the same automatic loading behavior. The `$with` relationships are loaded **in addition to** any explicit `with()` calls on the query, meaning they can compound.

---

## Mental Models

Think of `$with` as a **global default eager load with no opt-out**. It's like setting `with('posts')` on every query builder call for that model. The blast radius metaphor is intentional: changing `$with` on a widely-used model like `User` can affect every feature in the application. It's a shotgun approach to relationship loading — easy to set up, impossible to scope. The impact is similar to a database trigger: every read operation carries hidden overhead that's invisible in the query code at the call site.

---

## Internal Mechanics

When a `Builder` is instantiated for a model (via `Model::query()` or any static finder), `Builder::__construct()` checks `$model->with` and calls `$builder->with($model->with)`. This populates the `$eagerLoads` array on the builder. When `get()` or `first()` is called, `eagerLoadRelations()` executes for all relationships in `$eagerLoads` — including both the `with()` calls from the query and the `$with` relationships from the model. There is no mechanism to "opt out" of `$with` on a per-query basis without using `withoutEagerLoads()` (Laravel 9.33+). Before that, the only workaround was to create a new model instance with `$with = []` or query through the base query builder (`Model::query()->setModel(new class extends Model {})`). The `$with` relationships are merged with any explicit `with()` calls via `array_merge()`.

---

## Patterns

- **Use `$with` only for truly universal relationships**: If a relationship is needed on every single page/API response (e.g., a `user.profile` that's always serialized), `$with` may be appropriate.
- **Prefer explicit `with()` over `$with`**: Explicit `with()` at the query site is self-documenting and scoped to the specific use case.
- **Override `$with` per-query using `withoutEagerLoads()`**: Call this method on the query builder to strip all `$with` defaults for that specific query.
- **Use `$with` in specialized contexts**: On a lean model used only in a specific subsystem, `$with` may be safe because the blast radius is small.
- **Audit `$with` on legacy codebases**: Look for `$with` on models that are used across the application — the performance impact is likely unintentional.

---

## Architectural Decisions

The `$with` property exists as a convenience for models that exist primarily as relationship containers. Laravel's default `User` model does NOT use `$with` — this is a deliberate signal that even the most commonly-used model shouldn't have automatic eager loading. The decision to make `$with` unconditional (no built-in per-query opt-out until Laravel 9.33) was a tradeoff for simplicity: checking a property on the model is cheap, while adding an opt-out API would increase the query builder surface area. The blast radius design is a consequence of making eager loading automatic rather than explicit.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Zero boilerplate — relationship always available | Always loaded even when not needed | Unnecessary queries on every model retrieval |
| Centralized relationship declaration | Hidden query overhead invisible at call site | Developers don't know why queries are slow |
| Useful for models with mandatory relationships (~1% of cases) | Adds queries to tests, Artisan commands, and jobs | Every `User::find(1)` in a seeder triggers extra queries |
| Simple to implement | Hard to debug (blast radius) | Finding why a model query is slow requires checking the model file |

---

## Performance Considerations

`$with` compounds with explicit `with()` calls. If `User::$with = ['profile']` and a query uses `User::with(['posts'])->get()`, the result is 3 queries (users + profile + posts) instead of the expected 2. The impact scales linearly with the number of queries executed on the model — if `User` is retrieved in 50 different places, `$with` adds 50 extra queries. For high-traffic endpoints, each extra query adds connection pool pressure and database CPU time. In development environments with lazy loading prevention enabled, `$with` masks lazy loading problems: since relationships are always loaded, developers may not realize they're loading data they don't use.

---

## Production Considerations

Start every model's `$with` as empty. Only add relationships after profiling confirms the relationship is needed on every query. Set up a CI lint rule that flag `$with` usage on models (beyond a small allowlist). In production monitoring, track query count per model and alert if it exceeds expected baselines — `$with` regressions will appear as a sudden increase in query count on endpoints that retrieve the model. Use `withoutEagerLoads()` in batch-processing jobs and Artisan commands to avoid paying the `$with` tax in non-request contexts.

---

## Common Mistakes

- **Using `$with` for "convenience" on the User model**: Why it happens: the profile is needed on most pages, so it's added to `$with`. Why it's harmful: now every `User::find()` in tests, Artisan commands, queue jobs, and seeders loads the profile — even when not needed. Better approach: use `with('profile')` on the specific queries that need it, or create a query scope.
- **Not realizing `$with` affects the count query**: Why it happens: `User::count()` shouldn't need relationships. Why it's harmful: `$with` relationships DO add their queries even for `count()` — though `count()` only executes one query, subsequent model hydration from the same builder still loads `$with` relations. Better approach: use `User::withoutEagerLoads()->count()`.
- **`$with` on a model that's used in relationships**: Why it happens: a `belongsTo` related model has `$with`. Why it's harmful: every time the model is eagerly loaded via `with('relatedModel')`, the `$with` relationships of `relatedModel` are also loaded — cascading overhead. Better approach: never use `$with` on models that appear as `belongsTo` or `morphTo` targets.
- **Adding relationships to `$with` over time without auditing**: Why it happens: one relationship is needed everywhere, then another, then another. Why it's harmful: `$with` list grows silently, each addition compounding query cost. Better approach: keep `$with` to 0–1 relationships; prefer explicit loading.

---

## Failure Modes

- **N+1 hidden by `$with`**: If development has lazy loading prevention off, `$with` loads relationships that may trigger additional nested lazy loading — creating a query cascade that only appears in production under load.
- **Query explosion from `$with` on chained models**: Model A has `$with = ['b']`, Model B has `$with = ['c']`. A single `ModelA::all()` executes 1 (for A) + 1 (for B via $with) + 1 (for C via B's $with) = 3 queries. With 100 models, this becomes 3 queries minimum, but if B loads many Cs, the count multiplies.
- **Memory exhaustion from `$with` in batch jobs**: A queue job that processes 10,000 `User` records via chunking loads `$with` relationships for each chunk — adding gigabytes of unnecessary memory pressure.
- **Test suite slowdown**: A test suite that creates many model instances via factories triggers `$with` queries on every retrieval in assertions, silently slowing down the test suite by 2–5×.

---

## Ecosystem Usage

Very few first-party Laravel packages use `$with`. The default `User` model does not include it. Some admin panel packages (Nova, Filament) explicitly call `withoutEagerLoads()` to strip `$with` when building relationship fields. Packages that do use `$with` (e.g., Spatie MediaLibrary on `Media` model) limit it to specialized models with narrow usage scope. The general ecosystem consensus is to avoid `$with` in application models.

---

## Related Knowledge Units

### Prerequisites
- eager-loading-fundamentals (understanding what `with()` does)
- Eloquent Model Querying (how model queries are constructed)

### Related Topics
- lazy-eager-loading (explicit post-retrieval loading vs automatic)
- constrained-eager-loading (constraints can't be applied to `$with`)
- N+1 detection and prevention

### Advanced Follow-up Topics
- Model query builder customization (overriding `newQuery()` to control `$with`)
- Performance regression detection via CI (comparing query counts)
- Profiling eager loading overhead in production

---

## Research Notes

### Source Analysis
`Illuminate\Database\Eloquent\Builder::__construct()` at `src/Illuminate/Database/Eloquent/Builder.php` checks `$model->with` and calls `$this->with($model->with)`. `Model::$with` is defined as `protected $with = []` in `Illuminate\Database\Eloquent\Model.php`. The `withoutEagerLoads()` method was added in `Illuminate/Database/Eloquent/Builder.php` at Laravel 9.33.

### Key Insight
`$with` is the most dangerous "convenience" feature in Eloquent because its cost is invisible at the call site and cumulative across the application. Every developer who has ever added `$with` to the `User` model has regretted it. The safe default is an empty `$with` array — add relationships explicitly at query time.

### Version-Specific Notes
`withoutEagerLoads()` was added in Laravel 9.33. Before this, there was no clean way to disable `$with` per-query. In Laravel 10+, the method is stable. Laravel 11 did not change `$with` mechanics. The `Model::preventLazyLoading()` does NOT interact with `$with` — `$with` relationships are eagerly loaded and don't trigger lazy loading warnings.
