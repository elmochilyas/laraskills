# ECC Anti-Patterns — Base Bindings and Core Aliases

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Application Bootstrap |
| **Knowledge Unit** | Base Bindings and Core Aliases |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Static Alias Modification via Reflection
2. Alias-Only Resolution Strategy
3. Binding Over Core Aliases
4. Alias Removal After Resolution
5. Assuming Alias Existence Equals Resolvability

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — resolving via alias instead of contract hides the resolution path.

---

## Anti-Pattern 1: Static Alias Modification via Reflection

### Category
Framework Usage

### Description
Reassigning `Application::$aliases` at runtime via reflection or by modifying the static property. The static property is not intended for mutation after construction.

### Why It Happens
Developers need to change an alias mapping and resort to reflection because no public API exists for alias removal. They modify the static property directly, not realizing it's shared across all Application instances.

### Warning Signs
- Reflection used to modify `Application::$aliases`
- `AliasLoader::setInstance()` called manually
- Alias behavior changes unpredictably across requests

### Why It Is Harmful
The `$aliases` array is `protected static` — shared across all Application instances in the same process. In Octane, modifying it in one worker affects all workers in that process.

### Real-World Consequences
A package modifies `Application::$aliases` via reflection to override the `'auth'` alias. In Octane with 8 workers, the alias change propagates to all workers, breaking authentication across the entire application.

### Preferred Alternative
Use `$app->alias()` for runtime alias registration. There is no supported API for alias removal — design around this limitation rather than fighting it.

### Refactoring Strategy
1. Remove all reflection-based alias modifications
2. Replace with `$app->alias($target, $alias)` calls in service providers
3. If alias removal is truly needed, re-architect to avoid it

### Detection Checklist
- [ ] Reflection used on `Application::$aliases` or `AliasLoader`
- [ ] Static property `$aliases` modified at runtime
- [ ] Custom alias registration outside of `$app->alias()` API

### Related Rules
Rule 1 (05-rules.md): Never modify `Application::$aliases` via reflection at runtime.

### Related Skills
Register and Verify Core Aliases (06-skills.md).

### Related Decision Trees
Alias Modification at Runtime decision (07-decision-trees.md).

---

## Anti-Pattern 2: Alias-Only Resolution Strategy

### Category
Maintainability

### Description
Resolving services exclusively by alias string (e.g., `$app->make('auth')`) instead of by class/interface name (`$app->make(AuthFactory::class)`). This prevents IDE autocompletion and static analysis.

### Why It Happens
Developers use alias strings because they are shorter and match facade names. They don't realize that type-hinting by interface provides better tooling support.

### Warning Signs
- `$app->make('cache')` instead of `$app->make(CacheFactory::class)`
- Constructor injection uses string aliases instead of class/interface types
- IDE cannot provide autocompletion for resolved services

### Why It Is Harmful
String aliases cannot be type-checked by static analysis tools. Renaming the alias requires searching for all string usages. Type-hinted resolution enables refactoring, IDE support, and static analysis.

### Real-World Consequences
An application resolves services by alias string throughout the codebase. When a framework upgrade removes an alias, the application breaks with `BindingResolutionException` — grep cannot find all usages because some aliases are constructed dynamically.

### Preferred Alternative
Resolve by class or interface name: `$app->make(Contracts\Auth\Factory::class)`. Use alias strings only in facade accessors and config files where string keys are required.

### Refactoring Strategy
1. Find all `$app->make('string')` calls
2. Replace string arguments with `ClassName::class` constants
3. Update constructor injection to use interface type-hints

### Detection Checklist
- [ ] `$app->make('string')` pattern used in business logic
- [ ] Constructor parameters use string-based `$container->make()` calls
- [ ] Service resolution bypasses type-hints

### Related Rules
Rule 2 (05-rules.md): Always resolve by class/interface name for type-safety.

### Related Skills
Register and Verify Core Aliases (06-skills.md).

---

## Anti-Pattern 3: Binding Over Core Aliases

### Category
Reliability

### Description
Registering a binding with the same abstract key as a core alias (e.g., binding something to `'events'` or `'cache'`). The user binding silently shadows the core alias.

### Why It Happens
Developers use alias keys they see in framework code without realizing they are core aliases. They assume the key is free for use if they haven't registered it themselves.

### Warning Signs
- `$app->bind('events', ...)` or similar binding against a known core alias key
- Core functionality (cache, events, auth) behaves unexpectedly
- `$app->bound('events')` returns true but resolves to the wrong class

### Why It Is Harmful
Shadowing a core alias breaks framework functionality silently. No error or warning is produced when the override occurs. The framework uses the wrong implementation.

