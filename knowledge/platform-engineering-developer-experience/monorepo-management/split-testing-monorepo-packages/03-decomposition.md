# Decomposition: split testing monorepo packages

## Topic Overview

Split testing is the process of extracting specific subdirectories of a monorepo into their own independent Git repositories, enabling independent versioning, CI/CD, and distribution of each component. The primary tool is `symplify/monorepo-split`, which uses Git subtree operations to push a subdirectory's history to a target repository. Each split repository maintains its own full Git history (filtered to that subdirectory's changes) and can be versioned and released independently. In the La...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
split-testing-monorepo-packages/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### split testing monorepo packages
- **Purpose:** Split testing is the process of extracting specific subdirectories of a monorepo into their own independent Git repositories, enabling independent versioning, CI/CD, and distribution of each component. The primary tool is `symplify/monorepo-split`, which uses Git subtree operations to push a subdirectory's history to a target repository. Each split repository maintains its own full Git history (filtered to that subdirectory's changes) and can be versioned and released independently. In the La...
- **Difficulty:** Foundation
- **Dependencies:** laravel-monorepo-tools, monorepo-ci-optimization, and composer-path-repository-usage

## Dependency Graph
**Depends on:** laravel-monorepo-tools, monorepo-ci-optimization, and composer-path-repository-usage
**Depended on by:** Knowledge units that leverage or extend split testing monorepo packages patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for split testing monorepo packages.
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