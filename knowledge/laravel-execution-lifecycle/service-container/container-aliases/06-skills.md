# Skill: Register and Resolve Container Aliases

## Purpose
Create alternative names for container bindings to enable convenient access through short-hand keys while maintaining resolution consistency with the canonical FQCN.

## When To Use
- Providing short names for long fully-qualified class names: `'payments'` for `PaymentGateway::class`
- Backward compatibility when refactoring interface or class names
- Enabling Facade access with custom accessor names
- Multi-name access for the same service (aliases share the singleton)

## When NOT To Use
- As a substitute for binding registration (aliases are pointers, not bindings)
- For services that should be resolved by type-hint in constructors (use the FQCN there)
- Creating circular alias chains (A → B → A)

## Prerequisites
- Container Fundamentals
- Binding Resolution

## Inputs
- Abstract name (FQCN or string key) to alias
- Canonical binding abstract name
- Whether this replaces or augments an existing alias

## Workflow
1. Ensure the target binding is already registered: `$app->bound(Abstract::class)`
2. Register the alias in the same service provider as the binding: `$app->alias(Canonical::class, 'short-name')`
3. Verify resolution: `$instance1 = $app->make(Canonical::class); $instance2 = $app->make('short-name');` — both return the same instance
4. For Facade support, return the alias string from `getFacadeAccessor()`
5. Document the alias if it overrides a core framework alias

## Validation Checklist
- [ ] Target binding exists before `alias()` call
- [ ] Alias chain forms a DAG — no circular references
- [ ] Both alias and canonical name resolve to the same instance
- [ ] Alias registered in same provider as the binding
- [ ] Core alias overrides documented with impact analysis

## Common Failures
- Aliasing without a registered binding — `make('alias')` throws at resolution time
- Circular alias chain causes PHP stack overflow, not a container exception
- `forgetInstance()` called on alias doesn't clear the real instance
- Overriding core alias (`'db'`, `'cache'`) breaks third-party packages relying on original mapping

## Decision Points
- Single alias vs multiple aliases: use single for convenience, multiple when backward compatibility is needed
- Short string vs FQCN: prefer FQCN in constructors for static analysis; use short strings for Facades and helpers

## Performance Considerations
- Alias resolution adds ~0.3μs per alias chain level (typically 1-2 levels)
- 40 core aliases with ~100 entries occupy ~8KB — negligible
- Resolution is O(1) after alias normalization

## Security Considerations
- Overriding core aliases can silently change framework-wide behavior — audit before overriding
- Dangling aliases throw at resolution time — test all aliases in CI

## Related Rules
- Register Alias in the Same Provider as the Target Binding
- Avoid Creating Circular Alias Chains
- Use Canonical Name for bound() and forgetInstance() Checks
- Prefer Interface Type-Hints Over Aliases for Dependency Injection

## Related Skills
- Debug Alias Chain Failures
- Resolve Services Correctly with make()
- Configure the Service Container

## Success Criteria
- Alias resolves to the same instance as the canonical binding
- No dangling or circular aliases
- Tests confirm alias resolution matches canonical resolution

---

# Skill: Debug Alias Chain Failures

## Purpose
Diagnose and fix issues where container aliases resolve to wrong implementations, fail to resolve, or create circular alias chains that cause stack overflow.

## When To Use
- When `make('alias')` throws `BindingResolutionException`
- When `make('alias')` returns a different instance than `make(Canonical::class)`
- When PHP "Maximum function nesting level" error occurs during resolution
- When `forgetInstance()` does not clear the expected cached service

## When NOT To Use
- When the issue is a missing binding (use Resolve Services Correctly)
- When the issue is in auto-resolution (use Debug Auto-Resolution Failures)

## Prerequisites
- Container Aliases
- Binding Resolution chain

## Inputs
- Alias name that fails or behaves unexpectedly
- Expected canonical abstract
- PHP error message or exception trace

## Workflow
1. Check if the alias is registered: search `alias(..., 'alias-name')` in service providers
2. Trace the alias chain: call `$app->getAlias('alias-name')` recursively until it returns the same value (canonical)
3. If `BindingResolutionException`: verify the canonical abstract has a registered binding
4. If stack overflow: check for circular aliases — A → B → A pattern; break the cycle by pointing all aliases directly to the canonical abstract
5. If `forgetInstance()` hasn't worked: resolve the canonical name first — use canonical for `forgetInstance()`
6. Verify fix: `make('alias')` and `make(canonical)` return the same instance

## Validation Checklist
- [ ] Alias chain terminates at a bound abstract (not another alias)
- [ ] No circular references in alias chain
- [ ] `make('alias')` returns `=== $app->make($canonical)`
- [ ] `forgetInstance($canonical)` works correctly (not called on alias)
- [ ] CI test resolves all aliases

## Common Failures
- Alias points to another alias, which points to another — hard to trace chain
- Alias registered before binding — `make()` works only after binding is later registered
- Overridden core alias — the new alias points to a different class, breaking framework expectations

## Decision Points
- If alias chain is too long: refactor to point all aliases directly to the canonical abstract
- If core alias override is necessary: document extensively and verify package compatibility

## Performance Considerations
- Long alias chains add ~0.3μs per level — keep chains short (1-2 levels max)
- Stack overflow from circular aliases wastes debug time — prevent with CI test

## Security Considerations
- Dangling alias errors expose internal abstract names in exception messages
- Overridden core aliases can redirect framework service resolution to different implementations without explicit warning

## Related Rules
- Avoid Creating Circular Alias Chains
- Use Canonical Name for bound() and forgetInstance() Checks
- Test All Aliases Resolve Correctly in CI

## Related Skills
- Register and Resolve Container Aliases
- Debug Resolution Chain Failures
- Detect Cycles via CI Testing

## Success Criteria
- All aliases resolve to the correct canonical binding
- No circular aliases in the codebase
- CI test confirms all aliases resolve and match canonical instances
