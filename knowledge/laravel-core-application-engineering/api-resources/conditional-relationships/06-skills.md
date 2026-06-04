# Skill: Add Conditional Relationships to an API Resource

## Purpose

Include relationship data, counts, and aggregates in resource responses only when they have been explicitly eager-loaded, preventing N+1 queries through loading honesty.

## When To Use

- Every relationship access in a resource — `whenLoaded()` should be the default for any relation
- When the same resource serves both list endpoints (shallow, no relations) and detail endpoints (deep, full relations)
- When relationship counts or aggregates are conditionally included based on controller loading
- Nested sub-resources that independently check their own relation load state

## When NOT To Use

- When a relationship is always loaded and always needed (baseline eager load in the controller) — use direct access in this case
- When the relationship fundamentally changes the resource shape — use separate resources instead
- For non-Eloquent resources (plain arrays, DTOs) that do not have relation loading state

## Prerequisites

- A resource class extending `JsonResource`
- An Eloquent model with defined relationships
- Controller that can eager-load relationships via `->with()`, `->withCount()`, or `->withAggregate()`

## Inputs

- Resource class with relationship accesses
- Controller that eager-loads relationships
- The relationship name, aggregate function and column for conditional methods

## Workflow

1. Identify every relationship accessed inside the resource's `toArray()`.
2. Wrap each relationship access in `whenLoaded($relation)`: `PostResource::collection($this->whenLoaded('posts'))`.
3. Add an aggregate count with `whenCounted($relation)` if the controller will use `withCount()`.
4. Add a custom aggregate with `whenAggregated($relation, $function, $column)` if the controller will use `withAggregate()`.
5. For sub-resources, independently use `whenLoaded()` for their own relationship accesses — they do not inherit the parent's load state.
6. Document required eager loads in the resource class docblock so controllers know what to load.
7. In the controller, eager-load every relationship the resource uses: `User::with('posts.comments')`, `User::withCount('posts')`.
8. Use explicit aliases for aggregates to avoid accessor collisions: `withCount('posts as total_posts')`.
9. Write tests that verify both loaded (field present) and unloaded (field omitted) states.

## Validation Checklist

- [ ] Every relationship access in every resource uses `whenLoaded()`
- [ ] Controllers eager-load all relationships used in their resources
- [ ] `whenCounted()` is paired with `withCount()` in the controller
- [ ] `whenAggregated()` is paired with `withAggregate()` in the controller
- [ ] Sub-resources independently use `whenLoaded()` for their own relationships
- [ ] Tests verify both loaded and unloaded states for each conditional relationship
- [ ] Required eager loads are documented in the resource class docblock
- [ ] Explicit aliases are used for aggregates (`posts as total_posts`) to avoid accessor collisions

## Common Failures

- Lazy loading in resources — using `$this->posts` without `whenLoaded('posts')` triggers N+1 queries (101 queries for 100 items)
- Forgetting to load counts — using `whenCounted('posts')` without `withCount('posts')` in the controller causes silent omission
- Nested sub-resource N+1 — a sub-resource that accesses its own relations without `whenLoaded()` triggers lazy loads per child
- Using `whenLoaded` as error handling for forgotten eager loads — the silent omission hides the developer error; write tests to catch missing loads
- Aggregate naming collisions — using `whenCounted('posts')` when the model has a `posts_count` accessor causes confusion

## Decision Points

- **whenLoaded vs direct access**: Use `whenLoaded` for every relationship as the default. Only use direct access when the relation is guaranteed always loaded (model `$with` property or always eager-loaded in every controller).
- **whenCounted vs whenAggregated**: Use `whenCounted` for simple relationship counts. Use `whenAggregated` for custom aggregates (sum, avg, min, max).
- **Closure form vs direct**: Use the closure form `whenLoaded('posts', fn() => ...)` when you need to transform the loaded data (e.g., limit to 5 recent posts).

## Performance Considerations

- `whenLoaded()` is zero-cost when the relation is not loaded — returns `MissingValue`
- `whenCounted()` checks attribute existence via `offsetExists` — O(1) array lookup
- `withCount` executes a subquery per relationship — profile aggregate-heavy controllers
- N+1 prevention is the primary performance benefit: without `whenLoaded()`, a collection of 100 items produces 101 queries

## Security Considerations

- Conditional relationships do not perform authorization checks on related data — use policy-based filtering on the eager load
- When a relationship is not loaded, the field is silently omitted — clients that depend on the field crash; document all conditional relationships as optional
- `whenCounted` and `whenAggregated` expose aggregate values — ensure these do not leak information about unrelated data
- The controller controls response depth via eager loading; shallow responses prevent accidental deep data exposure

## Related Rules

- Always Use whenLoaded for Every Relationship Access (Performance)
- Document Required Eager Loads in the Resource Class (Maintainability)
- Controllers Must Eager-Load Every Relationship the Resource Uses (Architecture)
- Sub-Resources Must Independently Use whenLoaded (Architecture)
- Pair whenCounted with withCount and whenAggregated with withAggregate (Framework Usage)
- Test Both Loaded and Unloaded States (Testing)
- Use Explicit Aggregate Aliasing to Avoid Accessor Collisions (Design)
- Never Use whenLoaded as Error Handling for Forgotten Eager Loads (Reliability)

## Related Skills

- [Conditional Attributes](../conditional-attributes/06-skills.md)
- [Resource Fundamentals](../resource-fundamentals/06-skills.md)
- [Sparse Fieldsets](../sparse-fieldsets/06-skills.md)

## Success Criteria

- Every relationship access in every resource is wrapped in `whenLoaded()`
- All controllers eager-load every relationship used in their resources
- All conditional relationships have tests for both loaded and unloaded states
- No N+1 queries originate from resource relationship accesses
- Required eager loads are documented and discoverable in the resource class
