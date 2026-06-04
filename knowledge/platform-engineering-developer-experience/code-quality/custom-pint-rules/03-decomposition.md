# Decomposition: custom pint rules

## Topic Overview

Custom Pint rules extend Laravel Pint's code style enforcement beyond the built-in presets by configuring PHP-CS-Fixer rules directly in `pint.json`. While Pint offers four presets (laravel, psr12, per, symfony), real-world projects often need project-specific rules: custom import ordering, forbidden methods or functions, custom type casting preferences, or team-specific formatting conventions. Custom rules are defined in the `rules` section of `pint.json` with the same names and value format...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
custom-pint-rules/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### custom pint rules
- **Purpose:** Custom Pint rules extend Laravel Pint's code style enforcement beyond the built-in presets by configuring PHP-CS-Fixer rules directly in `pint.json`. While Pint offers four presets (laravel, psr12, per, symfony), real-world projects often need project-specific rules: custom import ordering, forbidden methods or functions, custom type casting preferences, or team-specific formatting conventions. Custom rules are defined in the `rules` section of `pint.json` with the same names and value format...
- **Difficulty:** Foundation
- **Dependencies:** pint-configuration, pint-presets, and pint-ci-integration

## Dependency Graph
**Depends on:** pint-configuration, pint-presets, and pint-ci-integration
**Depended on by:** Knowledge units that leverage or extend custom pint rules patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for custom pint rules.
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