# Decomposition: Base Bindings and Core Aliases

## Boundary Analysis
The KU covers two methods within the Application constructor. The boundary starts when `registerBaseBindings()` is called and ends when `registerCoreContainerAliases()` returns. The alias resolution mechanism (`Container::alias()`, `Container::make()` alias following) is in scope only for registration; runtime alias lookup belongs in the Facade System KU.

**In scope:** The three base singletons, the `$aliases` static array definition, `$this->alias()` calls during construction.
**Out of scope:** Facade `getFacadeAccessor()` implementations, runtime alias resolution, user-defined alias registration.

## Atomicity Assessment
**Status:** ⚡ Splittable (2 units)

**Proposed split:**
1. **Base Binding Registration** — the three `$this->instance()` calls that bind `'app'`, `Container::class`, and `Psr\Container\ContainerInterface::class`. This is architecturally distinct because these bindings survive flush/reset, whereas aliases do not need to.
2. **Core Alias Registration** — the `$aliases` array and its registration loop. Aliases are a facade convenience layer that could theoretically be deferred or excluded in headless applications.

**Splitting rationale:** The base bindings are essential to container identity; aliases are a developer experience feature. A minimal Laravel variant (e.g., Lumen) might keep base bindings but drop core alias registration entirely.

## Dependency Graph
```
┌──────────────────────────┐
│ Application::__construct │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ registerBaseBindings()               │
│ Creates: 'app', Container::class,     │
│          Psr\Container\ContainerI::cl │
└──────┬───────────────────────────────┘
       │ (no dependencies — pure instance creation)
       ▼
┌──────────────────────────────────────┐
│ registerCoreContainerAliases()       │
│ Requires: Container alias mechanism  │
│ Creates: ~70 alias entries            │
└──────────────────────────────────────┘
       │
       ▼  (returns to constructor)
```
Base bindings have zero dependencies within the container. Aliases depend on `Container::alias()` but not on the base bindings themselves.

## Follow-up Opportunities
- **Alias Coverage Analysis:** Map every alias to its resolved binding and identify aliases that are never resolved during a typical web request (dead alias detection).
- **Custom Alias Strategy:** Document when a package should register an alias vs when it should register a binding directly — decision framework for package authors.
- **Flush Survival Analysis:** Trace which ecosystem packages depend on base bindings surviving flush() and which break because they assume their bindings survive.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization