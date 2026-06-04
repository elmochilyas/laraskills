# Metadata

**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Package Development
**Knowledge Unit:** Migration Publishing & Discovery
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Key Criteria | Default |
|---|----------|-------------|---------|
| 1 | Automatic loading vs published migrations? | Schema necessity, consumer control | Automatic loading + optional publishing |
| 2 | Single migration vs multiple named migrations? | Schema complexity, feature separation | One migration per schema concern |

---

# Architecture-Level Decision Trees

---

## Decision 1: Automatic Loading vs Published Migrations?

---

## Decision Context

Package migrations can be automatically loaded (via `loadMigrationsFrom()`) so they run directly from vendor, or published to the application's migrations directory. The choice affects convenience vs consumer control.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Are the package tables essential for core functionality?
↓
YES → **Automatic loading** — consumers should not have to remember to publish
NO (optional feature) → **Published only** — publish when consumer enables the feature
Regardless:
- Always provide automatic loading for mandatory tables
- Always make migrations publishable for customization
- Consumers who need to customize schema use published copies
- `down()` methods are mandatory for all migrations
- Table and index names must be prefixed with the package name

---

## Rationale

Automatic loading ensures the package works out of the box. Publishing gives consumers control over schema customization. Providing both options is the standard pattern used by Laravel Sanctum, Spatie packages, and most well-designed packages.

---

## Recommended Default

**Default:** Automatic loading (`loadMigrationsFrom()`) + optional publishing
**Reason:** Package works immediately; consumers can customize when needed

---

## Risks Of Wrong Choice

- **Publish-only:** Consumers forget to publish; package tables are missing; poor first experience
- **Automatic-only:** Consumers can't customize table names, add indexes, or modify schema

---

## Related Rules

- TEMPLATE-RULE-006: Distribution method

---

## Related Skills

- Build Internal Template Registries for Laravel Projects

---

## Decision 2: Single Migration vs Multiple Named Migrations?

---

## Decision Context

Package migrations can be a single file creating all tables or multiple named migrations for each schema concern. The choice affects upgrade flexibility and selective publishing.

---

## Decision Criteria

* maintainability

---

## Decision Tree

How many tables does the package create?
↓
1-3 → Single migration file is simpler
4+ → ↓
Are some tables optional (feature-specific)?
↓
YES → **Multiple named migrations** — optional tables published separately
NO → **Single migration** — all core tables in one file
Regardless:
- Use deterministic timestamps (Spatie pattern) so re-publishing doesn't create duplicates
- Prefix migration file names with package version (e.g., `v1_0_create_foo_table.php`)
- Test migrations in CI with fresh SQLite in-memory database
- Schema additions = PATCH release; schema removals = MAJOR release

---

## Rationale

Multiple named migrations enable consumers to selectively apply optional features. Single migration is simpler for packages where all tables are always needed. Named migrations also make version-specific schema changes clearer.

---

## Recommended Default

**Default:** Single migration for packages with 1-3 mandatory tables; named migrations for 4+ or optional feature tables
**Reason:** Balances simplicity with flexibility; consumers can selectively apply feature migrations

---

## Risks Of Wrong Choice

- **Single migration with optional tables:** Consumers must accept all tables even if they don't need the feature
- **Too many migrations:** Confusing for consumers; 20+ small migration files for minor schema changes

---

## Related Rules

- TEMPLATE-RULE-009: Test all templates in CI

---

## Related Skills

- Build Internal Template Registries for Laravel Projects

