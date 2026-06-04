# Skill: Implement Parameterized Middleware with Defaults and Validation

## Purpose

Create a middleware class that accepts colon-delimited parameters from route definitions, with proper default values for optional parameters and early validation of accepted values.

## When To Use

When a middleware class needs to serve multiple configurations (guard names, rate limits, roles, permissions) across different routes, using the `middlewareName:param1,param2` syntax.

## When NOT To Use

When the configuration depends on runtime state (user tier, subscription) — use named limiters or dynamic configuration instead. When the middleware logic differs fundamentally per configuration — create separate middleware classes.

## Prerequisites

- Understanding of the colon-delimited parameter extraction mechanism
- Knowledge of the handle() contract with additional arguments

## Inputs

- Parameter names and their accepted values
- Default behavior when no parameters are provided

## Workflow

1. Declare parameters as additional arguments after `$request` and `$next` in the `handle()` signature
2. For optional parameters, provide default values: `string $guard = null` or `string $guard = config('auth.defaults.guard')`
3. For multiple values of the same kind, use variadic parameters: `string ...$roles`
4. Validate parameters early in `handle()` — check against a whitelist of accepted values
5. Throw `InvalidArgumentException` with a clear message for invalid parameters
6. Document the parameter syntax, accepted values, and default behavior in the class docblock
7. For rate limits that vary by user tier, register named limiters instead of using numeric parameters

## Validation Checklist

- [ ] Optional parameters have default values — no `TypeError` when parameter is omitted
- [ ] Parameters are validated at the start of `handle()` against a whitelist
- [ ] Invalid parameters throw `InvalidArgumentException` with a descriptive message
- [ ] Variadic parameters (`string ...$values`) used for multiple values of the same kind
- [ ] Parameter syntax documented in the class docblock
- [ ] No commas in individual parameter values (use semicolons as internal delimiter)

## Common Failures

- No default value for optional parameter — `TypeError: too few arguments` when used without parameter
- No parameter validation — invalid guard name silently skips authentication
- Single string parameter with manual `explode(',')` instead of variadic — redundant and inconsistent with framework conventions
- Comma in a parameter value — Pipeline splits on commas, creating extra parameters

## Decision Points

- For multiple values of the same kind (roles, guards), use `string ...$values` variadic parameter
- For structured single values (cache headers), accept a single string and parse it manually
- For user-tier-based limits, use named limiters (`RateLimiter::for()`) instead of numeric parameters

## Performance Considerations

Parameter extraction adds ~0.001ms per middleware. Variadic parameters create a ~0.001ms array allocation. Named limiter resolution adds ~0.01ms. All are negligible.

## Security Considerations

Validate all parameters against a whitelist. An invalid guard name passed as a parameter could bypass authentication. Route caching stores parameter values — ensure they are not environment-specific.

## Related Rules

- Always Provide Default Values for Optional Middleware Parameters (parameterized-middleware:5)
- Validate Middleware Parameters Early in handle() (parameterized-middleware:5)
- Use Named Limiters Instead of Numeric Parameters for Dynamic Rate Limits (parameterized-middleware:5)
- Avoid Commas in Parameter Values (parameterized-middleware:5)
- Use Variadic Parameters for Multiple Values Instead of Single Comma-Separated Parameters (parameterized-middleware:5)

## Related Skills

- Test Parameterized Middleware with All Parameter Variants
- Implement Custom Middleware with Single-Responsibility Pattern

## Success Criteria

Middleware correctly extracts parameters from colon-delimited syntax, provides defaults for optional parameters, validates accepted values early, and uses variadic parameters for multiple values.

---

# Skill: Test Parameterized Middleware with All Parameter Variants

## Purpose

Write tests for a parameterized middleware covering every supported parameter configuration including the no-parameter default, ensuring all configuration paths work correctly.

## When To Use

After implementing a parameterized middleware, before merging. Required when the middleware accepts 2+ distinct parameter configurations.

## When NOT To Use

Parameterized middleware with a single configuration that varies only in external resolver (named limiters) — test the named configuration, not every underlying value.

## Prerequisites

- Parameterized middleware class with handle() accepting additional arguments
- List of all supported parameter configurations

## Inputs

- Middleware class
- Supported parameter values and expected behavior for each

## Workflow

1. Write a test for the default path (no parameters provided) — assert the middleware uses the expected default value
2. Write a test for each distinct parameter value — pass parameters as additional arguments to `handle()`
3. For variadic parameters, test with 1 value, 2 values, and N values
4. Write a test for invalid parameter values — assert the middleware throws `InvalidArgumentException`
5. Test both pass-through and short-circuit paths for each parameter variant where behavior differs
6. Use direct unit tests (`$middleware->handle($request, $next, 'param1', 'param2')`) — not HTTP feature tests

## Validation Checklist

- [ ] Default path (no parameters) is tested
- [ ] Every supported parameter value has at least one test
- [ ] Variadic parameters tested with 1, 2, and N values
- [ ] Invalid parameter values tested — assert exception thrown
- [ ] Pass-through and short-circuit tested for each variant where behavior differs

## Common Failures

- Only testing with parameters provided — the default path (no parameters) crashes with missing argument error
- Only testing one parameter variant — other valid values are never verified
- Not testing invalid parameters — a typo in a route definition silently bypasses the middleware
- Testing only the pass-through path for each variant — short-circuit behavior differs per variant

## Decision Points

- For guard selection middleware, test each guard name and assert the correct guard is used
- For rate limiting middleware, test each rate limit value and assert the correct limit is applied
- For role checking middleware, test each role and combinations via variadic arguments

## Performance Considerations

Each direct unit test runs in ~0.5ms. 10 parameter variants take ~5ms total to test.

## Security Considerations

Invalid parameters can bypass security checks. Testing the validation path ensures typos in route definitions produce errors instead of silently skipping protection.

## Related Rules

- Test Parameterized Middleware with Each Parameter Variant (middleware-testing:5)

## Related Skills

- Implement Parameterized Middleware with Defaults and Validation
- Write Direct Unit Tests for Middleware Covering All Three Paths

## Success Criteria

Every parameter variant has a passing test. Default path, all valid values, and invalid values are tested. Pass-through and short-circuit paths are covered for each variant.
