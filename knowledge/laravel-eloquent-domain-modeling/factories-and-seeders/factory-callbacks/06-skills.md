# Skill: Implement afterCreating Factory Callback

## Purpose

Register post-persistence logic in a factory's `configure()` method using `afterCreating()` for operations that require the model to have a database ID.

## When To Use

- Setting up child relationships that need the parent's foreign key
- Calling domain methods on the model after it is persisted
- Performing post-creation tasks (media uploads, event dispatch)

## When NOT To Use

- The logic is a simple attribute override (use `state()`)
- The logic doesn't depend on persistence (use `afterMaking()`)
- The relationship can be handled by `has()`/`for()`/`hasAttached()` directly

## Prerequisites

- Factory class with `configure()` method exists
- Model is persisted via `create()` (not `make()`)

## Inputs

- The model instance (provided by the callback)
- Optional: Faker instance (provided by the callback)

## Workflow

1. Override `configure()` in the factory class and return `$this`:
   ```
   public function configure(): static { return $this }
   ```
2. Register an `afterCreating()` callback that receives the model:
   ```
   $this->afterCreating(function (Post $post) {
       $post->comments()->saveMany(Comment::factory()->count(3)->make())
   })
   ```
3. Keep each callback focused on a single responsibility:
   ```
   $this
       ->afterCreating(fn (Post $p) => $p->comments()->saveMany(...))
       ->afterCreating(fn (Post $p) => $p->addMedia(...)->toMediaCollection('featured'))
   ```
4. Use the `$this` Faker parameter when random data is needed inside the callback
5. Keep callback logic fast — avoid API calls or heavy I/O

## Validation Checklist

- [ ] Callbacks are registered in `configure()`, not in `definition()`
- [ ] `definition()` has no side effects (pure attribute array)
- [ ] `afterCreating()` used for logic requiring model ID
- [ ] Expensive operations are not performed in callbacks
- [ ] Callbacks are single-purpose and can be overridden by states

## Common Failures

- **Callbacks in definition()**: `$this->afterCreating()` inside `definition()` is technically possible but violates separation of concerns. Always put callbacks in `configure()`.
- **Missing $this return**: `configure()` must return `$this` for the factory builder to work. Missing return type `: static` causes chain breakage.
- **Expensive operations**: API calls or file uploads in callbacks multiply per created model. Dispatch a job instead.

## Decision Points

- **afterCreating vs afterMaking**: Use `afterCreating` for persistence-dependent logic (needs model ID). Use `afterMaking` for setup that should work with both `make()` and `create()`.
- **Callback vs has()**: Prefer `has()` for simple parent-child relationships. Use callbacks for conditional or complex setup that `has()` cannot express.

## Performance Considerations

- Callbacks execute once per created model — expensive operations scale linearly with count
- For batch creation with callbacks, use `withoutEvents()` or raw inserts for the base data

## Security Considerations

- No direct security impact; callbacks run in the application context

## Related Rules

- Rule 1: Keep definition() Pure — No Side Effects
- Rule 2: Use afterCreating for Persistence-Dependent Logic
- Rule 5: Register Callbacks in configure() — Not in definition()
- Rule 7: Keep Callback Logic Short and Single-Purpose

## Related Skills

- Factory States for Named State Variations
- Factory Definition for Attribute Arrays
- HasMany Factory Relationships with has()

## Success Criteria

- Post-persistence logic runs correctly and only on `create()`
- `definition()` remains pure and side-effect-free
- Multiple focused callbacks are independently testable and overridable
