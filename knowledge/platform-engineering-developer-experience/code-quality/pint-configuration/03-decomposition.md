# Decomposition: pint configuration

## Topic Overview

Laravel Pint configuration is defined in a `pint.json` file at the project root, controlling which preset to use, custom rule overrides, and file/directory exclusions. The configuration supports: preset selection (`laravel`, `psr12`, `per`, `symfony`), rule enable/disable (individual PHP-CS-Fixer rules from bundled `php-cs-fixer/shim`), rule configuration (complex rules with sub-options), path exclusions (`notPath`, `notName`), single-file targeting (`--filter`), and output formatting. `pint....

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
pint-configuration/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### pint configuration
- **Purpose:** Laravel Pint configuration is defined in a `pint.json` file at the project root, controlling which preset to use, custom rule overrides, and file/directory exclusions. The configuration supports: preset selection (`laravel`, `psr12`, `per`, `symfony`), rule enable/disable (individual PHP-CS-Fixer rules from bundled `php-cs-fixer/shim`), rule configuration (complex rules with sub-options), path exclusions (`notPath`, `notName`), single-file targeting (`--filter`), and output formatting. `pint....
- **Difficulty:** Foundation
- **Dependencies:** laravel-pint, pint-presets, and pint-ci-integration

## Dependency Graph
**Depends on:** laravel-pint, pint-presets, and pint-ci-integration
**Depended on by:** Knowledge units that leverage or extend pint configuration patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for pint configuration.
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