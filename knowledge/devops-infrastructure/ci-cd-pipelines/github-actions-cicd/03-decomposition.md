# Decomposition: GitHub Actions CI/CD for Laravel

## Topic Overview
GitHub Actions is the dominant CI/CD platform for Laravel, providing integrated testing and deployment workflows that trigger on Git events. A standard Laravel pipeline includes linting (Pint/PHP-CS-Fixer), static analysis (PHPStan), testing (Pest/PHPUnit with matrix PHP versions), asset building (npm/Vite), and deployment (via Forge API, Envoyer, Vapor CLI, Deployer, or Fly.io). The `setup-php` action manages PHP versions and extensions.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
github-actions-cicd/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### GitHub Actions CI/CD for Laravel
- **Purpose:** GitHub Actions is the dominant CI/CD platform for Laravel, providing integrated testing and deployment workflows that trigger on Git events.
- **Difficulty:** Intermediate
- **Dependencies:** GitLab CI for Laravel (KU-009) — alternative CI platform, Deployer PHP (KU-008) — deployment tool integrated via GitHub Actions, Laravel Vapor (KU-015) — deploy via Vapor CLI in GitHub Actions, Envoyer Zero-Downtime (KU-003) — deploy trigger via Envoyer API, Database Migration in CI (KU-019)

## Dependency Graph
**Depends on:**
- GitLab CI for Laravel (KU-009) — alternative CI platform
- Deployer PHP (KU-008) — deployment tool integrated via GitHub Actions
- Laravel Vapor (KU-015) — deploy via Vapor CLI in GitHub Actions
- Envoyer Zero-Downtime (KU-003) — deploy trigger via Envoyer API
- Database Migration in CI (KU-019)

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Trigger:
- Matrix:
- Services:
- Steps:
- Parallel jobs:
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- GitLab CI for Laravel (KU-009) — alternative CI platform, Deployer PHP (KU-008) — deployment tool integrated via GitHub Actions, Laravel Vapor (KU-015) — deploy via Vapor CLI in GitHub Actions, Envoyer Zero-Downtime (KU-003) — deploy trigger via Envoyer API, Database Migration in CI (KU-019)

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