### Real-World Consequences
A developer binds `$app->singleton('cache', fn() => new CustomCache)` to inject a custom cache implementation. The core `'cache'` alias is now pointing to their custom class. Framework components that depend on the original cache binding silently use the wrong implementation, causing data corruption.

### Preferred Alternative
Use unique alias keys prefixed with the package or application name (e.g., `'acme-cache'`). Check for collisions with `$app->bound()` before registering aliases.

### Refactoring Strategy
1. Identify bindings that use core alias keys
2. Rename to unique prefixed keys
3. Update references to use the new key or inject by class/interface

### Detection Checklist
- [ ] Custom binding registered with a key from `$aliases` array
- [ ] Core functionality broken after package installation
- [ ] `$app->bound()` returns unexpected results for core keys

### Related Rules
Rule 3 (05-rules.md): Never bind abstracts that shadow core alias keys.

### Related Skills
Register and Verify Core Aliases (06-skills.md).

### Related Decision Trees
Custom Alias Key Collision Prevention decision (07-decision-trees.md).

---

## Anti-Pattern 4: Alias Removal After Resolution

### Category
Reliability

### Description
Attempting to remove an alias from the container after some service has been resolved through that alias. The container does not track alias removal, leaving dangling references in `$this->resolved`.

### Why It Happens
Developers need to "unregister" an alias and try to remove it from the aliases array or set it to null. They don't realize the container has no cleanup mechanism for resolved aliases.

### Warning Signs
- Manual manipulation of alias entries after resolution
- `$this->resolved` array grows beyond expected size
- Memory leaks related to alias entries

### Why It Is Harmful
The container stores resolved instance keys that reference the alias. Removing the alias leaves dangling resolved entries that cannot be resolved again, preventing garbage collection.

### Real-World Consequences
A developer removes an alias at runtime to "free memory." The container's resolved registry still references the old alias key. Memory is not freed, and subsequent resolution attempts fail silently, returning stale instances.

### Preferred Alternative
Design the application without needing to remove aliases. If runtime alias switching is required, use the decorator or strategy pattern with a single alias that delegates dynamically.

### Refactoring Strategy
1. Remove all alias removal code
2. Implement a delegation pattern that returns different implementations based on context
3. Use `$app->extend()` to modify resolved instances instead of removing aliases

### Detection Checklist
- [ ] Code attempts to unset or remove alias entries
- [ ] Memory analysis shows unreleased alias references
- [ ] Resolution after alias removal returns stale instances

### Related Rules
Rule 4 (05-rules.md): Never remove aliases from the container — design without removal.

### Related Skills
Debug Alias Resolution Failures (06-skills.md).

---

## Anti-Pattern 5: Assuming Alias Existence Equals Resolvability

### Category
Framework Usage

### Description
Expecting `$app->make('config')` to work because the alias `'config'` exists in the core aliases array. An alias is just a pointer to an abstract — the abstract must also have a binding.

### Why It Happens
Developers see that `$app->bound('config')` returns true (because the alias exists) and assume `$app->make('config')` will resolve. They confuse alias existence with binding existence.

### Warning Signs
- Code checks `$app->bound('config')` which returns true, but `$app->make('config')` throws `BindingResolutionException`
- `BindingResolutionException` for a key that appears in the aliases array
- Developer uses alias check as proxy for binding availability

### Why It Is Harmful
This confusion leads to incorrect assumptions about what services are available during bootstrap phases. Code that assumes alias = resolvable will fail silently when the binding hasn't been registered yet.

### Real-World Consequences
Code in `register()` checks `$app->bound('config')` and proceeds to call `$app->make('config')` because it returned true. The `make()` call throws `BindingResolutionException` because the `ConfigRepository` has not been bound yet — only the alias exists.

### Preferred Alternative
Use `$app->resolved()` or `$app->bound()` understanding that `bound()` returns true for both bindings and aliases. The proper check requires distinguishing between the two.

### Refactoring Strategy
1. Replace naive `$app->bound()` checks with proper timing-aware logic
2. Move config-dependent code to `boot()` where config is guaranteed available
3. Use `$app->make()` only after the corresponding bootstrapper has run

### Detection Checklist
- [ ] `$app->bound()` used to check if config is available
- [ ] Code assumes alias existence in `$aliases` implies resolvability
- [ ] `BindingResolutionException` for keys in the core aliases array

### Related Rules
Rule 5 (05-rules.md): Distinguish alias existence from binding resolvability — alias is not a binding.

### Related Skills
Debug Alias Resolution Failures (06-skills.md).

### Related Decision Trees
Bootstrapper Timing and Alias Resolution decision (07-decision-trees.md).
