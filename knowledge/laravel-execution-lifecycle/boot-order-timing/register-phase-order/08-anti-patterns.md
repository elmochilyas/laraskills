# ECC Anti-Patterns — Register Phase Order

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Boot Order & Timing |
| **Knowledge Unit** | Register Phase Order |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Order Spaghetti
2. Accidental Binding Override
3. Provider Dependency Chain
4. Fat register() Methods
5. Resolving Services in register()

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — resolving services in `register()` triggers eager loading during provider registration
- Premature Caching — caching during `register()` caches before all bindings exist

---

## Anti-Pattern 1: Order Spaghetti

### Category
Architecture

### Description
Constantly reordering providers in `config/app.php` to fix runtime errors instead of decoupling the providers from each other.

### Why It Happens
When a `BindingResolutionException` occurs, the first instinct is to move the failing provider earlier in the list. Over time, the provider list becomes a fragile, undocumented tangle.

### Warning Signs
- Frequent commits reordering `config/app.php`
- Comments in `config/app.php` like "must be before X" or "moved here to fix Y"
- Provider order changes as a common fix for bugs
- Team members afraid to reorder providers

### Why It Is Harmful
Reordering treats symptoms, not causes. Providers should be independent through the container, not through fragile ordering. Each reorder fixes one bug but potentially breaks another, creating a cascading maintenance nightmare.

### Real-World Consequences
An application has 30 providers. Over two years, the `config/app.php` list has been reordered 47 times to fix "service not found" errors. A developer adds a new provider at the end — it breaks three existing providers that depended on implicit ordering. No one understands the current order. The team spends a week untangling dependencies.

### Preferred Alternative
Design providers to be order-independent. Use the container for cross-provider communication. If ordering is truly required, document it explicitly with comments and tests.

### Refactoring Strategy
1. Audit the current provider order and identify implicit dependencies
2. Replace fragile ordering dependencies with container bindings
3. Use `$app->afterResolving()` or `$app->resolving()` callbacks for cross-cutting concerns
4. Document any remaining ordering requirements in `config/app.php`

### Detection Checklist
- [ ] Providers frequently reordered to fix bugs
- [ ] Undocumented ordering assumptions
- [ ] Team cannot explain the current provider order
- [ ] New providers break existing functionality

### Related Rules
Register Phase Order Rule 3 (05-rules.md): Place Framework Core Providers First, Infrastructure Next.
Register Phase Order (04-standardized-knowledge.md): Avoid inter-provider coupling in register().

### Related Skills
Structure Service Provider register() Methods (06-skills.md).

### Related Decision Trees
Provider Positioning Strategy (07-decision-trees.md).

---

## Anti-Pattern 2: Accidental Binding Override

### Category
Reliability

### Description
Two or more providers binding the same abstract service identifier without coordination, with the last-registered provider silently overriding the others.

### Why It Happens
Multiple providers bind the same interface or abstract to different implementations without checking or documenting which one should win.

### Warning Signs
- `$this->app->bind(Service::class, ...)` in multiple providers
- `$this->app->singleton(Logger::class, ...)` in more than one provider
- The same abstract bound in both an app provider and a package provider
- Behavior that depends on provider registration order to determine which implementation is used

### Why It Is Harmful
Providers registered later override bindings from earlier ones with no warning. The last registration wins silently. This creates non-deterministic behavior — changing provider order changes which implementation is active.

### Real-World Consequences
`AppServiceProvider` binds `Logger::class` to `FileLogger::class`. A third-party package also binds `Logger::class` to `CloudLogger::class` in its provider. Because package providers register after app providers, `CloudLogger` wins. Logs go to the cloud instead of local files. The developer does not discover this for weeks.

### Preferred Alternative
Bind each abstract in exactly one provider. If multiple implementations are needed, use contextual binding (`$app->when()->needs()->give()`) or named bindings.

### Refactoring Strategy
1. Search for all `$app->bind()`, `singleton()`, `scoped()` calls across all providers
2. Find abstracts bound in multiple providers
3. Consolidate each abstract into a single provider
4. If override is intentional, document it and ensure ordering is explicit

### Detection Checklist
- [ ] Same abstract bound in multiple providers
- [ ] Singleton bound in both app and package providers
- [ ] Implementation changes when providers are reordered
- [ ] No documentation about which binding wins

### Related Rules
Register Phase Order Rule 2 (05-rules.md): Know the Three Provider Source Merge Order.
Register Phase Order (04-standardized-knowledge.md): Be aware of which provider overrides bindings.

### Related Skills
Structure Service Provider register() Methods (06-skills.md).

### Related Decision Trees
Provider Positioning Strategy (07-decision-trees.md).

---

## Anti-Pattern 3: Provider Dependency Chain

### Category
Architecture

### Description
Creating a chain of providers where A depends on B, B depends on C, and all must be manually ordered in `config/app.php`.

### Why It Happens
Developers design providers with explicit dependencies on other providers' bindings rather than using the container to decouple them.

### Warning Signs
- Provider A's `register()` expects Provider B's bindings to exist
- Provider B's `boot()` resolves services from Provider C
- `config/app.php` has a long, fragile ordered chain of providers
- Removing one provider in the middle breaks all providers after it

### Why It Is Harmful
Chain dependencies make the provider list extremely fragile. Adding a new provider at the wrong position breaks the chain. Updating a provider's internal bindings can break its dependents. The entire bootstrap becomes a house of cards.

