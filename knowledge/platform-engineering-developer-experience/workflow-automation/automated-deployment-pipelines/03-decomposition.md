# Decomposition: automated deployment pipelines

## Topic Overview

Automated deployment pipelines for Laravel are CI/CD workflows that automatically deploy application changes to staging and production environments after passing quality gates (tests, static analysis, code style). The Laravel ecosystem offers multiple deployment targets: Laravel Forge (traditional VPS), Laravel Vapor (serverless AWS Lambda), Envoyer (zero-downtime deployments), and custom Docker-based deployments. An automated pipeline typically includes: building the application (composer in...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
automated-deployment-pipelines/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### automated deployment pipelines
- **Purpose:** Automated deployment pipelines for Laravel are CI/CD workflows that automatically deploy application changes to staging and production environments after passing quality gates (tests, static analysis, code style). The Laravel ecosystem offers multiple deployment targets: Laravel Forge (traditional VPS), Laravel Vapor (serverless AWS Lambda), Envoyer (zero-downtime deployments), and custom Docker-based deployments. An automated pipeline typically includes: building the application (composer in...
- **Difficulty:** Foundation
- **Dependencies:** github-actions-for-laravel, automated-testing-in-ci, and automated-changelog-generation

## Dependency Graph
**Depends on:** github-actions-for-laravel, automated-testing-in-ci, and automated-changelog-generation
**Depended on by:** Knowledge units that leverage or extend automated deployment pipelines patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for automated deployment pipelines.
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