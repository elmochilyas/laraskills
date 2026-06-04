# Decomposition: laravel monorepo tools

## Topic Overview

Laravel monorepo tools manage multiple packages or applications within a single Git repository while enabling independent versioning and distribution of each component. The primary tool is `symplify/monorepo-split` (formerly `symplify/monorepo-builder`), which handles: split testing (splitting the monorepo's subdirectories into individual Git repositories), dependency management (keeping shared dependencies synchronized), and release management (tagging packages with independent versions). Th...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
laravel-monorepo-tools/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### laravel monorepo tools
- **Purpose:** Laravel monorepo tools manage multiple packages or applications within a single Git repository while enabling independent versioning and distribution of each component. The primary tool is `symplify/monorepo-split` (formerly `symplify/monorepo-builder`), which handles: split testing (splitting the monorepo's subdirectories into individual Git repositories), dependency management (keeping shared dependencies synchronized), and release management (tagging packages with independent versions). Th...
- **Difficulty:** Foundation
- **Dependencies:** split-testing-monorepo-packages, monorepo-ci-optimization, and composer-path-repository-usage

## Dependency Graph
**Depends on:** split-testing-monorepo-packages, monorepo-ci-optimization, and composer-path-repository-usage
**Depended on by:** Knowledge units that leverage or extend laravel monorepo tools patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for laravel monorepo tools.
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