### Real-World Consequences
Provider A → B → C → D → E is the dependency chain. A package update changes Provider C's bindings. Provider D (which depends on C) breaks. The developer cannot update the package because it would require reordering 5 providers. They stay on an outdated, vulnerable package version.

### Preferred Alternative
Use the container to break provider chains. Each provider should be independently testable. If a provider depends on another's services, use contextual binding or a shared interface.

### Refactoring Strategy
1. Map the current provider dependency chain
2. Identify each "link" — why does A depend on B?
3. Replace direct dependencies with container-based decoupling (interfaces, contextual binding)
4. Reorder `config/app.php` by convention (infrastructure → domain → presentation) rather than dependency order

### Detection Checklist
- [ ] Provider A breaks if Provider B is removed or reordered
- [ ] Chain of 3+ providers with sequential dependencies
- [ ] Provider list ordered by dependency chain rather than convention
- [ ] Team documentation lists the required provider order

### Related Rules
Register Phase Order Rule 3 (05-rules.md): Place Framework Core Providers First, Infrastructure Next.
Register Phase Order (04-standardized-knowledge.md): Avoid inter-provider coupling in register().

### Related Skills
Structure Service Provider register() Methods (06-skills.md).

### Related Decision Trees
Provider Positioning Strategy (07-decision-trees.md).

---

## Anti-Pattern 4: Fat register() Methods

### Category
Performance

### Description
Performing heavy operations — file parsing, network calls, complex computation — inside a service provider's `register()` method.

### Why It Happens
Developers do not realize that every non-deferred provider's `register()` runs on every request, and each provider's execution time compounds in the serial registration loop.

### Warning Signs
- `file_get_contents()`, `json_decode()`, `unserialize()` in `register()`
- `Http::post()`, API calls, or external service pings in `register()`
- Complex data processing or aggregation in `register()`
- `register()` methods exceeding 20 lines of non-binding code

### Why It Is Harmful
Every non-deferred provider's `register()` runs on every request. Heavy operations here delay the entire boot sequence for all providers. The register phase is O(n) on provider count — each provider's execution time compounds serially.

### Real-World Consequences
A provider reads a 2MB configuration file in `register()` (taking 50ms to parse). With 30 providers (each taking ~1ms for bindings), the total register phase takes 50 + 30 = 80ms. After moving the file parsing to `boot()` and caching the result, the register phase takes 2ms total. Bootstrap time drops from 120ms to 40ms.

### Preferred Alternative
Keep `register()` minimal — container bindings and `mergeConfigFrom()` calls only. Move heavy operations to `boot()` or lazy initialization.

### Refactoring Strategy
1. Identify all I/O, file parsing, and computation in `register()` methods
2. Move heavy operations to `boot()` methods
3. For one-time setup that should not run on every request, use `booted()` callback or cache the result
4. Measure the register phase duration before and after refactoring

### Detection Checklist
- [ ] File I/O in `register()`
- [ ] HTTP calls in `register()`
- [ ] Complex computation or data processing in `register()`
- [ ] `register()` methods exceed 20 lines of non-binding code

### Related Rules
Register Phase Order Rule 5 (05-rules.md): Keep register() Minimal — Bindings and Properties Only.

### Related Skills
Structure Service Provider register() Methods (06-skills.md).

### Related Decision Trees
Resolution Safety in Register Phase (07-decision-trees.md).

---

## Anti-Pattern 5: Resolving Services in register()

### Category
Framework Usage

### Description
Calling `$this->app->make()`, `resolve()`, or `app()` inside a service provider's `register()` method.

### Why It Happens
Developers treat `register()` as a general initialization method and assume all services are available because the Application exists.

### Warning Signs
- `$this->app->make()` called in `register()`
- `app('service')` or `resolve('service')` in `register()`
- `BindingResolutionException` during provider registration

### Why It Is Harmful
During the register phase, not all providers have registered their bindings. Resolving a service whose provider hasn't registered yet throws `BindingResolutionException`. The two-phase design guarantees all `register()` calls complete before any `boot()` call starts.

### Real-World Consequences
A provider calls `$this->app->make(Cache::class)` in `register()`. In development, the Cache provider is registered earlier in `config/app.php`. In production, a package discovery reorders providers, and the Cache provider registers after this one. Production crashes with `BindingResolutionException` on every request.

### Preferred Alternative
Keep `register()` pure — bindings only. Move all service resolution to `boot()` where every provider's bindings are available.

### Refactoring Strategy
1. Search all `register()` methods for `$this->app->make()`, `resolve()`, `app()`
2. Move each resolution call to the provider's `boot()` method
3. If a binding depends on a resolved value, register a closure that captures the dependency lazily
4. Verify no `make()` calls remain in any `register()` method

### Detection Checklist
- [ ] `$this->app->make()` in `register()`
- [ ] `resolve()` or `app()` in `register()`
- [ ] `BindingResolutionException` during bootstrap
- [ ] Services resolved in `register()` that are registered by other providers

### Related Rules
Register Phase Order Rule 1 (05-rules.md): Never Resolve Services in register().

### Related Skills
Structure Service Provider register() Methods (06-skills.md).

### Related Decision Trees
Resolution Safety in Register Phase (07-decision-trees.md).
