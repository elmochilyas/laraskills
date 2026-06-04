# Conflict Detection Analysis

**Date:** 2026-06-04
**Scope:** rules/, knowledge/**/05-rules.md, intelligence/indexes/, agent/

---

## Summary

| Severity | Count | Resolved |
|----------|-------|----------|
| CRITICAL | 1 | No (requires architectural decision) |
| HIGH | 3 | No (requires architectural decision) |
| MEDIUM | 3 | No (requires clarification) |
| LOW | 1 | No (well-documented trade-off) |

**No automatic conflict resolutions were applied.**

---

## Conflict 1: Repositories vs Direct Eloquent (CRITICAL)

| Side | Source | Position |
|------|--------|----------|
| A | `rules/common/patterns.md` | Repository Pattern — encapsulate data access behind interfaces |
| B | `rules/laravel/eloquent.md` | Avoid generic `UserRepository` wrapping Eloquent |
| C | `knowledge/backend-architecture-design/clean-onion-architecture/` | Repository contracts mandatory in Domain circle |
| D | `rules/laravel/architecture.md` | Architecture flow mandates contracts between layers |
| E | `knowledge/application-architecture-patterns/use-case-classes/` | Use cases must depend on interfaces (no exceptions) |

**Analysis:** `rules/laravel/eloquent.md` says "avoid generic UserRepository that wraps Eloquent" but clean architecture rules mandate repository interfaces. An AI agent could be paralyzed by these contradictory mandates.

**Recommended Resolution:** Clarify that **thin CRUD-only Eloquent wrappers** are forbidden, but **domain-oriented repository interfaces** with business-significant methods (e.g., `findOverdueInvoices()`) are required.

---

## Conflict 2: Services vs Actions vs Use Cases (HIGH)

| Side | Source | Position |
|------|--------|----------|
| A | `rules/laravel/patterns.md` | Actions = single-purpose, Services = multi-step orchestration |
| B | `rules/laravel/architecture.md` | Controller → Action → Domain Service flow |
| C | `knowledge/application-architecture-patterns/action-classes/` | Actions are leaf nodes, must not call other actions |
| D | `knowledge/application-architecture-patterns/use-case-classes/` | Use Cases are a separate layer (above Actions and Services) |
| E | `knowledge/application-architecture-patterns/three-layer-architecture/` | Three-layer uses Services exclusively, no Actions |

**Recommended Resolution:** Add a single authoritative glossary in `rules/laravel/architecture.md` defining Action, Service, Use Case and when to choose each.

---

## Conflict 3: Three-Layer vs Clean/Hexagonal (HIGH)

| Side | Source | Position |
|------|--------|----------|
| A | `knowledge/application-architecture-patterns/three-layer-architecture/` | Start with three layers; avoid over-engineering |
| B | `knowledge/backend-architecture-design/clean-onion-architecture/` | Full Clean/Onion/Hexagonal with ports, adapters |
| C | `rules/laravel/architecture.md` | 5-layer hybrid with contracts |
| D | `rules/laravel/contracts.md` | Do NOT create interfaces for single-stable-implementation classes |

**Recommended Resolution:** Add explicit guidance in `rules/laravel/architecture.md` for when to graduate from three-layer to Clean Architecture.

---

## Conflict 4: Contract/Interface Proliferation (HIGH)

| Side | Source | Position |
|------|--------|----------|
| A | `rules/laravel/contracts.md` | Do NOT create interfaces for single-implementation classes |
| B | `rules/laravel/architecture.md` | Architecture flow shows contracts as mandatory layer |
| C | Knowledge (use-case-classes) | Use cases must depend on interfaces — no exceptions |

**Recommended Resolution:** Add the `contracts.md` decision matrix as a reference in `architecture.md`, clarifying that "contract" means "interface when multiple implementations exist or are expected."

---

## Conflict 5: Testing Ratios (MEDIUM)

| Side | Source | Position |
|------|--------|----------|
| A | `rules/laravel/testing.md`, `rules/laravel/patterns.md` | 80% feature tests, 20% unit tests |
| B | `knowledge/service-layer-testing/` | Write majority as unit tests; reserve feature tests for critical paths |

**Recommended Resolution:** Clarify that the 80/20 split applies to test types, and "feature tests" in Laravel context includes integration-level testing.

---

## Conflict 6: MySQL vs PostgreSQL (MEDIUM)

| Side | Source | Position |
|------|--------|----------|
| A | `rules/laravel/database.md` | Balanced MySQL and PostgreSQL sections |
| B | `rules/laravel/patterns.md` | References only "PostgreSQL" in database skill link |
| C | `rules/laravel/database.md` | Vector search is PostgreSQL-only |

**Recommended Resolution:** Add database selection decision tree in `rules/laravel/database.md`.

---

## Conflict 7: Validation Location (MEDIUM)

| Side | Source | Position |
|------|--------|----------|
| A | `rules/laravel/architecture.md` | "Controllers may validate requests" |
| B | `knowledge/three-layer-architecture/` | "NEVER call `$request->validate()` in controllers" |
| C | Knowledge (use-case-classes, value-objects) | Validation in Form Requests and Domain objects |

**Recommended Resolution:** Clarify that "validate requests" means "inject Form Requests," not inline `$request->validate()`.

---

## Conflict 8: Cache Versioning vs Tags (LOW)

| Side | Source | Position |
|------|--------|----------|
| A | `cost-resource-optimization/cache-warming-invalidation/` | "Use Cache::tags() for atomic group invalidation" |
| B | Same file | "Use Versioned Cache Keys for Deploy Safety" |

Both rules exist in the same file and acknowledge each other as valid alternatives. Well-documented trade-off.
