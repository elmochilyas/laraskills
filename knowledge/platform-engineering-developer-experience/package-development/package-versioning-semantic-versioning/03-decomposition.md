# Decomposition: package versioning semantic versioning

## Topic Overview

Semantic Versioning (SemVer) for Laravel packages follows the MAJOR.MINOR.PATCH convention where MAJOR increments for breaking changes, MINOR for backward-compatible features, and PATCH for backward-compatible bug fixes. For Laravel packages specifically, versioning extends beyond the package's own API to include compatibility with Laravel and PHP versions. The Laravel ecosystem has established conventions for version alignment (e.g., `1.x` for Laravel 11 compatible, `2.x` for Laravel 12 comp...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
package-versioning-semantic-versioning/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### package versioning semantic versioning
- **Purpose:** Semantic Versioning (SemVer) for Laravel packages follows the MAJOR.MINOR.PATCH convention where MAJOR increments for breaking changes, MINOR for backward-compatible features, and PATCH for backward-compatible bug fixes. For Laravel packages specifically, versioning extends beyond the package's own API to include compatibility with Laravel and PHP versions. The Laravel ecosystem has established conventions for version alignment (e.g., `1.x` for Laravel 11 compatible, `2.x` for Laravel 12 comp...
- **Difficulty:** Foundation
- **Dependencies:** private-packagist-satis-setup, package-skeleton-structure, and dependency-update-automation

## Dependency Graph
**Depends on:** private-packagist-satis-setup, package-skeleton-structure, and dependency-update-automation
**Depended on by:** Knowledge units that leverage or extend package versioning semantic versioning patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for package versioning semantic versioning.
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