# Metadata

**Domain:** Laravel Execution Lifecycle & Framework Internals
**Subdomain:** Boot Order & Timing
**Knowledge Unit:** Register Phase Order
**Generated:** 2026-06-03

---

# Decision Inventory

1. Provider Positioning: Ordering providers in `config/app.php` relative to merge sources
2. Binding Safety: Resolution in `register()` vs `boot()`
3. Provider Source Control: Explicit registration vs auto-discovery for package providers

---

# Architecture-Level Decision Trees

---

## Decision Name: Provider Positioning Strategy

---

## Decision Context

Placing providers in the correct order within the three-source merge (framework core → `config/app.php` → package discovery).

---

## Decision Criteria

* performance — no impact; registration overhead is per-provider regardless of position
* architectural — framework core always first, then config/app.php in array order, then package providers appended last
* security — later providers can override earlier bindings
* maintainability — fragile ordering indicates coupling issues

---

## Decision Tree

Does your provider depend on another provider's bindings in its `register()` or `boot()` method?
↓
YES → Place the dependency provider BEFORE yours in `config/app.php`
NO → Is your provider a package provider discovered via auto-discovery?
↓
YES → Does it need to boot before or interleave with app providers?
YES → Add it explicitly to `config/app.php` — auto-discovery always appends last
NO → Auto-discovery is fine (your provider runs after all app providers)
NO → Does your provider override bindings from another provider?
↓
YES → Place AFTER the provider whose bindings you override
NO → Order by convention: infrastructure → domain → presentation

---

## Rationale

Providers are registered in this immutable merge order: (1) framework core providers from `Application::__construct()`, (2) `config/app.php` providers in array order, (3) package discovery providers appended last. Package providers always boot after all application providers regardless of their position in the array. Understanding this order is essential for correct provider dependencies.

---

## Recommended Default

**Default:** Group by layer: infrastructure first, domain services middle, UI/presentation last. Package providers appended automatically.
**Reason:** Predictable ordering that minimizes cross-provider coupling.

---

## Risks Of Wrong Choice

- Assuming package provider can interleave: auto-discovery always appends after app providers — explicit registration required.
- Reordering to fix runtime errors: treats symptom, not cause — providers should not depend on fragile ordering.
- Accidental override: two providers binding the same abstract — last registered wins silently.

---

## Related Rules

- Know the three provider source merge order (05-rules.md, Rule 2)
- Never resolve services in `register()` (05-rules.md, Rule 1)
- Avoid inter-provider coupling (05-rules.md, Rule 4)

---

## Related Skills

- Structure Service Provider register() Methods

---

## Decision Name: Resolution Safety in Register Phase

---

## Decision Context

Determining whether a container resolution call is safe during the `register()` phase.

---

## Decision Criteria

* performance — no meaningful difference
* architectural — `register()` runs before all providers have registered; resolution may fail
* security — accidentally resolving unregistered services may expose default implementations
* maintainability — rule is simple: never resolve in `register()`

---

## Decision Tree

Is the operation `$this->app->make()`, `resolve()`, or `app()->make()`?
↓
YES → Move to `boot()` — never resolve in `register()`
NO → Is the operation `$this->app->bind()`, `singleton()`, `scoped()`, `instance()`, `alias()`, or `when()->needs()->give()`?
↓
YES → Safe — these are binding registrations, not resolutions
NO → Is the operation reading `$this->app['config']`?
↓
YES → Safe — Config is a framework core provider, always registered first
NO → Is the operation doing I/O, file parsing, or network calls?
↓
YES → Move to `boot()` — keep `register()` pure
NO → If unsure, assume unsafe — keep `register()` as pure binding-only

---

## Rationale

During the register phase, not all providers have registered their bindings. Resolving a service whose provider hasn't registered yet throws `BindingResolutionException`. The two-phase design guarantees all `register()` calls complete before any `boot()` call starts. `register()` should contain only container bindings — no resolution, no side effects, no I/O.

---

## Recommended Default

**Default:** No `$this->app->make()` calls in `register()`. All bindings in `register()`. All resolutions in `boot()`.
**Reason:** The two-phase guarantee ensures all bindings are available during `boot()`.

---

## Risks Of Wrong Choice

- Resolution in `register()`: `BindingResolutionException` — non-deterministic, depends on provider order.
- I/O in `register()`: delays all subsequent providers' `register()` — serial bottleneck in the boot phase.
- Reading config is safe but misleading: develops bad habits; maintainers may copy the pattern for non-config resolutions.

---

## Related Rules

- Never resolve services in `register()` (05-rules.md, Rule 1)
- Know the three provider source merge order (05-rules.md, Rule 2)
- Keep `register()` minimal (05-rules.md, Rule 3)

---

## Related Skills

- Structure Service Provider register() Methods
