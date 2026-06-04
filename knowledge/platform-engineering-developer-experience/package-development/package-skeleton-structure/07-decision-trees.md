# Metadata

**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Package Development
**Knowledge Unit:** Package Skeleton Structure
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Key Criteria | Default |
|---|----------|-------------|---------|
| 1 | Public skeleton vs organizational fork? | Org package count, standards | Public skeleton for individuals; fork for orgs with 5+ packages |
| 2 | Single package vs monorepo structure? | Number of packages, shared tooling | Single skeleton for independent packages |

---

# Architecture-Level Decision Trees

---

## Decision 1: Public Skeleton vs Organizational Fork?

---

## Decision Context

The Spatie package skeleton provides the standard structure. Organizations can use it directly or maintain a private fork with org-specific defaults. The choice depends on the number of internal packages and standardization needs.

---

## Decision Criteria

* maintainability

---

## Decision Tree

How many internal Laravel packages does the organization maintain?
↓
< 5 → **Use public Spatie skeleton** directly; configure per-package
5+ → ↓
Do the packages share common patterns (namespace prefix, CI templates, code review checklist)?
↓
NO → Public skeleton with per-package configuration is sufficient
YES → **Maintain a private fork** of the skeleton with org-specific defaults
Regardless:
- Run the configure script immediately after cloning
- Maintain `.gitattributes` with `export-ignore` rules
- Periodically merge upstream skeleton changes

---

## Rationale

A private skeleton fork standardizes package structure across the organization, reducing setup time and ensuring consistency. Below 5 packages, the maintenance of a private fork exceeds the benefit.

---

## Recommended Default

**Default:** Use public Spatie skeleton for < 5 packages; maintain org fork for 5+
**Reason:** Private fork maintenance cost is justified when creating multiple packages with shared patterns

---

## Risks Of Wrong Choice

- **No private fork at scale (10+):** Inconsistent package structures; each dev reconfigures from scratch
- **Private fork too early (1-2):** Fork maintenance overhead; upstream merge conflicts

---

## Related Rules

- TEMPLATE-RULE-006: Distribution method

---

## Related Skills

- Build Internal Template Registries for Laravel Projects

---

## Decision 2: Single Package vs Monorepo Structure?

---

## Decision Context

Multiple related packages can be maintained as individual repositories (each with its own skeleton) or in a monorepo. The choice affects CI complexity and versioning coordination.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Are the packages independently versioned and released on different schedules?
↓
YES → **Individual skeletons** — each package independently maintained
NO → ↓
Do the packages share significant code or depend on each other?
↓
NO → Individual skeletons; no benefit from monorepo
YES → ↓
Does the team have CI capacity for monorepo split testing?
↓
NO → Individual skeletons; monorepo CI is complex
YES → **Monorepo structure** with custom skeleton and split workflows

---

## Rationale

Individual skeletons are simpler for independent packages. Monorepos reduce duplication but add CI complexity (split testing, coordinated releases). Most teams benefit from individual skeletons.

---

## Recommended Default

**Default:** Individual skeletons for independently versioned packages
**Reason:** Simpler CI, independent release cadences, no split tooling needed

---

## Risks Of Wrong Choice

- **Monorepo with independent packages:** Complex CI; versioning conflicts; hard to manage
- **Individual repos with tight coupling:** Dependency management across repos; hard to test together

---

## Related Rules

- TEMPLATE-RULE-005: Template format
- TEMPLATE-RULE-009: Test all templates in CI

---

## Related Skills

- Build Internal Template Registries for Laravel Projects

