# Skill: Use Closures as Queued Jobs Safely

## Purpose
Dispatch simple one-off async tasks via closures without introducing serialization fragility or untestable code.

## When To Use
Simple one-off async tasks: cache warming, log cleanup, analytics pings, lightweight notification dispatches. Prototyping before refactoring to a class job.

## When NOT To Use
Complex logic with multiple dependencies; jobs needing `$this->release()`, `$this->delete()`, or batch participation; high-throughput jobs; jobs requiring explicit `failed()` method.

## Prerequisites
- Understanding of closure serialization constraints
- `laravel/serializable-closure` package (included in Laravel)

## Inputs
- Closure body with async logic
- Captured variables via `use (...)`

## Workflow
1. Ensure the task is simple and fire-and-forget
2. Write closure: `dispatch(function () use ($cacheKey) { Cache::forget($cacheKey); });`
3. Capture variables explicitly with `use ($var1, $var2)` — never `use (&$ref)`
4. Never use `$this` inside the closure body
5. Import all classes explicitly inside the closure
6. Add `->catch(function (Throwable $e) { ... })` for error handling if needed
7. For anything complex: refactor to a class job

## Validation Checklist
- [ ] No `$this` used in closure body
- [ ] No pass-by-reference in `use (&$var)`
- [ ] All classes imported explicitly inside closure
- [ ] Captured variables are serializable (no resources, no closures)
- [ ] Task is simple and fire-and-forget
- [ ] Complex logic uses class job instead

## Common Failures
- Using `$this` in closure — serialization failure or wrong context
- Pass-by-reference in `use (&$var)` — reference doesn't survive serialization
- Not importing classes — class-not-found errors on worker
- Closure too complex — untestable and fragile across deploys

## Decision Points
- Simple one-off task (cache clear, log rotate): closure is fine
- Multiple steps, dependencies, retry logic: use class job
- Need `failed()` callback: use class job

## Performance Considerations
- Closure serialization ~5-10x slower than class job serialization
- Closure payloads are generally larger (serialized scope)
- Deserialization is CPU-intensive (closure reconstruction)

## Security Considerations
- Serialized closures include bound variables — avoid secrets in captured scope
- The AST-based serialization may inadvertently expose code structure

## Related Rules
- Rule 1: prefer-class-jobs-over-closures
- Rule 2: never-use-dollar-this-in-closure
- Rule 3: import-classes-explicitly-in-closures
- Rule 4: closures-only-for-simple-tasks
- Rule 5: no-pass-by-reference-in-closures

## Related Skills
- Write and Configure Class Jobs
- Test Job Dispatch Behavior with Queue::fake()

## Success Criteria
Closures dispatch and execute correctly in worker, captured variables are available, no serialization failures, and complex tasks use class jobs instead.
