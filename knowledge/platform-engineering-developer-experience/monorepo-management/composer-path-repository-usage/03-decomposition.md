# Decomposition: composer path repository usage

## Topic Overview

Composer path repositories (`{"type": "path", "url": "packages/*"}`) enable local development of interdependent packages by symlinking the local package directory rather than downloading from a remote repository. In Laravel monorepos, path repositories are the primary mechanism for developing multiple packages simultaneously—when Package A depends on Package B, changes to Package B are immediately reflected in Package A without `composer update`. The path repository resolves to a local syml...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
composer-path-repository-usage/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### composer path repository usage
- **Purpose:** Composer path repositories (`{"type": "path", "url": "packages/*"}`) enable local development of interdependent packages by symlinking the local package directory rather than downloading from a remote repository. In Laravel monorepos, path repositories are the primary mechanism for developing multiple packages simultaneously—when Package A depends on Package B, changes to Package B are immediately reflected in Package A without `composer update`. The path repository resolves to a local syml...
- **Difficulty:** Foundation
- **Dependencies:** laravel-monorepo-tools, monorepo-ci-optimization, and shared-library-extraction-patterns

## Dependency Graph
**Depends on:** laravel-monorepo-tools, monorepo-ci-optimization, and shared-library-extraction-patterns
**Depended on by:** Knowledge units that leverage or extend composer path repository usage patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for composer path repository usage.
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