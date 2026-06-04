# Metadata

**Domain:** Laravel Execution Lifecycle & Framework Internals
**Subdomain:** Boot Order & Timing
**Knowledge Unit:** ku-02-provider-registration-order
**Generated:** 2026-06-03

---

# Decision Inventory

1. Provider Ordering: App provider position relative to package providers
2. Binding Override Management: Intentional override vs accidental conflict
3. Provider Source Control: `config/app.php` explicit vs auto-discovery for package providers

---

# Architecture-Level Decision Trees

---

## Decision Name: Provider Ordering Strategy

---

## Decision Context

Placing providers in the correct order within `config/app.php` to ensure dependencies are available when providers boot, considering the three-source merge (framework core → app providers → package providers).

---

## Decision Criteria

* performance — ordering does not affect registration speed
* architectural — providers boot in registration order: core → app (config/app.php) → package (auto-discovery)
* security — later providers can override earlier bindings
* maintainability — fragile ordering indicates coupling that should be refactored

---

## Decision Tree

Does your provider depend on another provider's bindings in its `boot()` method?
↓
YES → Place the dependency provider BEFORE yours in `config/app.php`
NO → Is your provider a package provider discovered via auto-discovery?
↓
YES → Does your provider need to boot before or interleave with app providers?
YES → Add your provider explicitly to `config/app.php` at the desired position
NO → Auto-discovery is fine — your provider boots after all app providers
NO → Does your provider need to override a binding from another provider?
↓
YES → Place your provider AFTER the provider whose binding you override
NO → Order by layer: infrastructure first, domain services middle, presentation last

---

## Rationale

Providers boot in the order they were registered. Framework core providers boot first (from `Application::__construct()`), then `config/app.php` providers in array order, then package discovery providers appended last. This means package providers always boot after all app providers unless explicitly added to `config/app.php`. The boot order mirrors the register order via `$serviceProviderList` which preserves insertion order.

---

## Recommended Default

**Default:** Group by layer in `config/app.php`: infrastructure providers first, domain services middle, UI/presentation providers last. Add package providers explicitly only when interleaving is required.
**Reason:** Clear, predictable ordering that minimizes cross-provider coupling.

---

## Risks Of Wrong Choice

- Incorrect ordering leads to `BindingResolutionException` in `boot()` when a dependency provider hasn't registered yet.
- Assuming auto-discovered package providers boot before app providers: they boot AFTER — package providers cannot be depended upon by app providers' `boot()`.
- Accidental override: two providers binding the same abstract — last registered wins silently.

---

## Related Rules

- Place foundational providers first in config/app.php (05-rules.md, Rule 1)
- Document ordering expectations with comments (05-rules.md, Rule 2)
- Avoid inter-provider coupling (05-rules.md, Rule 4)

---

## Related Skills

- Structure Service Provider register() Methods (register-phase-order)

---

## Decision Name: Binding Override Management

---

## Decision Context

Handling situations where two providers bind the same abstract — determining whether the override is intentional or accidental, and how to control which binding wins.

---

## Decision Criteria

* performance — no meaningful impact
* architectural — last registered provider wins for the same binding key
* security — accidental overrides can replace auth or security services
* maintainability — silent overrides are a common source of bugs

---

## Decision Tree

Do two providers bind the same abstract?
↓
YES → Is the override intentional (e.g., replacing a package service with a custom implementation)?
YES → Ensure the overriding provider registers AFTER the overridden provider in the merge order
NO → Is the abstract a security-sensitive service (auth, guard, encryption)?
↓
YES → Fix immediately — ensure the intended binding wins; add a test that verifies the concrete class
NO → Can the conflict be resolved with contextual binding?
↓
YES → Use `$app->when(Consumer::class)->needs(Abstract::class)->give(Concrete::class)` instead of global rebind
NO → Is the binding registered in a package provider that you cannot change?
↓
YES → Either add the package provider explicitly before your provider, or use `$app->extend()` to decorate
NO → Reorder providers or remove the duplicate binding

---

## Rationale

Two providers binding the same abstract is often unintentional. The last provider to register wins silently — if the wrong provider wins, the wrong implementation is used. Contextual binding is a better approach when different consumers need different implementations. `$app->extend()` is appropriate when you want to wrap/decorate an existing binding.

---

## Recommended Default

**Default:** Avoid duplicate bindings; use contextual binding when different implementations are needed for different consumers.
**Reason:** Silent overrides are difficult to debug and create maintenance surprises.

---

## Risks Of Wrong Choice

- Accidental override: the wrong service implementation is used silently — only discovered when behavior differs.
- Using `$app->extend()` to replace a binding: extend wraps, it does not replace — the original instance still exists inside the wrapper.
- Reordering providers to fix overrides: fragile — adding a new provider later may reintroduce the conflict.

---

## Related Rules

- No two providers bind the same abstract without explicit intent (05-rules.md, Rule 4)
- Document the override intent with comments (05-rules.md, Rule 3)

---

## Related Skills

- Manage Contextual Binding Timing (ku-04-contextual-binding-timing)
