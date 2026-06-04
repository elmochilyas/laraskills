# Skill: Alias Primitive Configuration Values via Contextual Binding

## Purpose
Bind scalar values (strings, ints, arrays) to named constructor parameters using contextual binding, enabling injection of specific configuration values without coupling classes to the entire `Config` repository.

## When To Use
- When a class needs specific configuration values (API keys, timeouts, URLs, feature flags)
- Instead of injecting the entire `Config` repository or using `config()` inside the class
- When testing — swap primitive values via `instance()` or contextual binding
- When a primitive parameter value differs per consumer

## When NOT To Use
- When the value is truly constant across the application — use a class constant or default instead
- When a class needs 10+ primitive bindings — the class likely needs architectural refactoring
- When the primitive value changes per request — use middleware to inject request-scoped values
- For values that should be computed at runtime — use a Closure binding or factory

## Prerequisites
- Understanding of contextual binding mechanism: `when()->needs('$paramName')->give(value)`
- Knowledge of the `$` prefix requirement for primitive parameter names
- Familiarity with `Container::build()` parameter loop and how it checks for primitive bindings

## Inputs
- Consumer class name
- Constructor parameter name (with `$` prefix)
- Value to inject (scalar, array, or Closure returning the value)

## Workflow
1. Identify constructor parameters that receive scalar configuration values (string, int, array, bool)
2. For each primitive parameter, decide: use a default value, a contextual binding, or both
3. In the provider's `register()` method, write: `$app->when(Consumer::class)->needs('$paramName')->give(value)`
4. Always use the `$` prefix in `needs('$paramName')` — this is required syntax
5. Use `config()` in `give()` for sensitive values: `give(config('services.stripe.secret'))`
6. Ensure the type of the value in `give()` matches the constructor parameter's declared type
7. Keep primitive bindings per class to 3 or fewer — consider a configuration DTO for more
8. Document the binding with a comment explaining what the value is
9. Test that the consumer receives the correct primitive value

## Validation Checklist
- [ ] All primitive bindings use the `$` prefix in `needs('$paramName')`
- [ ] No hardcoded secrets in `give()` — use `config()` instead
- [ ] Parameter names are stable and documented
- [ ] Default values exist as fallback when no binding is provided
- [ ] Primitive bindings are registered in provider `register()` methods
- [ ] The type of `give()` value matches the constructor parameter type
- [ ] Fewer than 4 primitive bindings per class

## Common Failures
| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Binding silently ignored | Missing `$` prefix in `needs('paramName')` | Use `needs('$paramName')` with `$` prefix |
| Wrong value type injected | `give('string')` for `int $timeout` | Match value type to parameter type |
| Secret exposed in codebase | Hardcoded value in `give('sk_...')` | Replace with `give(config('services.key'))` |
| Value not resolved | Parameter name changed but binding not updated | Keep parameter names stable or use DTO |
| Too many primitive bindings | Class needs 4+ config values | Extract into a configuration DTO |

## Decision Points
- **Default value vs contextual binding**: Use `= null` defaults for simple fallbacks; use contextual binding when different consumers need different values
- **Config DTO vs individual bindings**: Use individual bindings for 1-3 values; use a typed configuration DTO for 4+ related values
- **`config()` vs hardcoded value**: Always use `config()` for environment-dependent values; hardcoded only for truly constant defaults (timeouts, page sizes)

## Performance Considerations
- Primitive binding lookup is part of contextual binding lookup — O(n) on contextual bindings for that consumer
- The given value is passed directly — no serialization, no additional resolution
- Closure-based `give()` executes on every consumer resolution — keep Closures simple
- No caching — the primitive value is fetched from the binding array on each `make()`

## Security Considerations
- API keys and secrets bound as primitives are stored in the container's binding array — protect container access
- Always use `config()` to reference environment variables rather than hardcoding values in `give()`
- Primitive bindings are set at registration time — they don't change between resolutions
- Ensure `give()` values don't expose sensitive configuration to unauthorized consumers

## Related Rules
- Always Use the $ Prefix for Primitive Parameter Bindings
- Use config() in give() — Never Hardcode Values
- Prefer Specific Primitive Bindings Over Injecting Entire Config
- Use Primitive Bindings for Values That Differ Per Consumer
- Limit Primitive Bindings per Class to 3 or Fewer
- Ensure give() Value Types Match Parameter Types

## Related Skills
- Apply Contextual Binding for Consumer-Specific Implementations
- Register Interface Bindings in Service Providers

## Success Criteria
- Configuration values are injected as typed constructor parameters, not via `Config` repository
- All primitive bindings use correct `$` prefix syntax
- Sensitive values come from `config()` — no hardcoded secrets in providers
- Fewer than 4 primitive bindings per class (DTO used beyond that)
- Type safety maintained between `give()` value and constructor parameter declaration
