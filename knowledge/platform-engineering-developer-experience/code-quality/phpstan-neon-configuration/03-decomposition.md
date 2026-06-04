# Decomposition: phpstan neon configuration

## Topic Overview

PHPStan's NEON configuration format is the native configuration language for PHPStan, offering features beyond standard YAML: service definitions with autowired dependencies, parameter includes/composition, PHP constant references, type-aware parameters, and hierarchical configuration inheritance. NEON files (`.neon` extension) define PHPStan's analysis scope, rules, extensions, parameters, and baseline. The format supports: includes (merge multiple config files), parameters (application-leve...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
phpstan-neon-configuration/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### phpstan neon configuration
- **Purpose:** PHPStan's NEON configuration format is the native configuration language for PHPStan, offering features beyond standard YAML: service definitions with autowired dependencies, parameter includes/composition, PHP constant references, type-aware parameters, and hierarchical configuration inheritance. NEON files (`.neon` extension) define PHPStan's analysis scope, rules, extensions, parameters, and baseline. The format supports: includes (merge multiple config files), parameters (application-leve...
- **Difficulty:** Foundation
- **Dependencies:** phpstan-config-for-laravel, phpstan-baseline-patterns, and laravel-phpstan

## Dependency Graph
**Depends on:** phpstan-config-for-laravel, phpstan-baseline-patterns, and laravel-phpstan
**Depended on by:** Knowledge units that leverage or extend phpstan neon configuration patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for phpstan neon configuration.
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