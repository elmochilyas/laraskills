# Skill: Group Service Implementations with Tagged Bindings

## Purpose
Use `$app->tag()` to group multiple service implementations under a tag name and resolve them together via `$app->tagged()`, enabling strategy patterns, handler pipelines, and plugin-style architectures.

## When To Use
- When multiple implementations of an interface should be collected and executed in sequence
- For strategy pattern implementations — gather all available strategies
- When a class needs a variable number of implementations injected as an array
- For plugin architectures where packages register implementations under a shared tag

## When NOT To Use
- When you know the exact number of implementations — use explicit constructor injection instead
- When implementations have strict configurable execution order — use explicit pipeline pattern
- When the tagged collection is used in only one place — consider a dedicated aggregator class
- When only one implementation exists — tagging "for future flexibility" adds unnecessary indirection

## Prerequisites
- Understanding of `Container::$tags[$tag]` storage structure (`[$abstract1, $abstract2, ...]`)
- Knowledge of variadic constructor injection with type-hints: `__construct(Handler ...$handlers)`
- Familiarity with `tag()` and `tagged()` methods on the container

## Inputs
- Tag name (descriptive, namespace-prefixed to avoid collisions)
- Array of abstract names (service IDs or class names) to group
- Consumer class that uses variadic injection or `tagged()` to receive the group

## Workflow
1. Identify multiple implementations that serve a common role (handlers, strategies, formatters, pipelines)
2. Choose a descriptive, namespace-prefixed tag name (e.g., `'payment.gateways'`)
3. Register individual bindings for each implementation in service provider `register()`
4. Tag them in the same provider: `$app->tag([Abstract1, Abstract2], 'tag.name')`
5. In the consumer class, use variadic constructor injection: `__construct(HandlerInterface ...$handlers)`
6. Or resolve manually: `$handlers = $app->tagged('tag.name')`
7. Verify each tagged implementation implements the expected interface (type safety)
8. Ensure singleton-tagged services are stateless (shared instances)
9. Test that `tagged()` returns all expected implementations in registration order

## Validation Checklist
- [ ] Tags are registered in provider `register()` methods (not at runtime)
- [ ] Tagged implementations implement a common interface (type-hinted in consumer)
- [ ] Tag names are descriptive and namespace-prefixed to avoid collisions
- [ ] No runtime tag registration occurs (tags are static bootstrap-time configuration)
- [ ] Singleton tagged services are stateless
- [ ] `tagged()` resolves all expected implementations in correct order
- [ ] No tags exist for single-implementation scenarios

## Common Failures
| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| `BindingResolutionException` on `tagged()` | Tag references non-existent or unbound abstract | Verify abstract exists and is resolvable |
| Tagged implementations in wrong order | Assumed order not matching registration order | Document order or use explicit priority mechanism |
| Runtime type error on tagged service | Tagged service doesn't implement expected interface | Validate implementations match expected interface |
| Tag collision across packages | Two packages use same generic tag name ('handlers') | Prefix tag with vendor/package namespace |
| Singleton state corruption | Singleton tagged service mutated between calls | Ensure tagged singletons are stateless |

## Decision Points
- **Tagged bindings vs explicit array injection**: Use tags when implementations are registered by different providers or packages; use explicit injection when all implementations are known in one place
- **Variadic injection vs manual `tagged()`**: Use variadic for cleaner constructor-based consumption; use manual `tagged()` when the collection is resolved at an arbitrary point in the lifecycle
- **Single vs multiple tags per abstract**: An abstract can be under multiple tags — use when a service serves multiple roles

## Performance Considerations
- `tagged()` calls `make()` for each tagged binding — 5 tags = 5 resolutions
- Lazy resolution — tagged services are not resolved until `tagged()` is called
- Variadic injection resolves all tagged implementations at class construction time
- Singleton tags amortize resolution cost — subsequent `tagged()` calls return cached instances
- Registration order determines resolution order — no priority sorting mechanism

## Security Considerations
- Tagged bindings resolve all registered implementations — ensure untrusted code cannot register under app tags
- Package tags may conflict — use vendor-prefixed tag names (e.g., `'spatie.media.conversions'`)
- No type enforcement at tag level — validate implementations in consumption code
- Runtime tag registration should be prevented — tags must be static bootstrap-time

## Related Rules
- Tag Bindings in the Same Provider as the Binding
- Use Descriptive, Namespace-Prefixed Tag Names
- Combine Tagged Bindings with Variadic Constructor Injection
- Do Not Register Tags at Runtime
- Validate Tagged Implementations Implement the Expected Interface
- Avoid Over-Tagging — Only Tag When Multiple Implementations Exist

## Related Skills
- Register Interface Bindings in Service Providers
- Apply Constructor Injection for Explicit Dependencies

## Success Criteria
- Multiple implementations of an interface are collected via tags, not manual arrays
- Tag names are descriptive and namespace-prefixed to prevent collisions
- Tags are registered in the same provider as the individual bindings
- Consumer uses type-safe variadic injection for tagged services
- No runtime tag registration occurs
- Only multi-implementation scenarios use tags
