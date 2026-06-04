# Skill: Prevent N+1 with Proactive Eager Loading Strategies

## Purpose
Embed eager loading discipline into the development workflow through conventions, code structure, and defensive programming patterns that eliminate N+1 queries before they reach production.

## When To Use
- Every controller method that returns a view or API resource listing multiple models with relations
- Accessors that reference relationships — use `loadMissing()` to ensure they are loaded
- Blade components that accept models and access their relations
- Any code path where a collection of models is iterated and relationships are accessed

## When NOT To Use
- Single-model endpoints with no relationship access
- Administrative tools where query performance is not critical
- Read-replica queries where you minimize query count at the cost of more data per query

## Prerequisites
- Relationship definition basics
- Eager loading concepts (`with()`, `load()`)

## Inputs
- Controller/endpoint code
- List of relationships accessed by the view or resource
- Model class definitions

## Workflow
1. In controllers: eagerly load all relations the view or API resource will consume using `with()`
2. In accessors: use `loadMissing()` instead of `load()` to avoid redundant queries on pre-loaded models
3. For list endpoints: prefer explicit `with()` over `$with` model property (scoped to the query path)
4. For nested relations: use constrained loading with closures to limit child record volume
5. For counts: use `withCount()` instead of loading full relation collections
6. For serialization: use `whenLoaded()` in API resources to conditionally include relations
7. Verify no lazy loading in Blade templates — views should access only pre-loaded data

## Validation Checklist
- [ ] Every controller method eager-loads all relations consumed by its view/resource
- [ ] Accessors use `loadMissing()` before accessing relationships
- [ ] `$with` only used for universally-needed relations (reviewed individually)
- [ ] Nested eager loading has constraints (limits, where clauses)
- [ ] Views receive pre-loaded models — no lazy loading in Blade templates
- [ ] `withCount()` used instead of full relation loading where only counts needed

## Common Failures
- Using `$with` for rarely-needed relations — every query fetches unused relations
- Eager loading but never accessing — wasted memory and I/O
- Nested eager loading without constraints — millions of child rows loaded
- Forgetting eager loading in serialization — `$post->toArray()` triggers lazy loads

## Decision Points
- `$with` vs explicit `with()`: `$with` applies globally to every query — use only for nearly-always-needed relations; use explicit `with()` for specific query paths
- `load()` vs `loadMissing()`: use `loadMissing()` in accessors and defensive code; use `load()` when you know the relation is not yet loaded

## Performance Considerations
- Eager loading adds one query per relation
- Large `WHERE IN (...ids)` clauses (10k+ IDs) can exceed MySQL's `max_allowed_packet`
- Constrained eager loading reduces memory — only required child rows loaded
- Cache expensive eager loads with `Cache::remember()`

## Security Considerations
- Over-eager loading of sensitive relations may expose data through serialization
- Use `whenLoaded()` in API resources to conditionally include relations

## Related Rules
- Always Eager-Load in Controllers (performance-and-integrity/prevention-strategies)
- Use loadMissing in Accessors (performance-and-integrity/prevention-strategies)
- Prefer Explicit with() Over $with Model Property (performance-and-integrity/prevention-strategies)
- Use Constrained Loading for Nested Relations (performance-and-integrity/prevention-strategies)
- Never Lazy-Load in Blade Templates (performance-and-integrity/prevention-strategies)
- Use loadCount Instead of Full Relation Loading (performance-and-integrity/prevention-strategies)

## Related Skills
- Enforce Lazy Loading Violations with Strict Mode
- Detect N+1 with Automated Tooling
- Implement Select Constraints for I/O Reduction

## Success Criteria
- No lazy loading in views or API resources
- Accessors defensive against both pre-loaded and unloaded models
- Only needed relations loaded — no waste
- N+1 prevention verified with strict mode and query count assertions
