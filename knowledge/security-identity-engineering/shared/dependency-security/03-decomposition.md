# Decomposition: dependency security

## Topic Overview

Dependency security in Laravel relies on `composer audit` (built-in since Composer 2.4) and automated tools like Dependabot (GitHub) or Renovate. `composer audit` checks your `composer.lock` against the PHP Security Advisories Database for known vulnerabilities. Dependabot automatically creates PRs when vulnerable dependencies are detected. The primary practice: run `composer audit` in CI, fail the pipeline on known vulnerabilities, and use Dependabot/Renovate for automated patch updates.  ---

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
dependency-security/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### dependency security
- **Purpose:** Dependency security in Laravel relies on `composer audit` (built-in since Composer 2.4) and automated tools like Dependabot (GitHub) or Renovate. `composer audit` checks your `composer.lock` against the PHP Security Advisories Database for known vulnerabilities. Dependabot automatically creates PRs when vulnerable dependencies are detected. The primary practice: run `composer audit` in CI, fail the pipeline on known vulnerabilities, and use Dependabot/Renovate for automated patch updates.  ---
- **Difficulty:** Foundation
- **Dependencies:** Prerequisites: Composer dependency management, CI/CD pipeline basics, Related: Enlightn static/dynamic security analysis, Laravel-Shield security scanning CLI, Advanced Follow-up: SBOM (Software Bill of Materials) generation, Container image scanning, and Vulnerability scoring (CVSS) and prioritization

## Dependency Graph
**Depends on:** Prerequisites: Composer dependency management, CI/CD pipeline basics, Related: Enlightn static/dynamic security analysis, Laravel-Shield security scanning CLI, Advanced Follow-up: SBOM (Software Bill of Materials) generation, Container image scanning, and Vulnerability scoring (CVSS) and prioritization
**Depended on by:** Knowledge units that leverage or extend dependency security patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for dependency security.
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