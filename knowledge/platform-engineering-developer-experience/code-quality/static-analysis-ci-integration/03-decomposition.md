# Decomposition: static analysis ci integration

## Topic Overview

Integrating static analysis (PHPStan with Larastan) into CI pipelines enforces type safety and catches potential bugs automatically on every push. The standard pattern is running `phpstan analyse --memory-limit=1G` as a CI step, failing the build if new errors are found. Advanced patterns include: baseline comparison (fail only on new errors), change-detection for incremental analysis, GitHub Actions annotations for inline error display in PR diffs, matrix testing across multiple PHP/Laravel ...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
static-analysis-ci-integration/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### static analysis ci integration
- **Purpose:** Integrating static analysis (PHPStan with Larastan) into CI pipelines enforces type safety and catches potential bugs automatically on every push. The standard pattern is running `phpstan analyse --memory-limit=1G` as a CI step, failing the build if new errors are found. Advanced patterns include: baseline comparison (fail only on new errors), change-detection for incremental analysis, GitHub Actions annotations for inline error display in PR diffs, matrix testing across multiple PHP/Laravel ...
- **Difficulty:** Foundation
- **Dependencies:** phpstan-in-ci, phpstan-baseline-patterns, and phpstan-config-for-laravel

## Dependency Graph
**Depends on:** phpstan-in-ci, phpstan-baseline-patterns, and phpstan-config-for-laravel
**Depended on by:** Knowledge units that leverage or extend static analysis ci integration patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for static analysis ci integration.
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