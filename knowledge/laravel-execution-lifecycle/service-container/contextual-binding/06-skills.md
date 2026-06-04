# Skill: Implement Contextual Binding for Interface Variation

## Purpose
Use `when()->needs()->give()` to provide different implementations of the same interface to different consumers, eliminating conditional wiring logic and factory methods.

## When To Use
- Different controllers need different implementations of the same interface
- Testing — override a dependency for a specific consumer without affecting others
- Multi-tenant applications requiring different service configurations per consumer
- Replacing factory methods that use `if` statements to select implementations

## When NOT To Use
- When all consumers need the same implementation (use standard `bind()`)
- When the binding decision depends on runtime request data (use middleware + scoped binding)
- When more than 3 consumers need unique implementations — consider separate interfaces
- When the interface can be split into distinct contracts

## Prerequisites
- Container Fundamentals
- Binding Types
- Binding Resolution

## Inputs
- Consumer class name (the class receiving the dependency)
- Abstract/interface name the consumer type-hints
- Desired concrete implementation for that consumer
- Optional: primitive parameter name and value (with `$` prefix)

## Workflow
1. Identify the consumer class and the interface it type-hints in its constructor
2. Register the contextual binding: `$this->app->when(Consumer::class)->needs(Interface::class)->give(Concrete::class)`
3. For primitive parameters, use `$` prefix: `->needs('$parameterName')->give($value)`
4. For closure-based resolution: `->give(function ($app) { return $app->make(...); })`
5. Verify: `$consumer = $this->app->make(Consumer::class)` and inspect injected dependency type
6. Write a test that resolves the consumer and asserts the correct implementation is injected

## Validation Checklist
- [ ] Consumer class name in `when()` is correct (no typos)
- [ ] Abstract in `needs()` is the type-hinted interface, not the concrete class
- [ ] Primitives use `$` prefix in `needs()`
- [ ] Cached singletons do not interfere with contextual resolution (use `bind()` not `singleton()` for varied abstracts)
- [ ] Test confirms correct implementation injected per consumer

## Common Failures
- Typo in consumer class name — contextual rule silently ignored, default implementation used
- Missing `$` prefix for primitives — contextual binding never matches
- Singleton cached instance returned regardless of context — use `bind()` instead of `singleton()`
- Contextual binding for runtime request data — consumer-based, not request-based

## Decision Points
- Contextual binding vs separate interfaces: use contextual binding for 2-3 consumers with the same contract; use separate interfaces for more
- Concrete class vs closure in `give()`: use closure when the implementation needs its own dependencies configured

## Performance Considerations
- Contextual lookup is O(1) — negligible overhead
- `$needsContextualBuild` flag adds a boolean check per resolution step
- Storage is O(C × A) with typical usage under ~2KB

## Security Considerations
- Contextual binding can override security interface implementations per consumer — verify substitution doesn't bypass authorization
- Primitive contextual binding via `give()` can inject sensitive config values

## Related Rules
- Understand That Cached Singletons Bypass Contextual Binding
- Use $ Prefix for Primitive Parameter Contextual Binding
- Do Not Use Contextual Binding for Runtime Request Data
- Avoid Overusing Contextual Binding — Consider Separate Interfaces

## Related Skills
- Test Contextual Binding Correctness
- Select the Correct Binding Type
- Configure the Service Container

## Success Criteria
- Each consumer receives the context-appropriate implementation
- No conditional logic in consumers to select implementations
- Tests confirm correct binding per consumer
- All tests pass without container bootstrapping outside of Laravel's test framework

---

# Skill: Test Contextual Binding Correctness

## Purpose
Verify that contextual bindings resolve to the correct concrete implementations per consumer, detecting silent failures from typos, incorrect abstract names, or singleton cache interference.

## When To Use
- After registering new contextual bindings
- After refactoring consumer class names or namespaces
- When debugging "wrong implementation" issues in production
- As part of CI test suite for all contextual bindings

## When NOT To Use
- When no contextual bindings exist in the application
- When testing standard (non-contextual) bindings — use standard resolution tests

## Prerequisites
- Contextual Binding
- PHPUnit or similar test framework

## Inputs
- List of all contextual binding registrations
- Consumer class names and their expected dependencies
- Reflection access to inspect injected dependencies

## Workflow
1. For each contextual binding, create a test method that resolves the consumer
2. Use reflection to access the injected dependency property
3. Assert the property is an instance of the expected concrete class
4. For primitive contextual bindings, assert the property has the expected value
5. Run all contextual binding tests together to catch cross-consumer interference
6. Add test for singleton vs contextual interaction — verify cached singletons don't bypass context

## Validation Checklist
- [ ] Every contextual binding has a corresponding test
- [ ] Test reflects into the consumer and asserts concrete type
- [ ] Primitive contextual binding tests assert correct value
- [ ] Cross-consumer test verifies each consumer gets its own implementation
- [ ] CI runs all contextual binding tests

## Common Failures
- Test passes with default implementation because contextual rule has typo and is never applied
- Reflection property name changes after refactoring — test must be updated
- Singleton cached from an earlier test returns wrong instance for contextual test

## Decision Points
- Reflection-based assertion vs `assertInstanceOf` on public method return: prefer reflection when dependency is private and no accessor exists
- One test per consumer vs one test per contextual rule: one test per consumer scales better with multiple rules per consumer

## Performance Considerations
- Each test resolves one consumer — negligible overhead
- With 50 contextual bindings, test suite adds ~1-2 seconds
- Run in dedicated test suite or combine into single test method for speed

## Security Considerations
- Tests run in local/CI environment, not production — no security concerns
- Avoid testing with real credentials or secrets in contextual primitive bindings

## Related Rules
- Test Contextual Bindings Explicitly
- Understand That Cached Singletons Bypass Contextual Binding

## Related Skills
- Implement Contextual Binding for Interface Variation
- Debug Resolution Chain Failures

## Success Criteria
- All contextual bindings tested with consumer resolution
- Typos in consumer names or abstract names detected in CI
- Singleton caching behavior explicitly covered in tests
