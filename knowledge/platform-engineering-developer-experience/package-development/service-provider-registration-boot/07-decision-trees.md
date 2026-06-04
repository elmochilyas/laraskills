# Metadata

**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Package Development
**Knowledge Unit:** Service Provider Registration (register vs boot)
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Key Criteria | Default |
|---|----------|-------------|---------|
| 1 | Register vs boot — where does this registration go? | Dependency on resolved services | register() for bindings; boot() for resolved services |
| 2 | Eager vs deferred provider? | Boot logic necessity, performance | Deferred for binding-only; eager for boot logic |

---

# Architecture-Level Decision Trees

---

## Decision 1: Register vs Boot — Where Does This Go?

---

## Decision Context

The two-phase lifecycle means some operations must happen in `register()` (bindings, config merging) and others in `boot()` (views, routes, events, commands). Misplacing operations causes subtle bugs.

---

## Decision Criteria

* architectural
* performance

---

## Decision Tree

Does the operation depend on resolved application services (config, events, router, cache)?
↓
YES → **boot()** — services are available; use method injection for required services
NO → ↓
Is it binding classes into the container or merging config?
↓
YES → **register()** — bindings and mergeConfigFrom() belong here
NO → ↓
Is it registering views, routes, migrations, commands, events, or middleware?
↓
YES → **boot()** — these depend on services registered by other providers
NO → ↓
Is it conditional registration (environment checks, console detection)?
↓
YES → **boot()** — environment not fully available in register()
NO → If unsure, default to **boot()** — safer than register() for most operations

---

## Rationale

The golden rule: `register()` for binding things into the container; `boot()` for everything else. Never resolve services in `register()` because not all providers have registered yet. Using `boot()` for registration logic that depends on other providers prevents ordering bugs.

---

## Recommended Default

**Default:** Use `register()` only for bindings and `mergeConfigFrom()`; put everything else in `boot()`
**Reason:** `boot()` guarantees all providers have registered; prevents ordering-dependent bugs

---

## Risks Of Wrong Choice

- **Config merging in boot():** Config unavailable to other providers' boot() methods
- **View/route registration in register():** Depends on services not yet registered; fails silently
- **Container resolution in register():** Services may not exist yet; runtime errors

---

## Related Rules

- TEMPLATE-RULE-006: Distribution method

---

## Related Skills

- Build Internal Template Registries for Laravel Projects

---

## Decision 2: Eager vs Deferred Provider?

---

## Decision Context

Deferred providers delay loading until their bindings are actually resolved. This reduces boot time and memory. The choice depends on whether boot-time registration is needed.

---

## Decision Criteria

* performance

---

## Decision Tree

Does the provider need to execute any boot-time registration (views, routes, events, commands)?
↓
YES → **Eager provider** — boot logic must run every request
NO → ↓
Does the provider only register bindings (interface-to-class, singletons)?
↓
YES → **Deferred provider** — set `protected $defer = true`; implement `provides()`
NO → ↓
Can the boot logic be moved to lazy evaluation (event listeners, command handlers)?
↓
YES → **Deferred provider** with lazy evaluation for what was in boot()
NO → **Eager provider** — some boot logic is unavoidable

---

## Rationale

Deferred providers are the simplest performance optimization for packages. Any provider that doesn't need boot-time registration should be deferred. The savings compound across 50+ installed packages, reducing baseline boot time significantly.

---

## Recommended Default

**Default:** Deferred for binding-only providers; eager only when boot logic is needed
**Reason:** Reduces boot time and memory at negligible development cost

---

## Risks Of Wrong Choice

- **Eager for binding-only:** Wastes boot time on every request even when bindings are never used
- **Deferred with boot logic:** Boot method silently never executes; all boot-time registration is lost

---

## Related Rules

- TEMPLATE-RULE-006: Distribution method

---

## Related Skills

- Build Internal Template Registries for Laravel Projects

