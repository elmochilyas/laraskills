# $with Blast Radius — ECC

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships
- **Knowledge Unit:** $with Blast Radius
- **ECC Version:** 1.0

## Overview
The `$with` property on an Eloquent model defines relationships that are always eager-loaded whenever the model is queried. While convenient, this creates hidden, unconditional query overhead on every model retrieval — across controllers, commands, jobs, tests, and seeders. Understanding the blast radius is critical for avoiding accidental performance regressions.

## Core Concepts
- `protected $with = ['relation']` on a model causes automatic eager loading on every query
- Applies to `Model::all()`, `Model::find()`, `Model::where()->get()`, `Model::first()`, etc.
- `$with` relationships are loaded in addition to any explicit `with()` calls — they compound
- No mechanism to opt out per-query before Laravel 9.33; `withoutEagerLoads()` available since
- The blast radius grows with the model's usage across the application

## When To Use
- Only for truly universal relationships needed on every single page/API response
- On specialized models with narrow usage scope (e.g., a model used only in one subsystem)
- When profiling confirms the relationship is needed on every query (rare — <1% of models)
- For models with mandatory relationships that define the model's identity

## When NOT To Use
- Do NOT use for convenience — explicit `with()` at the query site is always preferred
- Do NOT use on widely-used models like `User` — the blast radius affects the entire application
- Do NOT use on models that appear as `belongsTo` or `morphTo` targets — cascading overhead
- Do NOT use as a substitute for proper eager loading discipline

## Best Practices (WHY)
- Start every model with an empty `$with` array — add relationships only when profiling proves necessity
- Use `withoutEagerLoads()` in batch-processing jobs and Artisan commands
- Prefer explicit `with()` at the query site — it's self-documenting and scoped
- Audit `$with` on legacy codebases — the performance impact is likely unintentional
- Add CI lint rules flagging `$with` usage on widely-used models

## Architecture Guidelines
- Keep `$with` to 0–1 relationships maximum; use explicit loading for everything else
- Never use `$with` on models that are eager-loaded as `belongsTo` or `morphTo` targets
- Use `withoutEagerLoads()` in queue jobs, tests, seeders, and Artisan commands
- Monitor query count per endpoint — `$with` regressions appear as sudden query count increases

## Performance
- `$with` compounds with explicit `with()` — if both specify relationships, all are loaded
- Impact scales linearly with the number of queries executed on the model
- In test suites, `$with` adds unnecessary queries to every `User::find()` in factories and assertions
- In batch jobs, `$with` adds gigabytes of unnecessary memory pressure per chunk
- `$with` relationships are loaded even for `count()` queries in some scenarios

## Security
- `$with` may load sensitive relationships into every response context
- Relationships loaded via `$with` are included in serialization — ensure no data leaks
- `withoutEagerLoads()` should be used in contexts where sensitive relationships aren't needed

## Common Mistakes
- Using `$with` for convenience on the User model — affects every query across the application
- Not realizing `$with` affects the count query — unnecessary relationship loads
- `$with` on a model used in relationships — cascading overhead on every eager load
- Adding relationships to `$with` over time without auditing — list grows silently

## Anti-Patterns
- **"Convenience" $with**: adding `$with = ['profile']` to User because profile is "usually" needed
- **Compounding $with**: Model A has `$with = ['b']`, Model B has `$with = ['c']` — cascading 3+ queries
- **$with in tests**: slowing down the entire test suite with unnecessary eager loading
- **Hidden N+1**: `$with` masking lazy loading problems in development

## Examples
```php
// Avoid this — blast radius is too large
class User extends Model
{
    protected $with = ['profile']; // Every User query loads profile
}

// Better — explicit loading at query site
$users = User::with('profile')->get();

// Per-query opt-out (Laravel 9.33+)
$users = User::withoutEagerLoads()->where('active', true)->get();

// Suppress $with for batch operations
Model::withoutEagerLoads(function () {
    User::chunk(100, function ($users) {
        // process without $with overhead
    });
});

// Acceptable $with — narrow usage scope
class MediaConversion extends Model
{
    protected $with = ['media']; // Used only in media subsystem
}

// CI lint rule (example)
// $ phpstan: "Never use \$with on the User model"
```

## Related Topics
- Eager Loading Fundamentals — core `with()` mechanics
- Constrained Eager Loading — contrast: `$with` cannot use constraints
- Lazy Eager Loading — explicit post-retrieval loading
- N+1 Detection and Prevention

## AI Agent Notes
- Never generate `$with` on widely-used models like `User`
- Always prefer explicit `with()` at the query site over model-level `$with`
- Use `withoutEagerLoads()` in batch jobs, commands, and tests
- The blast radius is the key danger — a single `$with` can silently multiply query count across the entire application
- `$with` does not support constraint closures — you can't filter, limit, or select columns

## Verification
- [ ] No models have unnecessary `$with` declarations
- [ ] `$with` is empty on all widely-used models (User, Team, etc.)
- [ ] `withoutEagerLoads()` is used in batch-processing jobs
- [ ] Query count per endpoint is stable and expected
- [ ] Test suite doesn't suffer from `$with` overhead
- [ ] Explicit `with()` is used instead of `$with` for relationship loading
