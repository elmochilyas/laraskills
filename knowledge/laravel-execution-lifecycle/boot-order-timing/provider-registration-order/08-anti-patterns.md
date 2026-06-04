# ECC Anti-Patterns — Provider Registration Order

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Boot Order & Timing |
| **Knowledge Unit** | Provider Registration Order |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Relying on Package Discovery Order for Critical Dependencies
2. Reordering Framework Core Providers
3. Duplicate Provider Registration
4. Assuming Provider Merge Order Between Sources

---

## Repository-Wide Anti-Patterns

- Event Explosion — many small providers registered in random order, creating dependency chains.

---

## Anti-Pattern 1: Relying on Package Discovery Order for Critical Dependencies

### Category
Reliability

### Description
Depending on the order in which package discovery providers are registered, assuming the `PackageManifest` order is deterministic and stable across environments.

### Why It Happens
Developers see that their package provider registers before another in development and write code that depends on this order. They don't realize that package discovery order is an implementation detail of `PackageManifest`.

### Warning Signs
- Provider `boot()` depends on another provider's bindings where both are package-discovered
- Order-related failures that appear only in certain environments
- After `composer update`, provider order changes subtly

### Why It Is Harmful
Package discovery order depends on `vendor/composer/installed.json` which can change with any `composer update`. The order is not guaranteed and can break silently.

### Real-World Consequences
Package A's provider boots before Package B's. Package A's `boot()` resolves a service bound by Package B. After a `composer update` changes the order, Package A's provider fails because Package B's binding doesn't exist yet. Production breaks without code changes.

### Preferred Alternative
Explicitly order critical providers in `config/app.php` (Laravel 10) or `bootstrap/providers.php` (Laravel 11). Use provider order control rather than relying on package discovery timing.

### Refactoring Strategy
1. Identify providers with inter-dependencies
2. Move critical providers to the application's provider list
3. Order them explicitly in the configuration file

### Detection Checklist
- [ ] Provider dependencies rely on package discovery order
- [ ] After `composer update`, bindings become unavailable
- [ ] Environment-specific order-related failures

### Related Rules
Rule 1 (05-rules.md): Do not rely on package discovery order for critical dependencies.

### Related Skills
Control Provider Registration Order (06-skills.md).

### Related Decision Trees
Provider Order Management decision (07-decision-trees.md).

---

## Anti-Pattern 2: Reordering Framework Core Providers

### Category
Architecture

### Description
Attempting to reorder the three framework core providers (`LogServiceProvider`, `EventServiceProvider`, `RoutingServiceProvider`) that are hardcoded in the Application constructor.

### Why It Happens
A developer believes a different order would solve a timing issue, not realizing these are hardcoded and cannot be moved.

### Warning Signs
- Attempts to modify `Application::__construct()` to change provider order
- Service provider that runs "before" a core provider
- Workarounds to intercept core provider registration

### Why It Is Harmful
The core providers are hardcoded for a reason — Logger must be available for other providers to log errors, Events must be available for booting events, Routing must be bound for provider resolution. Changing their order would cascade failures through the entire framework.

### Real-World Consequences
A developer uses reflection to reorder core providers, putting `LogServiceProvider` last. Other providers call `Log::info()` during registration, which fails because the logging binding was removed. Bootstrap errors go unlogged.

### Preferred Alternative
You cannot reorder core providers — they are immutable. Design your providers to work within the existing order. Use `boot()` for dependencies on core services.

### Refactoring Strategy
1. Remove any attempts to reorder or intercept core providers
2. Move code that depends on core services to `boot()`
3. Use lifecycle hooks for timing-specific logic

### Detection Checklist
- [ ] Reflection or workarounds to reorder framework providers
- [ ] Code that depends on core providers running in a different order

### Related Rules
Rule 2 (05-rules.md): Do not reorder framework core providers — they are immutable.

---

## Anti-Pattern 3: Duplicate Provider Registration

### Category
Reliability

### Description
Registering the same provider class in multiple provider source lists (framework, `config/app.php`, package discovery). The `Application::register()` method returns the existing instance if already registered, but the duplicate pollutes the provider list.

### Why It Happens
Developers add a provider to `config/app.php` for visibility, not realizing it's already discovered by a package or added by the framework.

### Warning Signs
- Same provider class appears in multiple locations
- Provider `register()` called once but `boot()` behaves unexpectedly
- Provider appears twice in `php artisan optimize:clear` output

### Why It Is Harmful
While the framework deduplicates, the redundant provider entry in configuration creates maintenance confusion. If a provider is removed from one location but not the other, it may continue to load unexpectedly.

### Real-World Consequences
A package provider is listed in both `config/app.php` and discovered via package discovery. The developer removes it from `config/app.php` thinking it's disabled. The provider still loads via discovery. Security-relevant configuration changes are silently ignored.

### Preferred Alternative
List each provider in exactly one location. Remove discovered providers from `config/app.php` and vice versa.

### Refactoring Strategy
1. Identify providers registered in multiple locations
2. Choose one location based on whether the provider needs explicit ordering
3. Remove duplicates from other locations

### Detection Checklist
- [ ] Same provider class in `config/app.php` and package discovery
- [ ] Provider appears multiple times in provider lists
- [ ] Confusion about whether a provider is active

### Related Rules
Rule 3 (05-rules.md): Do not register the same provider twice.

### Related Skills
Control Provider Registration Order (06-skills.md).

---

## Anti-Pattern 4: Assuming Provider Merge Order Between Sources

### Category
Reliability

### Description
Assuming that package discovery providers always register before framework core providers or vice versa. The merge order is: framework core → `config/app.php` → package discovery.

### Why It Happens
Developers create bindings in package providers assuming they will register before app providers. They don't understand that package discovery providers are appended last.

### Warning Signs
- Package provider assumes its bindings are available during app provider `boot()`
- App provider's `boot()` depends on a package provider that registers later
- "Provider not found" errors that depend on the merge order

### Why It Is Harmful
Package discovery providers are registered last. App providers that depend on package bindings in `boot()` will fail because the package hasn't registered yet.

### Real-World Consequences
An app provider's `boot()` calls `resolve(PaymentGateway::class)` which is bound by a package provider. The package provider is in the discovery list (last merge position). The resolution fails because the package hasn't registered yet.

### Preferred Alternative
If your app provider depends on a package provider, list the package provider explicitly in `config/app.php` before your app provider. This inserts it into the correct position in the merge order.

### Refactoring Strategy
1. Identify app providers that depend on package-provided bindings
2. Move the package provider from discovery to `config/app.php` with the correct position
3. Document the dependency chain explicitly

### Detection Checklist
- [ ] App provider depends on package provider that is only discovered
- [ ] Dependency failures that differ between environments
- [ ] Provider merge order not documented or understood

### Related Rules
Rule 4 (05-rules.md): Understand the provider merge order — framework core → config/app.php → package discovery.

### Related Skills
Control Provider Registration Order (06-skills.md).

### Related Decision Trees
Provider Merge Order decision (07-decision-trees.md).
