# Skill: Implement Service Decoration via extend()

## Purpose
Add cross-cutting behavior (logging, caching, monitoring, retry logic) to existing container services without modifying their binding registration, by registering decorator extenders.

## When To Use
- Adding logging to an existing service without changing its class
- Wrapping API clients with retry or circuit-breaker logic
- Environment-specific behavior (e.g., query logging in debug mode)
- Package authors modifying framework services without altering registration
- Stacking multiple independent behaviors on a single service

## When NOT To Use
- Adding configuration or setup that applies on every resolution (use `resolving()` callbacks instead)
- Replacing the entire service implementation (use `bind()` or `singleton()` directly)
- Extending a service that has no registered binding (call `bind()` first)

## Prerequisites
- Container Fundamentals
- Binding Types
- Decorator Pattern knowledge

## Inputs
- Abstract name of the service to decorate
- Decorator class implementing the same interface
- Registration order desired (generic → specific)
- Optional: additional services needed by the decorator

## Workflow
1. Verify a binding exists for the abstract: `$app->bound(Abstract::class)`
2. If no binding exists, register one: `$app->bind(Abstract::class, Concrete::class)`
3. Create a decorator class implementing the same interface, wrapping the original via constructor
4. Register the extender: `$app->extend(Abstract::class, fn($instance, $app) => new Decorator($instance, $app->make(...)))`
5. For multiple extenders, register generic behavior first, specific last
6. Verify decoration works: `$result = $app->make(Abstract::class)` — confirm instance is wrapped

## Validation Checklist
- [ ] Target binding exists before `extend()` is called
- [ ] Decorator implements the same interface as the original
- [ ] Extender uses the passed instance parameter (not `$app->make()` on same abstract)
- [ ] Multiple extenders compose correctly (outer wraps inner)
- [ ] Decorated service passed through resolution callbacks unchanged

## Common Failures
- `BindingResolutionException` because `extend()` called without pre-existing binding
- Infinite recursion when extender calls `$app->make()` on the same abstract being extended
- Decorator stacking order wrong — specific behavior wrapped by generic (metrics wrap retries instead of vice versa)
- Instance returned from extender is wrong type — breaks type-hinted consumers

## Decision Points
- `extend()` vs `resolving()` callback: use `extend()` for wrapping/decoration, `resolving()` for property configuration
- Extender closure vs decorator class: use decorator class when logic is non-trivial or needs testing
- Ordering: generic cross-cutting first (monitoring, logging), specific business logic last

## Performance Considerations
- Extenders add zero registration-time cost — stored as closures, not executed
- Each extender adds ~80 bytes of closure storage
- Extender application loop is O(N) per resolution where N = extender count
- Stacking >10 extenders on one binding creates deep call stacks

## Security Considerations
- Audit third-party package extenders — they modify framework behavior at container level
- Extenders can replace the instance entirely, breaking type safety
- Avoid resolving sensitive services inside extender closures

## Related Rules
- Register the Target Binding Before Calling extend()
- Return a Decorator Instance, Not a Modification
- Order Extenders from Generic to Specific
- Avoid Making inside extend() on the Same Abstract

## Related Skills
- Configure Services at Resolution Time (resolving())
- React to Binding Re-registrations with rebinding()
- Select the Correct Binding Type

## Success Criteria
- Service is wrapped in decorator(s) without modifying original binding
- Extenders compose correctly in registration order
- No `BindingResolutionException` or infinite recursion at resolution time

---

# Skill: Debug Extender Ordering Conflicts

## Purpose
Diagnose and resolve conflicts when multiple packages or providers register extenders on the same binding, producing incorrect decoration chains.

## When To Use
- When a decorated service behaves differently than expected
- When adding a new extender changes behavior of existing extenders
- When third-party packages interact unexpectedly through decoration
- When monitoring, caching, or retry logic produce unexpected results

## When NOT To Use
- When the issue is a missing binding (use Implement Service Decoration first)
- When the issue is inside decorator class logic (unit test the decorator)

## Prerequisites
- Binding Extending knowledge
- Service Provider registration order understanding

## Inputs
- Abstract name being extended
- List of all extenders registered on the abstract
- Service provider boot order in `config/app.php`

## Workflow
1. List all extenders registered for the abstract: search `extend(Abstract::class` across all service providers
2. Identify the service provider registration order in `config/app.php` or `bootstrap/app.php`
3. Note that providers registered later have their extenders applied last (outermost wrapping)
4. For each extender, determine if it decorates (wraps) or mutates (modifies in-place)
5. If decorator: verify the call chain is correct — outermost extender runs last
6. If mutation: check that mutations are idempotent — later mutations don't undo earlier ones
7. Document the intended ordering and add comments to each provider's `extend()` call
8. Add integration test that verifies final decorated instance behavior

## Validation Checklist
- [ ] All extenders identified across all providers
- [ ] Registration order matches intended wrapping order (generic first, specific last)
- [ ] Mutator extenders are idempotent
- [ ] Integration test verifies final decorated behavior
- [ ] Documentation added for extender ordering expectations

## Common Failures
- Monitoring extender wraps caching extender — metrics record cached hits, not actual calls
- Later provider's extender behaves differently because an earlier extender changed the instance type
- Mutation-based extenders (non-decorator) lose earlier extender's work

## Decision Points
- If ordering is incorrect but providers cannot be reordered: refactor extenders to use decorator pattern instead of mutation
- If two packages conflict: contact maintainers about documented ordering, add workaround in application provider

## Performance Considerations
- Adding debug logging to extender entry/exit helps identify ordering
- Extender chains with 10+ levels can add measurable latency per resolution

## Security Considerations
- A malicious or buggy extender can replace the instance with an insecure implementation
- Verify extender type safety during integration testing

## Related Rules
- Order Extenders from Generic to Specific
- Document extender() Ordering Dependencies Between Packages
- Return a Decorator Instance, Not a Modification

## Related Skills
- Implement Service Decoration via extend()
- Understand Resolution Callback Execution Order for Debugging

## Success Criteria
- Extender order documented and verified
- Integration test confirms correct decoration chain
- No unexpected behavior from extender interactions
