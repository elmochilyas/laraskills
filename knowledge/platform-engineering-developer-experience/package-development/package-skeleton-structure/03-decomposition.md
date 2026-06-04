# Decomposition: package skeleton structure

## Topic Overview

A Laravel package skeleton provides the canonical directory structure, configuration files, and development tooling for creating a new package. The de facto standard is `spatie/package-skeleton-laravel`, which includes: PSR-4 autoloading configuration, GitHub Actions CI, PHP-CS-Fixer/Pint configuration, PHPStan configuration, Orchetra Testbench integration, and a `composer.json` with dependency boilerplate. The skeleton's structure—`src/`, `config/`, `database/migrations/`, `resources/views...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
package-skeleton-structure/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### package skeleton structure
- **Purpose:** A Laravel package skeleton provides the canonical directory structure, configuration files, and development tooling for creating a new package. The de facto standard is `spatie/package-skeleton-laravel`, which includes: PSR-4 autoloading configuration, GitHub Actions CI, PHP-CS-Fixer/Pint configuration, PHPStan configuration, Orchetra Testbench integration, and a `composer.json` with dependency boilerplate. The skeleton's structure—`src/`, `config/`, `database/migrations/`, `resources/views...
- **Difficulty:** Foundation
- **Dependencies:** spatie-laravel-package-tools, package-service-provider-patterns, and package-testing-orchestra-testbench

## Dependency Graph
**Depends on:** spatie-laravel-package-tools, package-service-provider-patterns, and package-testing-orchestra-testbench
**Depended on by:** Knowledge units that leverage or extend package skeleton structure patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for package skeleton structure.
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