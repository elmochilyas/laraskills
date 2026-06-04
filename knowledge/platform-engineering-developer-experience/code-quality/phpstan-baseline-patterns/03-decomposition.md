# Decomposition: phpstan baseline patterns

## Topic Overview

PHPStan's baseline feature allows teams to adopt strict static analysis on existing codebases by recording current errors as a "known issues" baseline file, then only reporting new errors going forward. The baseline is generated via `phpstan analyse --generate-baseline`, which creates a `phpstan-baseline.neon` file listing all current errors with specific file lines and error messages. Subsequent PHPStan runs ignore baseline-listed errors, allowing teams to work at strict levels (6-9) while g...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
phpstan-baseline-patterns/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### phpstan baseline patterns
- **Purpose:** PHPStan's baseline feature allows teams to adopt strict static analysis on existing codebases by recording current errors as a "known issues" baseline file, then only reporting new errors going forward. The baseline is generated via `phpstan analyse --generate-baseline`, which creates a `phpstan-baseline.neon` file listing all current errors with specific file lines and error messages. Subsequent PHPStan runs ignore baseline-listed errors, allowing teams to work at strict levels (6-9) while g...
- **Difficulty:** Foundation
- **Dependencies:** phpstan-config-for-laravel, phpstan-neon-configuration, and static-analysis-ci-integration

## Dependency Graph
**Depends on:** phpstan-config-for-laravel, phpstan-neon-configuration, and static-analysis-ci-integration
**Depended on by:** Knowledge units that leverage or extend phpstan baseline patterns patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for phpstan baseline patterns.
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