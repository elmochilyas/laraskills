# Decomposition: github actions cicd

## Topic Overview

GitHub Actions is the standard CI/CD platform for Laravel projects in 2026, providing workflow automation for linting, static analysis, testing, and deployment. A typical Laravel CI pipeline includes four stages: lint/style (Pint), static analysis (PHPStan/Larastan), test suite (parallel, potentially sharded), and deployment (zero-downtime via Deployer or Forge). GitHub Actions supports matrix testing (PHP versions × database engines), parallel test sharding, artifact caching (Composer, npm)...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
github-actions-cicd/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### github actions cicd
- **Purpose:** GitHub Actions is the standard CI/CD platform for Laravel projects in 2026, providing workflow automation for linting, static analysis, testing, and deployment. A typical Laravel CI pipeline includes four stages: lint/style (Pint), static analysis (PHPStan/Larastan), test suite (parallel, potentially sharded), and deployment (zero-downtime via Deployer or Forge). GitHub Actions supports matrix testing (PHP versions × database engines), parallel test sharding, artifact caching (Composer, npm)...
- **Difficulty:** Foundation
- **Dependencies:** **Prerequisites**: GitHub basics, YAML syntax, Laravel environment configuration, **Related Topics**: Matrix testing, Parallel test sharding, Path-based triggering, Zero-downtime deployment, **Advanced Follow-up**: Self-hosted runners, GitHub Actions security hardening, and Composite actions for Laravel

## Dependency Graph
**Depends on:** **Prerequisites**: GitHub basics, YAML syntax, Laravel environment configuration, **Related Topics**: Matrix testing, Parallel test sharding, Path-based triggering, Zero-downtime deployment, **Advanced Follow-up**: Self-hosted runners, GitHub Actions security hardening, and Composite actions for Laravel
**Depended on by:** Knowledge units that leverage or extend github actions cicd patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for github actions cicd.
**Out of scope:** Adjacent topics covered in their own knowledge units; advanced or specialized use cases that extend beyond the core scope.

## Future Expansion Opportunities
None identified — the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization