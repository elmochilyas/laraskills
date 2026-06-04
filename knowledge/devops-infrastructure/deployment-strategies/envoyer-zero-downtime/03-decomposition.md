# Decomposition: Envoyer Zero-Downtime Deployments

## Topic Overview
Envoyer is a first-party zero-downtime deployment service for Laravel and PHP applications. It uses a symlink-swap strategy: new code is cloned into an isolated directory, dependencies are installed, and only after successful preparation does an atomic symlink update make the new release live. Envoyer supports multi-server deployments, health check verification, instant rollbacks, and integrates with GitHub/GitLab/Bitbucket.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
envoyer-zero-downtime/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Envoyer Zero-Downtime Deployments
- **Purpose:** Envoyer is a first-party zero-downtime deployment service for Laravel and PHP applications.
- **Difficulty:** Intermediate
- **Dependencies:** Laravel Octane Deployment (KU-006) — replaces need for Envoyer, Deployer PHP (KU-008) — open-source alternative, Database Migration in CI (KU-019), Laravel Forge Provisioning (KU-001) — server layer for Envoyer

## Dependency Graph
**Depends on:**
- Laravel Octane Deployment (KU-006) — replaces need for Envoyer
- Deployer PHP (KU-008) — open-source alternative
- Database Migration in CI (KU-019)
- Laravel Forge Provisioning (KU-001) — server layer for Envoyer

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Atomic symlink swap:** The core mechanism. A `current` symlink points to the act
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- Laravel Octane Deployment (KU-006) — replaces need for Envoyer, Deployer PHP (KU-008) — open-source alternative, Database Migration in CI (KU-019), Laravel Forge Provisioning (KU-001) — server layer for Envoyer

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