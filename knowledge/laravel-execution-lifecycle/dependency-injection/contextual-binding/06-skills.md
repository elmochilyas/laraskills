# Skill: Apply Contextual Binding for Consumer-Specific Implementations

## Purpose
Use `when()->needs()->give()` to provide different implementations of the same interface — or different primitive values — to specific consumers, eliminating factory conditionals and adhering to the Open/Closed Principle.

## When To Use
- When different classes need different implementations of the same interface
- When injecting primitive configuration values that differ per consumer
- When a factory pattern with conditional logic would be the alternative
- When a class needs a specific implementation that differs from the application default

## When NOT To Use
- When all consumers should receive the same implementation — use a global `bind()` instead
- When the consumer is resolved outside the container (e.g., created with `new`)
- When the binding decision depends on runtime request data — use middleware or factory pattern
- When contextual binding would create hundreds of rules — architecture needs simplification

## Prerequisites
- Understanding of `Container::$contextual[$consumer][$abstract]` storage structure
- Knowledge of binding precedence: contextual → global bindings
- Familiarity with the fluent API: `when(Consumer)→needs(Abstract)→give(Concrete)`

## Inputs
- Consumer class that needs a specific implementation
- Abstract (interface or class name) that differs per consumer
- Concrete implementation or value for `give()`
- Alternative: primitive parameter name with `$` prefix for scalar binding

## Workflow
1. Identify consumers that need a different implementation than the global default
2. In the service provider's `register()` method, write: `$app->when(Consumer::class)->needs(Interface::class)->give(Concrete::class)`
3. For primitive values, use `needs('$paramName')->give(value)` with `$` prefix
4. Document the rationale — add a comment explaining why this consumer gets a different implementation
5. Register contextual bindings in `register()`, never in `boot()` (too late for already-resolved consumers)
6. For complex resolution logic, use a Closure in `give()` — but keep it simple
7. Verify the consumer is not resolved before the contextual binding is registered
8. Test that the consumer receives the expected implementation

## Validation Checklist
- [ ] All contextual bindings are registered in provider `register()` methods
- [ ] No consumer is resolved before its contextual bindings are registered
- [ ] Primitive bindings use the correct `$parameterName` syntax (with `$` prefix)
- [ ] Closure `give()` does not capture request-scoped state
- [ ] Contextual bindings are documented with rationale comments
- [ ] No runtime request data is used inside `give()` closures
- [ ] Contextual bindings count is under a reasonable threshold (< 50)

## Common Failures
| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Binding silently ignored | Contextual binding registered in `boot()` | Move to `register()` |
| Binding never matches | Wrong consumer class in `when()` | Use the actual concrete consumer class |
| Primitive binding ignored | Missing `$` prefix in `needs('paramName')` | Use `needs('$paramName')` with `$` prefix |
| Global binding used instead | Consumer resolved before contextual binding registered | Move binding to earlier provider or earlier in same provider |
| Contextual + singleton conflict | Consumer is singleton, binding added late | Register before first resolution of consumer |

## Decision Points
- **Contextual binding vs factory pattern**: Use contextual binding when the implementation decision is static and known at registration time; use factory pattern when it depends on runtime data
- **Global vs contextual binding**: Use global for the default implementation; use contextual only for consumers that deviate from the default
- **Closure vs class name in `give()`**: Use class name for simple substitution; use Closure for lightweight resolution logic

## Performance Considerations
- Contextual binding lookup: O(1) for consumer, O(n) for parameter match — negligible
- Storage: nested array in `$contextual` — checked on every `make()`
- Closure-based `give()` executes on every resolution — ensure closures are lightweight
- High count of contextual bindings adds negligible lookup overhead but impacts maintainability
- No caching — the `$contextual` array is traversed on every `make()`

## Security Considerations
- Contextual bindings for auth/guard services should be carefully reviewed
- Closure `give()` captures the container at registration time — no request data leakage unless specifically captured
- Primitive contextual bindings for secrets/keys should use `config()` not hardcoded values
- Excessive contextual bindings may obscure which implementation a consumer actually receives

## Related Rules
- Register Contextual Bindings in register(), Not boot()
- Use Contextual Binding Over Factory Pattern
- Use Contextual Binding to Inject Primitive Config Values
- Use the $ Prefix for Primitive Parameter Names
- Document Why a Contextual Binding Exists
- Avoid Contextual Binding Sprawl

## Related Skills
- Register Interface Bindings in Service Providers
- Alias Primitive Configuration Values via Contextual Binding

## Success Criteria
- Consumer-specific implementations are handled via declarative contextual bindings
- No conditional factory logic or `instanceof` checks exist for implementation selection
- All contextual bindings are registered in `register()` methods and documented
- Primitive bindings use correct `$` prefix syntax
- Contextual binding count is maintainable and architecturally justified
