# Skill: Configure Contextual Bindings for Specialized Injection

## Purpose
Register contextual bindings using `$app->when()->needs()->give()` to inject different implementations or values into specific consumers, while ensuring the bindings are registered early enough to take effect.

## When To Use
- Different consumers of the same interface need different implementations
- A constructor parameter (primitive or service) varies per consumer
- A class needs a specific implementation that differs from the default binding
- Testing or replacing dependencies for specific consumers without affecting global bindings

## When NOT To Use
- When all consumers should receive the same implementation — use a global `bind()` instead
- When the consumer class is never resolved by the container (new'd manually or created by factory)
- When the contextual binding would create a circular dependency chain
- For runtime-variable dependencies that change per request — use middleware or request-scoped singletons
- As a substitute for a poorly designed interface that should be split into separate interfaces

## Prerequisites
- Understanding of the container's binding resolution mechanism
- Knowledge of the register-then-boot lifecycle phases
- Familiarity with the consumer class constructor signature

## Inputs
- Consumer class (the class that receives the specialized dependency)
- Abstract type or parameter name that needs specialization
- Concrete implementation or value to inject

## Workflow
1. Identify the consumer class — this is the class whose constructor receives the specialized dependency
2. Identify the abstract — this is the type-hinted interface/class or `$parameterName` in the constructor
3. Register the contextual binding in the provider's `register()` method — never in `boot()`
4. Use `$this->app->when(Consumer::class)->needs(Abstract::class)->give(Concrete::class)`
5. For primitive values, use `needs('$parameterName')->give($value)` with `$` prefix on the parameter name
6. Register the binding in the same provider as the consumer class for co-location
7. If the consumer is a singleton, register the contextual binding before any resolution of that singleton
8. Add a comment explaining why this consumer gets a different implementation

## Validation Checklist
- [ ] Contextual binding is registered in `register()`, not `boot()`
- [ ] Consumer class name is correct (the concrete class, not the interface it implements)
- [ ] Primitive parameter names use `$` prefix (e.g., `'$apiKey'`)
- [ ] Singleton consumers have their contextual bindings registered before any resolution
- [ ] Comment explains why the consumer needs specialization
- [ ] No consumer is resolved before its contextual bindings are registered
- [ ] Closure-based `give()` does not capture request-scoped state

## Common Failures
- Registering in `boot()` after the consumer has already been resolved — binding silently has no effect
- Using `when(Interface::class)` instead of `when(ConcreteConsumer::class)` — wrong consumer means wrong binding
- Contextual binding on a singleton consumer after it was already resolved — cached instance uses default
- Missing `$` prefix on primitive parameter name — container cannot match the parameter
- Contextual binding for a class created with `new` — the container never resolves it

## Decision Points
- Use primitive binding (`needs('$apiKey')->give(config(...))`) instead of injecting config objects — keeps consumers clean
- If multiple consumers share the same specialization, consider a global binding with a named context
- If a consumer needs different implementations in different environments, bind a closure that checks the environment

## Performance Considerations
- Contextual binding lookup is O(n) on the number of bindings per consumer — negligible for <100 entries
- Closure-based `give()` executes on every resolution of the consumer — keep closures lightweight
- There is no caching for contextual binding resolution — the lookup runs on every `make()` call
- Overuse (hundreds of contextual bindings) adds measurable overhead to container resolution

## Security Considerations
- Contextual bindings for auth/guard services must be careful — ensure consumers get the correct guard
- Do not use Closures in `give()` that capture secrets or request data — they persist in the container
- Contextual binding overrides global bindings — document the override intent to prevent security surprises

## Related Rules
- Contextual Binding Timing Rule 1: Register Contextual Bindings in register() Only
- Contextual Binding Timing Rule 2: Use Primitive Contextual Binding for Named Parameters
- Contextual Binding Timing Rule 6: Avoid Contextual Binding for Singleton Consumers

## Related Skills
- Separate Service Registration from Initialization (ku-01-register-vs-boot)
- Order Service Providers by Dependency (ku-02-provider-registration-order)

## Success Criteria
- Each consumer receives the correct specialized implementation
- No contextual binding is registered after the consumer has been resolved
- Primitive parameters are injected via `needs('$paramName')` where appropriate
- Every contextual binding has a documented reason for the specialization
- No consumer uses `new` keyword to bypass container injection
