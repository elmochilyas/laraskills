# Decomposition: phpstan in ci

## Topic Overview

PHPStan in CI refers to running PHPStan static analysis as an automated step in the CI/CD pipeline, blocking pull requests that introduce new errors. For Laravel teams, PHPStan (via Larastan) catches type errors, missing return types, incorrect method calls, unused variable assignments, and potentially unsafe array access. Running PHPStan in CI ensures that static analysis quality is maintained across all code changes, not just when developers remember to run it locally. The typical CI config...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
phpstan-in-ci/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### phpstan in ci
- **Purpose:** PHPStan in CI refers to running PHPStan static analysis as an automated step in the CI/CD pipeline, blocking pull requests that introduce new errors. For Laravel teams, PHPStan (via Larastan) catches type errors, missing return types, incorrect method calls, unused variable assignments, and potentially unsafe array access. Running PHPStan in CI ensures that static analysis quality is maintained across all code changes, not just when developers remember to run it locally. The typical CI config...
- **Difficulty:** Foundation
- **Dependencies:** laravel-phpstan, phpstan-config-for-laravel, and phpstan-baseline-patterns

## Dependency Graph
**Depends on:** laravel-phpstan, phpstan-config-for-laravel, and phpstan-baseline-patterns
**Depended on by:** Knowledge units that leverage or extend phpstan in ci patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for phpstan in ci.
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