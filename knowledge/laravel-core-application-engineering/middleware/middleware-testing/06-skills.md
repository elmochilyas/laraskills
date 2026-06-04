# Skill: Write Direct Unit Tests for Middleware Covering All Three Paths

## Purpose

Create fast, isolated unit tests for a middleware class by calling `handle()` directly with a stub `$next` closure, covering the pass-through, short-circuit, and modification paths.

## When To Use

When testing any custom middleware, especially security middleware requiring 100% branch coverage. Preferred over HTTP feature tests for middleware logic.

## When NOT To Use

Middleware that relies heavily on session state, authentication state, or framework services (CSRF, rate limiting) may be more practically tested via feature tests.

## Prerequisites

- PHPUnit or Pest testing framework
- Middleware class implemented with handle() method

## Inputs

- Middleware class
- List of conditions and expected responses

## Workflow

1. Instantiate the middleware: `$middleware = new MiddlewareClass()`
2. Create a request: `$request = Request::create('/path', 'METHOD', [params], [cookies], [files], [server], [content])`
3. For the pass-through path: set up the condition that meets the middleware's requirements, call `$middleware->handle($request, fn ($req) => response('OK'))`, assert 200 status code
4. For each short-circuit path: set up the failing condition, call `handle()`, assert the expected status code (401, 403, 429, redirect) and content
5. For the modification path: call `handle()`, assert that `$request->attributes` was modified or the response has the expected headers
6. Test with and without optional parameters (for parameterized middleware)
7. Assert the expected response status and optionally the response content or headers

## Validation Checklist

- [ ] Pass-through path test asserts 200 and calls `$next`
- [ ] Every short-circuit condition has its own test method
- [ ] Modification assertions verify request attributes or response headers
- [ ] All test methods complete in under 1ms each
- [ ] No HTTP feature tests used for pure middleware logic
- [ ] Security middleware has 100% branch coverage

## Common Failures

- Only testing the pass-through path — gating middleware is defined by its blocking behavior
- Using `$this->get('/route')` feature tests for every middleware test — adds 30ms+ per test
- Not setting up `$request->setUserResolver()` for auth-related middleware tests
- Forgetting to test the default parameter path when middleware has optional parameters

## Decision Points

- For middleware that calls external services, mock the service via constructor injection
- For middleware that modifies `$request`, use `$request->attributes->get('key')` assertions after calling `handle()`

## Performance Considerations

Direct unit tests run in ~0.5ms vs ~30ms for feature tests. A suite of 50 middleware direct tests completes in ~25ms.

## Security Considerations

The short-circuit path is often the security-critical path. Test every blocking condition thoroughly — a bug in the blocking logic is a security vulnerability.

## Related Rules

- Prefer Direct Unit Tests Over HTTP Feature Tests for Middleware Logic (middleware-testing:5)
- Test All Three Middleware Paths: Pass-Through, Short-Circuit, and Modification (middleware-testing:5)
- Require 100% Branch Coverage for Security Middleware (middleware-testing:5)
- Test Parameterized Middleware with Each Parameter Variant (middleware-testing:5)

## Related Skills

- Test Terminable Middleware by Calling terminate() Directly
- Test All Three Execution Paths of Custom Middleware

## Success Criteria

Every middleware has direct unit tests covering pass-through, every short-circuit condition, and modification assertions. Test suite is fast (<100ms for all middleware). Security middleware has 100% branch coverage.

---

# Skill: Test Terminable Middleware by Calling terminate() Directly

## Purpose

Verify terminable middleware behavior by calling `terminate(Request, Response)` directly in unit tests, ensuring the termination logic executes correctly before deployment.

## When To Use

After implementing any terminable middleware, before merging. Required for middleware that logs, records metrics, or performs cleanup in `terminate()`.

## When NOT To Use

Terminable middleware that is a pure no-op with no side effects requires no terminate-specific tests.

## Prerequisites

- Terminable middleware class with `terminate()` method
- Knowledge of whether singleton registration is needed

## Inputs

- Middleware class
- Expected side effects of `terminate()`

## Workflow

1. Instantiate the middleware (via container if singleton: `$this->app->make(MiddlewareClass::class)`)
2. Call `$middleware->handle($request, fn ($req) => response('OK'))` if the middleware stores state during handle
3. Create a test request and response: `$request = Request::create('/test', 'GET')` and `$response = response('OK')`
4. Call `$middleware->terminate($request, $response)` directly
5. Assert on the expected side effects — log assertions, mock verifications, or database assertions
6. Also write a feature test to verify the middleware is registered and the pipeline processes it correctly

## Validation Checklist

- [ ] `terminate()` is called directly in a unit test — not only through feature tests
- [ ] If singleton registration is required, the test verifies state sharing between `handle()` and `terminate()`
- [ ] Side effects (logs, metrics, cleanup) are asserted in the test
- [ ] Feature test exists to verify the middleware is registered

## Common Failures

- Assuming HTTP feature tests exercise `terminate()` — they do not call `Kernel::terminate()`
- Not verifying singleton registration — `terminate()` silently fails with null state
- Testing `terminate()` without calling `handle()` first — does not test the full lifecycle

## Decision Points

- If the middleware reads all data from `$request` and `$response` parameters only, singleton registration is not needed
- If the middleware stores data on `$this` during `handle()`, singleton registration IS required — test this explicitly

## Performance Considerations

Direct `terminate()` tests run in ~0.5ms. No HTTP request overhead.

## Security Considerations

Terminable middleware that logs request data must not write sensitive information (passwords, tokens) to logs. Test that sensitive data is filtered in `terminate()`.

## Related Rules

- Test Terminable Middleware by Calling terminate() Directly (middleware-testing:5)
- Test Terminable Middleware by Calling terminate() Directly (terminable-middleware:5)
- Register Terminable Middleware as Singleton When State Sharing Is Needed (terminable-middleware:5)

## Related Skills

- Write Direct Unit Tests for Middleware Covering All Three Paths
- Implement Terminable Middleware with Singleton and Cleanup

## Success Criteria

`terminate()` is tested directly with assertions on side effects. Singleton registration is verified if state sharing is required. No feature test is relied upon for termination coverage.
