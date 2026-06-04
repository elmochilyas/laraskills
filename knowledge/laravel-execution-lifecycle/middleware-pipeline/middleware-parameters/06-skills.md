# Skill: Implement Parameterized Middleware

## Purpose
Create middleware that accepts colon-delimited parameters from route definitions, enabling reusable, configurable middleware behavior without hardcoding.

## When To Use
- Creating middleware that needs runtime configuration (guard names, throttle limits, role names)
- Making middleware reusable across routes with different configurations
- Replacing hardcoded values with route-level parameters

## When NOT To Use
- For complex configuration objects (use constructor injection instead)
- For sensitive data (secrets visible in route files and cache)
- For more than 3-4 parameters (becomes unreadable)
- When middleware is always called with the same parameters (hardcode inside middleware)

## Prerequisites
- Middleware class already created
- Route where the parameterized middleware will be used
- Alias registered for the middleware (if using aliases)

## Inputs
- Parameter names and types (all strings from route definition)
- Default values for optional parameters
- Parameter count (fixed or variadic)

## Workflow
1. Define the middleware `handle()` method signature with parameters after `$next`
2. Use variadic `...$params` for flexible parameter counts: `public function handle($request, $next, ...$params)`
3. Extract parameters with defaults: `$guard = $params[0] ?? 'web'`
4. Type-cast parameters at the top of `handle()`: `$maxAttempts = (int) ($params[0] ?? 60)`
5. Compare string parameters with `===` literal comparison, not truthy checks
6. Document parameter order and types in the docblock
7. Register the middleware alias in `bootstrap/app.php`
8. Use in route: `->middleware('role:admin,editor')` or `->middleware('throttle:60,1')`
9. Verify parameters reach the middleware by testing the route
10. Cache routes with `php artisan optimize` and verify cached parameters work

## Validation Checklist
- [ ] Parameters are documented with position, type, and purpose
- [ ] String comparisons use `===` not truthy/falsy checks
- [ ] Parameters are type-cast explicitly (int, bool) when needed
- [ ] Variadic parameters used for optional arguments
- [ ] No sensitive data passed as parameters
- [ ] Route cache serializes parsed parameters correctly
- [ ] Missing parameters have sensible defaults

## Common Failures
- Passing booleans as strings (`'true'` is string, not bool)
- Too few parameters causing `TypeError` (use variadic to avoid)
- Truthy check on string `"false"` (always truthy in PHP)
- Parameter order changes silently breaking routes
- Colon in namespace path conflicting with parameter syntax

## Decision Points
- Fixed or variadic parameters? -> Variadic if optional params, fixed if all required
- String parameter or type-cast? -> Type-cast to int/bool when used as such
- Colon-delimited or constructor injection? -> Simple scalars: colon; complex: constructor

## Performance Considerations
- Parameter parsing is a simple string split (~0.001ms per middleware)
- Route caching serializes parsed parameters (no per-request parsing)
- Varargs vs explicit parameters: varargs adds marginal overhead

## Security Considerations
- Parameters are visible in route files, cache, and version control
- Undefined aliases throw `InvalidArgumentException`
- String truthiness can cause logic errors (`'false'` is truthy in PHP)

## Related Rules
- Document the Parameter Order and Types in the Middleware Docblock
- Use Variadic Parameters for Optional Arguments
- Compare Parameter Values with String Literals, Not Truthy Checks
- Do Not Pass Sensitive Data as Middleware Parameters
- Limit Parameterized Middleware to 3-4 Parameters Maximum
- Type-Cast String Parameters Explicitly at the Top of `handle()`

## Related Skills
- Register and Use Middleware Aliases
- Assign Route Middleware Correctly
- Configure Middleware in Bootstrap

## Success Criteria
- Middleware accepts parameters from route definitions with `:` syntax
- Parameters are type-cast, documented, and validated
- Missing parameters use sensible defaults
- No sensitive data is passed through route-level parameters
- Route caching preserves parameterized middleware behavior
