# Metadata

**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Package Development
**Knowledge Unit:** Package Service Provider Patterns
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Key Criteria | Default |
|---|----------|-------------|---------|
| 1 | Eager vs deferred provider? | Boot logic needs, performance | Deferred for binding-only; eager for boot logic |
| 2 | Spatie tools vs manual provider? | Complexity, boilerplate, maintenance | Spatie tools for most packages |

---

# Architecture-Level Decision Trees

---

## Decision 1: Eager vs Deferred Provider?

---

## Decision Context

Deferred providers are only loaded when their bindings are resolved, reducing boot time. Eager providers load on every request. The choice depends on whether the provider has boot-time registration logic.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Does the provider need to execute boot-time registration (views, routes, migrations, events)?
↓
YES → **Eager provider** — boot logic must run on every request
NO → ↓
Does the provider only register bindings (interface-to-class mappings)?
↓
YES → **Deferred provider** — set `protected $defer = true`; implement `provides()`
NO → Evaluate if boot logic can be moved to lazy evaluation or event listeners
Regardless:
- Deferred providers cannot have `boot()` methods
- Deferred providers reduce boot time for requests that don't use the bindings
- The first resolution of a deferred binding incurs the provider's `register()` time
- For packages used on most pages, eager loading adds negligible overhead

---

## Rationale

Deferred providers are one of the most underutilized performance optimizations. Any provider that only registers bindings should be deferred. The performance savings compound across 50+ installed packages.

---

## Recommended Default

**Default:** Deferred for binding-only providers; eager when boot logic is needed
**Reason:** Deferred providers reduce boot time and memory usage at negligible development cost

---

## Risks Of Wrong Choice

- **Eager for binding-only:** Unnecessary boot time overhead on every request
- **Deferred with boot logic:** Boot method silently never executes; features don't work

---

## Related Rules

- TEMPLATE-RULE-006: Distribution method

---

## Related Skills

- Build Internal Template Registries for Laravel Projects

---

## Decision 2: Spatie Tools vs Manual Provider?

---

## Decision Context

Spatie's `PackageServiceProvider` provides a declarative DSL for package registration. Manual providers require calling each registration method directly. The choice affects boilerplate and maintainability.

---

## Decision Criteria

* maintainability
* architectural

---

## Decision Tree

Does the package need multiple registrations (config + views + migrations + commands + components)?
↓
YES → **Use Spatie tools** — eliminates 50-100 lines of boilerplate
NO → ↓
Is it a very simple package with only a config file?
↓
YES → Manual provider may be lighter; Spatie tools add a dependency
NO → ↓
Does the package require exotic registration not covered by Spatie's DSL?
↓
YES → Manual provider with custom registration logic
NO → **Use Spatie tools** — even for moderately complex packages
Regardless:
- Always call `parent::register()` and `parent::boot()` when extending
- Don't mix Spatie DSL with manual registration calls for the same resource
- Spatie tools cover ~95% of registration scenarios

---

## Rationale

Spatie tools convert 50-100 lines of repetitive registration code into 10-20 lines of declarative DSL. This reduces bugs, improves readability, and standardizes package structure. The dependency is lightweight and adds negligible overhead.

---

## Recommended Default

**Default:** Use Spatie Laravel Package Tools for most packages
**Reason:** Reduces boilerplate, improves maintainability, and follows community best practices

---

## Risks Of Wrong Choice

- **Manual provider for complex packages:** Hundreds of lines of repetitive registration; bugs from missing calls
- **Spatie tools for simplest packages:** Unnecessary dependency; single-config packages don't benefit much

---

## Related Rules

- TEMPLATE-RULE-006: Distribution method

---

## Related Skills

- Build Internal Template Registries for Laravel Projects

