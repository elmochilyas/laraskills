# Skill: Implement Custom Middleware with Single-Responsibility Pattern

## Purpose

Create a custom middleware class that addresses exactly one cross-cutting concern, follows the correct `handle()` contract, and properly communicates data to downstream middleware and controllers.

## When To Use

When implementing a new middleware for authentication, authorization, request enrichment, logging, response decoration, or any HTTP-level cross-cutting concern.

## When NOT To Use

For concerns that apply to a single route — use inline closure middleware or controller validation instead. For concerns that need constructor injection — always use class middleware, not closures.

## Prerequisites

- Understanding of the middleware handle() contract
- Knowledge of the three execution paths (pass-through, short-circuit, modify-and-pass)
- Laravel Service Container basics

## Inputs

- Middleware purpose
- Request data the middleware needs to inspect or modify
- Response data the middleware needs to modify

## Workflow

1. Name the class by concern, not usage location (e.g., `CheckRole`, not `AdminMiddleware`)
2. Place in `app/Http/Middleware/`
3. Implement `handle(Request $request, Closure $next): Response`
4. Choose the execution path:
   - Guard/short-circuit: check condition, return response or throw before `$next`
   - Enrichment/modify: call `$request->attributes->set()` before `$next`
   - Post-processing/logging: capture `$response = $next($request)`, modify response, return it
5. Store resolved data on `$request->attributes->set('namespaced.key', $value)` — never `$request->merge()`
6. Always `return $next($request)` or `return response(...)` — never call `$next` without return
7. Use local variables instead of `$this->property` for per-request data
8. Register the middleware at the most restrictive tier

## Validation Checklist

- [ ] Class name describes the concern (e.g., `ForceJson`), not the location (e.g., `ApiMiddleware`)
- [ ] Exactly one concern per class — no auth + logging + locale in the same middleware
- [ ] Every code path returns `Response`
- [ ] `return $next($request)` on the pass-through path
- [ ] `$request->attributes->set()` used for resolved data, not `$request->merge()`
- [ ] No instance properties for per-request data
- [ ] Alias registered (if used by name in route definitions)

## Common Failures

- Forgetting `return` before `$next($request)` — produces empty 200 response silently
- Using `$request->merge()` for non-sanitization data — pollutes user input
- Storing per-request data on `$this` — leaks across requests in Octane
- Naming middleware by location — `AdminMiddleware` doesn't communicate the concern

## Decision Points

- Use closure middleware only for trivial single-route checks without dependencies
- Use class middleware for any middleware requiring constructor injection or non-trivial logic
- For input sanitization only, `$request->merge()` is acceptable

## Performance Considerations

Each middleware adds ~0.01-0.05ms for container resolution. Short-circuit middleware saves downstream execution cost. Cache expensive database lookups in enrichment middleware.

## Security Considerations

Guard middleware is a security enforcement point. Test both pass-through and short-circuit paths. Ensure short-circuit responses include all necessary headers.

## Related Rules

- Implement Exactly One Concern Per Middleware Class (custom-middleware:5)
- Always Return the Result of $next($request) (custom-middleware:5)
- Use $request->attributes->set() for Middleware-to-Controller Communication (custom-middleware:5)
- Do Not Store Per-Request Data on Instance Properties (custom-middleware:5)

## Related Skills

- Apply the Cross-Cutting Boundary Test to New Middleware
- Test All Three Execution Paths of Custom Middleware

## Success Criteria

Middleware class with single concern, correct `handle()` signature, proper attribute usage, and no instance property state. Class name communicates the concern.

---

# Skill: Test All Three Execution Paths of Custom Middleware

## Purpose

Write direct unit tests for a custom middleware covering the pass-through path, every short-circuit path, and the modification path, ensuring complete behavioral coverage.

## When To Use

After implementing any custom middleware, before merging to the main branch. Mandatory for security middleware (auth, role checking, rate limiting).

## When NOT To Use

Middleware with a single pass-through path (e.g., request ID generation) needs only pass-through and modification assertion tests.

## Prerequisites

- PHPUnit or Pest testing framework
- Custom middleware class implemented with handle() method

## Inputs

- Middleware class
- List of conditions the middleware checks

## Workflow

1. Instantiate the middleware: `$middleware = new CheckRoleMiddleware()`
2. Create a request: `$request = Request::create('/path', 'GET')`
3. Set up the pass-through condition — call `$middleware->handle($request, fn ($req) => response('OK'))` and assert 200
4. For each short-circuit condition — set up the failing condition, call `handle()`, assert the expected status code (401, 403, 429, redirect)
5. For the modification path — assert that `$request->attributes` was set correctly, or that the response was modified
6. For parameterized middleware — repeat with each parameter variant including no-parameter default

## Validation Checklist

- [ ] Pass-through path tested (condition met, `$next` called)
- [ ] Every short-circuit path tested (each condition that returns without calling `$next`)
- [ ] Modification path tested (request or response modification is visible)
- [ ] Parameterized middleware tested with each parameter variant
- [ ] Security middleware has 100% branch coverage

## Common Failures

- Only testing the pass-through path — a guard middleware with broken blocking logic passes tests
- Using HTTP feature tests for all middleware tests — slow suite discourages comprehensive coverage
- Not testing with default parameter values — middleware crashes when parameter is omitted

## Decision Points

- Use direct unit tests (~0.5ms) for middleware logic; use feature tests (~30ms) only for pipeline integration
- Mock expensive dependencies (database, API calls) but create real requests with `Request::create()`

## Performance Considerations

Direct unit tests run in ~0.5ms vs ~30ms for feature tests. A suite of 50 middleware tests takes ~25ms as direct tests vs 1-5s as feature tests.

## Security Considerations

Security middleware must have 100% branch coverage. Every `if`, `else`, and exception path is a potential vulnerability. An untested short-circuit path in auth middleware is a security gap.

## Related Rules

- Test All Three Execution Paths of Every Middleware (custom-middleware:5)
- Prefer Direct Unit Tests Over HTTP Feature Tests for Middleware Logic (middleware-testing:5)
- Require 100% Branch Coverage for Security Middleware (middleware-testing:5)

## Related Skills

- Implement Custom Middleware with Single-Responsibility Pattern
- Test Parameterized Middleware with All Parameter Variants

## Success Criteria

Every middleware has passing tests for pass-through, all short-circuit paths, and modification assertions. Security middleware has 100% branch coverage. Test suite completes in under 100ms for all middleware tests.
