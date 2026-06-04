# Skill: Break Circular Dependencies

## Purpose
Identify and resolve circular constructor dependencies (A → B → A) by applying structural patterns — factory injection, setter injection, or event-driven communication — without masking the cycle through binding type changes.

## When To Use
- When `CircularDependencyException` is thrown during resolution
- When designing services that have mutual dependency relationships
- When refactoring legacy code with tangled dependency graphs

## When NOT To Use
- When the issue is an auto-resolution failure (use Debug Auto-Resolution Failures)
- When the issue is a missing binding (use Resolve Services Correctly)
- Changing `singleton()` to mask a cycle temporarily

## Prerequisites
- Container Fundamentals
- Binding Resolution
- PHP constructor injection patterns

## Inputs
- `CircularDependencyException` message with build stack
- Constructor signatures of the services involved in the cycle
- Business logic relationship between the services

## Workflow
1. Read the `CircularDependencyException` build stack bottom-to-top to find the cycle point (first repeated abstract)
2. Identify the two services forming the cycle — these are the entry and return points
3. Choose a break pattern:
   - **Factory pattern**: Replace one direction with a factory that lazily resolves the dependency
   - **Setter injection**: Make one dependency nullable with a setter method for post-construction wiring
   - **Event-driven**: Replace direct method calls with events dispatched by one service and listened for by the other
4. Implement the chosen pattern — the reverse dependency (the one causing the cycle) is the one to break
5. Verify resolution succeeds: `$app->make(Services::class)` should not throw
6. Add integration test to confirm the break works under all resolution orders

## Validation Checklist
- [ ] Exception resolved — `make()` succeeds without `CircularDependencyException`
- [ ] Factory pattern: factory injected, not the cycle-causing dependency directly
- [ ] Setter injection: documented two-phase initialization contract
- [ ] Event-driven: no direct constructor dependency between the two services
- [ ] Test confirms resolution order independence (A→B→A and B→A→B both work)

## Common Failures
- Breaking the wrong edge of the cycle — fix may not resolve the fundamental architecture issue
- Factory captures the container and resolves outside of resolution order — can cause re-entry
- Setter injection without documentation creates hidden initialization contract
- Event-driven break introduces async complexity for synchronous workflows

## Decision Points
- Factory pattern: best when both services are legitimately needed at construction time but one can be deferred
- Setter injection: best when one service genuinely needs the other but can operate in a degraded state
- Event-driven: best when the circular relationship represents two-phase processing (trigger → respond)

## Performance Considerations
- Factory pattern adds one extra level of indirection — negligible (~1μs)
- Setter injection requires boot-time wiring code
- Event-driven adds event dispatch/listener overhead (~5-10μs)

## Security Considerations
- Circular dependencies can hide in authorization services — ensure break pattern doesn't bypass security checks
- Factory pattern with container access can resolve any service — limit factory scope

## Related Rules
- Break Circular Dependencies with the Factory Pattern
- Use Setter Injection for One Direction of a Cycle
- Use Event-Driven Communication to Eliminate Cycles
- Avoid Using Singletons to Mask Circular Dependencies

## Related Skills
- Detect Cycles via CI Testing
- Debug Auto-Resolution Failures
- Debug Resolution Chain Failures

## Success Criteria
- `CircularDependencyException` eliminated
- Dependency graph is acyclic
- Services testable independently
- No singletons used to mask the cycle

---

# Skill: Detect Cycles via CI Testing

## Purpose
Prevent circular dependency bugs from reaching production by writing automated tests that resolve every registered binding and catch `CircularDependencyException` at test time.

## When To Use
- Setting up CI pipeline for a new Laravel application
- After adding new service providers or bindings
- As part of a pre-commit hook or deployment gate
- When refactoring services with complex dependency graphs

## When NOT To Use
- During initial development where bindings are still in flux
- For applications with no custom bindings (only framework defaults)

## Prerequisites
- Container Fundamentals
- Binding Resolution
- PHPUnit test setup

## Inputs
- List of all registered abstract names: `$container->getBindings()`
- Exception handling for contextual bindings that require parameters

## Workflow
1. Create a new test class extending `TestCase` in `tests/Feature/ContainerTest.php`
2. Get all registered abstract names: `$abstracts = array_keys($this->app->getBindings())`
3. Iterate each abstract and call `$this->app->make($abstract)` inside a try-catch
4. Catch `CircularDependencyException` and fail the test with the build stack trace
5. Catch `BindingResolutionException` for abstracts requiring contextual parameters — skip with documentation
6. Run the test in CI: `phpunit tests/Feature/ContainerTest.php`
7. Document any skipped abstracts with reasons

## Validation Checklist
- [ ] All registered bindings iterated in the test
- [ ] `CircularDependencyException` causes test failure
- [ ] Contextual abstracts documented with skip reason
- [ ] Test runs as part of CI pipeline
- [ ] New bindings automatically included (no manual test maintenance)

## Common Failures
- Test tries to resolve abstracts requiring runtime parameters — causes `BindingResolutionException`
- Factory or deferred service providers haven't registered their bindings at test time
- Abstract is an alias that points to a non-instantiable binding

## Decision Points
- Skip vs fail on `BindingResolutionException`: skip only when the abstract requires contextual parameters and cannot be resolved in isolation
- Include core framework bindings vs only application bindings: include all to catch interaction issues

## Performance Considerations
- Test may resolve hundreds of bindings — expect ~50-500ms runtime
- Run in dedicated CI job to avoid slowing other tests
- Consider caching resolution results for repeat runs

## Security Considerations
- Test runs in CI, not production — no security implications
- Avoid resolving services with side effects (email sending, API calls) — mock those

## Related Rules
- Test All Registered Bindings for Circular Dependencies in CI
- Test All Aliases Resolve Correctly in CI

## Related Skills
- Break Circular Dependencies
- Read the Build Stack from Bottom to Top for Cycle Root Cause

## Success Criteria
- CI catches `CircularDependencyException` on every commit
- No cycle reaches production
- Zero false positives for contextual bindings
