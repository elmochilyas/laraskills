# Decomposition: phpstan config for laravel

## Topic Overview

PHPStan configuration for Laravel applications is defined in `phpstan.neon` using Larastan's rules and extensions. The configuration specifies: analysis level (0-9), paths to scan, excluded paths (vendor, storage, compiled views), Larastan-specific configuration (database type, model directory), custom rules, baseline file location, memory limits, and bootstrap files. Larastan provides a default configuration that handles most Laravel patterns out of the box, but production-grade setups requi...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
phpstan-config-for-laravel/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### phpstan config for laravel
- **Purpose:** PHPStan configuration for Laravel applications is defined in `phpstan.neon` using Larastan's rules and extensions. The configuration specifies: analysis level (0-9), paths to scan, excluded paths (vendor, storage, compiled views), Larastan-specific configuration (database type, model directory), custom rules, baseline file location, memory limits, and bootstrap files. Larastan provides a default configuration that handles most Laravel patterns out of the box, but production-grade setups requi...
- **Difficulty:** Foundation
- **Dependencies:** phpstan-neon-configuration, phpstan-baseline-patterns, and laravel-phpstan

## Dependency Graph
**Depends on:** phpstan-neon-configuration, phpstan-baseline-patterns, and laravel-phpstan
**Depended on by:** Knowledge units that leverage or extend phpstan config for laravel patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for phpstan config for laravel.
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