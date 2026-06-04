# Skill: Group and Resolve Services via Tags

## Purpose
Use `$app->tag()` and `$app->tagged()` to group multiple service bindings under a common tag name for batch resolution, eliminating manual service collection registries.

## When To Use
- Collecting multiple implementations of the same interface for sequential processing
- Batch registration of event listeners, commands, or middleware from multiple providers
- Pipeline or Chain of Responsibility patterns where all handlers of a type must be processed
- Reporting scenarios requiring iteration across all services of a category

## When NOT To Use
- When a single service instance is needed (use standard `bind()` or `make()`)
- When services need eager resolution at registration time
- When tag membership needs to be dynamic at runtime (tags are static — defined at registration)
- When you need to differentiate 50+ services — consider a dedicated registry class

## Prerequisites
- Container Fundamentals
- Binding Types
- Binding Resolution

## Inputs
- List of abstract names to group
- Tag name (string identifier)
- Consumer code that will iterate tagged services

## Workflow
1. Register bindings for each abstract: `$app->bind(Interface::class, Concrete::class)`
2. Tag them: `$app->tag([Interface::class], 'tag.name')` — tag interfaces, not concrete classes
3. Use descriptive, namespaced tag names to prevent collisions: `'reports.export.handlers'`
4. In consumer code, resolve lazily: `$services = $this->app->tagged('tag.name')`
5. Iterate the collection — services resolve lazily on first access
6. Cache the collection if iterating multiple times: `$services = $this->app->tagged('tag.name')`

## Validation Checklist
- [ ] Bindings registered before tagging
- [ ] Interfaces tagged, not concrete classes
- [ ] Tag name is descriptive and namespaced
- [ ] Tagged collection iterated lazily (not converted to array eagerly)
- [ ] Collection cached in local variable if iterated multiple times
- [ ] Services resolve correctly on first iteration access

## Common Failures
- Tagging unregistered interfaces — `tagged()` returns empty collection
- Eager conversion to array — defeats lazy resolution benefit
- Iterating `tagged()` twice creates two resolution passes
- Generic tag name collides with another package's tag
- Concrete classes tagged instead of interfaces — no polymorphic collection

## Decision Points
- Tag vs dedicated registry class: use tags for simple groupings (<20 services); use registry class when grouping logic is complex or needs runtime modification
- Lazy vs eager resolution: prefer lazy (default) unless all services must be resolved for a batch operation

## Performance Considerations
- `tag()` registration is O(1) per abstract-tag pair
- `tagged()` returns immediately — resolution deferred to iteration
- With 50 tagged services but only 5 used, lazy resolution saves 45 `make()` calls
- Second iteration of the same collection re-resolves unless collection is cached

## Security Considerations
- Tags are string identifiers — avoid encoding sensitive information in tag names
- Services resolved via `tagged()` go through the full container pipeline — security extenders apply
- Ensure tagged services handling sensitive data are not iterated in unauthenticated contexts

## Related Rules
- Tag Interfaces, Not Concrete Classes
- Leverage Lazy Resolution — Do Not Eagerly Resolve Tagged Services
- Register Bindings Before Tagging Them
- Use Descriptive, Namespaced Tag Names
- Cache the Tagged Collection if Iterated Multiple Times

## Related Skills
- Combine Tags with Variadic Constructor Injection
- Select the Correct Binding Type
- Configure the Service Container

## Success Criteria
- Tagged services resolve correctly via `tagged()`
- Lazy resolution avoids constructing unused services
- Tag names are collision-free and descriptive
- Collection caching avoids double resolution on multi-pass iteration

---

# Skill: Combine Tags with Variadic Constructor Injection

## Purpose
Use variadic constructor parameters with tagged bindings to inject collections of tagged services directly into consumers, eliminating manual `tagged()` calls in application code.

## When To Use
- A consumer needs all registered implementations of an interface
- Pipeline or Chain of Responsibility where all handlers are injected
- Event listener collections or processor chains
- Replacing `tagged()` calls in consumer code with clean constructor injection

## When NOT To Use
- When the consumer needs to select specific services dynamically at runtime
- When tag membership changes per-request or per-scope
- When only one implementation of the interface exists

## Prerequisites
- Tagged Bindings
- Binding Resolution
- PHP variadic parameter syntax

## Inputs
- Consumer class name
- Interface type-hint for the variadic parameter
- Tag name matching the interface

## Workflow
1. Register bindings and tag them: `$app->tag([Interface::class], 'tag.name')`
2. In the consumer constructor, declare a variadic parameter with the interface type-hint:
   ```php
   public function __construct(
       protected Interface ...$services
   ) {}
   ```
3. The container automatically resolves variadic parameters from tagged bindings matching the type-hint
4. Register bindings and tags before resolving the consumer
5. Verify: resolve the consumer and assert all tagged services are injected

## Validation Checklist
- [ ] Variadic parameter type-hinted with the tagged interface
- [ ] Bindings for the interface registered before consumer resolution
- [ ] Tag registration includes all relevant bindings
- [ ] No manual `tagged()` calls in consumer code
- [ ] Consumer test verifies all tagged services injected

## Common Failures
- Variadic parameter type-hinted with concrete class instead of interface — only concrete implementations of that exact class are injected
- Tag name doesn't match the interface — variadic injection matches by type-hint, not tag name
- Not all bindings registered before consumer resolution — variadic injection only includes registered bindings
- Tagged collection is empty — bindings not registered or interface name mismatched

## Decision Points
- Variadic injection vs manual `tagged()` in constructor: prefer variadic for compile-time dependency declaration; use manual `tagged()` when tag selection is dynamic
- Single interface vs multiple interfaces: use multiple variadic parameters for different service groups

## Performance Considerations
- Variadic injection resolves all tagged services when the consumer is instantiated — eager resolution
- For performance-sensitive consumers with many tagged services, consider lazy factory pattern instead
- With 20 tagged services, variadic injection resolves all 20 at consumer construction time

## Security Considerations
- Variadic injection cannot filter services by authorization — all tagged services are injected
- If tagged services require authorization, inject a factory that filters based on the current user

## Related Rules
- Combine Tags with Variadic Constructor Injection
- Tag Interfaces, Not Concrete Classes
- Leverage Lazy Resolution — Do Not Eagerly Resolve Tagged Services

## Related Skills
- Group and Resolve Services via Tags
- Select the Correct Binding Type
- Configure the Service Container

## Success Criteria
- All tagged services of the matching interface type are injected into the consumer
- No manual `tagged()` calls in consumer business logic
- Consumer tests verify injected collection contents
- New tagged bindings automatically included without consumer changes
