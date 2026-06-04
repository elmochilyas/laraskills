# Decomposition: Deployer PHP

## Topic Overview
Deployer is an open-source PHP deployment tool that automates zero-downtime deployments via symlink swap, similar to Envoyer but self-hosted and free. It uses a `deploy.php` recipe file with tasks for Laravel-specific operations (`artisan:cache`, `migrate`, `npm:build`). Supports multi-server deployments, atomic rollbacks, and integration with any CI/CD system.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
canary-deployment/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Deployer PHP
- **Purpose:** Deployer is an open-source PHP deployment tool that automates zero-downtime deployments via symlink swap, similar to Envoyer but self-hosted and free.
- **Difficulty:** Intermediate
- **Dependencies:** Envoyer Zero-Downtime Deployments (KU-003) — paid alternative, GitHub Actions CI/CD (KU-008) — CI integration with Deployer, Laravel Forge Provisioning (KU-001) — servers deployable by Deployer, Database Migration in CI (KU-019) — migration strategy with Deployer

## Dependency Graph
**Depends on:**
- Envoyer Zero-Downtime Deployments (KU-003) — paid alternative
- GitHub Actions CI/CD (KU-008) — CI integration with Deployer
- Laravel Forge Provisioning (KU-001) — servers deployable by Deployer
- Database Migration in CI (KU-019) — migration strategy with Deployer

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Recipe-based deployment approach
- Symlink swap atomic cutover
- Multi-server parallel deployment
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- Envoyer Zero-Downtime Deployments (KU-003) — paid alternative, GitHub Actions CI/CD (KU-008) — CI integration with Deployer, Laravel Forge Provisioning (KU-001) — servers deployable by Deployer, Database Migration in CI (KU-019) — migration strategy with Deployer

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
