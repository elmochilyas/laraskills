# Decomposition: Database Migration in CI

## Topic Overview
Running database migrations as part of the CI/CD pipeline is a critical practice for Laravel deployments. Migrations must be idempotent (safe to run multiple times), run with `--force` to bypass production confirmation prompt, and execute in the correct order relative to code deployment. The fundamental tension: new code needs new schema, but during deployment both old and new code may run simultaneously (zero-downtime).

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
database-migration-ci/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Database Migration in CI
- **Purpose:** Running database migrations as part of the CI/CD pipeline is a critical practice for Laravel deployments.
- **Difficulty:** Intermediate
- **Dependencies:** Zero-Downtime Migration Strategies (KU-020) — advanced patterns for large schema changes, Envoyer Zero-Downtime Deployments (KU-003) — migration ordering in deployment flow, Kubernetes for Laravel (KU-013) — migration Job pattern, Laravel Vapor (KU-015) — migration in deploy hooks

## Dependency Graph
**Depends on:**
- Zero-Downtime Migration Strategies (KU-020) — advanced patterns for large schema changes
- Envoyer Zero-Downtime Deployments (KU-003) — migration ordering in deployment flow
- Kubernetes for Laravel (KU-013) — migration Job pattern
- Laravel Vapor (KU-015) — migration in deploy hooks

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Idempotent migrations:** Each migration should be safe to run multiple times. Us
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- Zero-Downtime Migration Strategies (KU-020) — advanced patterns for large schema changes, Envoyer Zero-Downtime Deployments (KU-003) — migration ordering in deployment flow, Kubernetes for Laravel (KU-013) — migration Job pattern, Laravel Vapor (KU-015) — migration in deploy hooks

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization