# Metadata

**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Package Development
**Knowledge Unit:** Spatie Laravel Package Tools
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Key Criteria | Default |
|---|----------|-------------|---------|
| 1 | Should we use Spatie Package Tools? | Complexity, dependency budget | Yes — for any package with config/migrations/views/commands |
| 2 | Spatie tools vs manual for simple packages? | Dependency overhead, boilerplate | Default to Spatie tools; manual only for simplest cases |

---

# Architecture-Level Decision Trees

---

## Decision 1: Should We Use Spatie Package Tools?

---

## Decision Context

Spatie Laravel Package Tools abstracts boilerplate registration into a declarative DSL. It adds a dependency but eliminates 50-100 lines of repetitive code. The decision depends on package complexity.

---

## Decision Criteria

* maintainability
* architectural

---

## Decision Tree

Does the package need any of: config, migrations, views, Blade components, translations, commands, install command?
↓
NO → Evaluate if a manual provider is simpler
YES → ↓
Is the package extremely simple (single config file, no other resources)?
↓
YES → Manual provider may be lighter; Spatie's dependency may not be justified
NO → **Use Spatie Package Tools** — it's the standard for Laravel packages
Regardless:
- Always call `parent::register()` and `parent::boot()` when extending
- Don't mix Spatie DSL with manual calls for the same resource
- Spatie covers ~95% of registration scenarios

---

## Rationale

Spatie tools have been adopted by hundreds of packages and are battle-tested. The dependency is lightweight and the productivity gain is substantial for any package with multiple resource types. Even moderate packages benefit from the declarative approach.

---

## Recommended Default

**Default:** Use Spatie Package Tools for any package with config + at least one other resource type
**Reason:** Reduces boilerplate, standardizes structure, follows community best practices

---

## Risks Of Wrong Choice

- **Not using Spatie:** 50-100 lines of repetitive registration; easier to miss registration calls
- **Using Spatie for nothing package:** Unnecessary dependency for packages that register nothing

---

## Related Rules

- TEMPLATE-RULE-006: Distribution method

---

## Related Skills

- Build Internal Template Registries for Laravel Projects

---

## Decision 2: Spatie Tools vs Manual for Simple Packages?

---

## Decision Context

For a package with only a config file and nothing else, Spatie tools may be overkill. The choice is between a clean DSL and avoiding a dependency.

---

## Decision Criteria

* maintainability

---

## Decision Tree

What are the package's registration needs?
↓
**Only config file** (no views, migrations, commands, etc.)
↓
Manual provider is fine: `mergeConfigFrom()` + `publishes()` in ~10 lines
↕
**Config + 1 other (migrations or views or commands)**
↓
**Use Spatie tools** — threshold crossed; DSL simplifies even moderate packages
↕
**Config + 2+ others**
↓
**Always use Spatie tools** — eliminates significant boilerplate
Regardless:
- Spatie tools also provide `hasInstallCommand()` which is valuable for any package with publishable resources
- Consider future growth: if the package may add migrations or views later, use Spatie tools from the start

---

## Rationale

Single-config packages are simple enough that Spatie tools add more overhead than they save. However, as soon as a second resource type is added, Spatie tools become worthwhile. Starting with Spatie tools is forward-compatible.

---

## Recommended Default

**Default:** Use Spatie tools for all packages except single-config-only packages
**Reason:** Even moderate packages benefit from the DSL; starting with Spatie avoids later migration

---

## Risks Of Wrong Choice

- **Manual for moderate packages:** Growing boilerplate; eventually need to refactor to Spatie
- **Spatie for nothing package:** Unnecessary dependency; `composer require` footprint grows

---

## Related Rules

- TEMPLATE-RULE-005: Format — Blade syntax
- TEMPLATE-RULE-006: Distribution method

---

## Related Skills

- Build Internal Template Registries for Laravel Projects

