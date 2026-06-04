# Skill: Implement a Custom Pipeline

## Purpose
Use Laravel's `Illuminate\Pipeline\Pipeline` class to process data or requests through a sequence of pipes for reusable, composable processing workflows.

## When To Use
- Building custom middleware stacks independent of HTTP (job middleware, mail middleware)
- Processing data through transformation/validation chains
- Creating reusable processing workflows that follow the pipe-and-filter pattern
- Understanding how Laravel's HTTP middleware works internally

## When NOT To Use
- For single-step processing (a simple function call suffices)
- For parallel or branching flows (Pipeline is sequential)
- For event-driven or asynchronous flows (use queue/event system)
- When the processing order doesn't matter (use collection pipeline instead)

## Prerequisites
- Laravel project with the Pipeline class available
- Understanding of the onion model (pre/post wrapping)
- Pipe classes or callables to compose

## Inputs
- Passable data (object or array to process)
- Pipe array (class strings, closures, or objects)
- Destination closure (final processing step)

## Workflow
1. Determine the passable (the data that travels through pipes) -- typically a Request object or data array
2. Define the pipes as an array of class strings or closures, each receiving ($passable, $next)
3. For class-string pipes, implement `handle($passable, $next)` method
4. Call `app(Pipeline::class)->send($passable)->through($pipes)->then($destination)`
5. Use `thenReturn()` when the destination simply returns the passable
6. Ensure every pipe returns `$next($passable)` unless intentionally short-circuiting
7. For parameterized pipes, use colon syntax in class strings: `'App\Pipe:param1,param2'`
8. Test the pipeline with unit tests that verify execution order and passable mutations

## Validation Checklist
- [ ] Each pipe returns the result of `$next($passable)` or a short-circuit response
- [ ] Class-string pipes used instead of closures for production code
- [ ] `thenReturn()` used when destination is trivial
- [ ] Pipeline execution order verified (first pipe in array executes first)
- [ ] Short-circuit behavior tested (early return stops downstream pipes)
- [ ] Passable modifications are documented

## Common Failures
- Forgetting to `return $next($request)` -- pipeline silently halts
- Using closures for production pipes (cannot be cached)
- Using Pipeline for single-step processing (unnecessary abstraction)
- Not handling container resolution failures (invalid class string -> 500 error)
- Storing request state in static properties (data leakage in Octane/Swoole)

## Decision Points
- Class string or closure pipe? -> Class string if production, closure if ad-hoc/testing
- `then()` or `thenReturn()`? -> `thenReturn()` if destination just returns passable
- Single pipeline or multiple? -> One pipeline per processing flow; avoid nesting

## Performance Considerations
- Pipeline resolution adds ~0.1-0.5ms per middleware
- Nested closure structure is memory-efficient (closures capture by reference)
- Short-circuit prevents downstream processing (saves resources)
- 20+ middleware stacks should be profiled with Telescope

## Security Considerations
- Short-circuiting pipe prevents downstream execution (security implications)
- Invalid class string causes unhandled `BindingResolutionException`
- Missing `$next()` call stops pipeline silently (no response, no error)
- Storing state in static properties causes cross-request data leakage

## Related Rules
- Always Return `$next($request)` from `handle()`
- Keep Each Pipe Focused on a Single Concern
- Prefer Class-String Pipes Over Closures in `through()`
- Use `thenReturn()` When the Destination Is Trivial
- Do Not Use the Pipeline Pattern for Single-Step Processing
- Do Not Use Pipeline for Parallel or Branching Flows
- Understand the Short-Circuit Impact on Downstream Pipes

## Related Skills
- Implement Pre- and Post-Middleware Code
- Configure Middleware Priority
- Implement Terminable Middleware

## Success Criteria
- Custom pipeline successfully processes passable through all pipes
- Each pipe resolves from the container and receives correct parameters
- Execution order matches the pipe array order
- Short-circuit works as expected
- Pipeline is testable and reusable
