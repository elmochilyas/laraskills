# Metadata

**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Package Development
**Knowledge Unit:** Private Packagist / Satis Setup
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Key Criteria | Default |
|---|----------|-------------|---------|
| 1 | Private Packagist vs Satis? | Budget, features, ops capacity | Private Packagist for ease; Satis for air-gapped |
| 2 | Path repository vs private registry for development? | Concurrent development, isolation | Path repos for local dev; private registry for distribution |

---

# Architecture-Level Decision Trees

---

## Decision 1: Private Packagist vs Satis?

---

## Decision Context

Private Packagist (SaaS) and Satis (self-hosted open source) both serve internal packages. The choice depends on budget, features needed, and operational capacity.

---

## Decision Criteria

* maintainability
* security

---

## Decision Tree

How many internal packages need distribution?
↓
1-2 → Path repositories in `composer.json` may suffice without a registry
3+ → ↓
Does the organization have budget for a SaaS service?
↓
NO → ↓
Are there air-gapped/offline requirements?
↓
YES → **Satis** — self-hosted, no external dependencies
NO → **Satis** — minimal cost (server only); automate build via CI
YES → ↓
Is security vulnerability scanning needed?
↓
YES → **Private Packagist** — built-in scanning; major value-add
NO → ↓
Is team management and access control important?
↓
YES → **Private Packagist** — built-in user management
NO → ↓
**Private Packagist** — maintenance savings usually justify the cost

---

## Rationale

Private Packagist's SaaS model eliminates server maintenance, CI build pipelines, and authentication management. Satis is viable when budget or compliance requires self-hosting. The cost of Private Packagist is typically less than the engineering time to maintain Satis.

---

## Recommended Default

**Default:** Private Packagist for most teams (budget permitting)
**Reason:** Eliminates server maintenance, CI build automation, and authentication management

---

## Risks Of Wrong Choice

- **Satis without CI builds:** Stale registry serves outdated versions; confused consumers
- **Private Packagist in air-gapped:** External dependency may violate compliance requirements
- **Path repos for distribution:** Only works locally; can't distribute to other team members

---

## Related Rules

- TEMPLATE-RULE-006: Distribution method

---

## Related Skills

- Build Internal Template Registries for Laravel Projects

---

## Decision 2: Path Repository vs Private Registry for Development?

---

## Decision Context

During development, packages can be consumed via local path repositories or from the private registry. The choice affects development iteration speed and testing realism.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Are you actively developing both the package and the consuming application simultaneously?
↓
YES → **Use path repository** for local development iteration
NO → ↓
Are you testing the exact version that CI/production will resolve?
↓
YES → Use private registry (same resolution as deployment)
NO → Use path repository for speed; switch to registry before release
Development workflow:
- Local dev: `"type": "path"` in repositories for instant feedback
- CI/Staging: Private registry for realistic dependency resolution
- Production: Private registry with lock file

---

## Rationale

Path repositories provide instant feedback (no `composer update` needed for changes) and are essential for concurrent package + application development. However, they bypass Composer's dependency resolution, so final testing must use the registry.

---

## Recommended Default

**Default:** Path repos for local development; private registry for CI and production
**Reason:** Fastest iteration during development; realistic dependency resolution in CI

---

## Risks Of Wrong Choice

- **Registry-only for development:** Slow iteration; every change requires `composer update`
- **Path-only for production:** No proper version resolution; breaks for other developers

---

## Related Rules

- TEMPLATE-RULE-005: Template format

---

## Related Skills

- Build Internal Template Registries for Laravel Projects

