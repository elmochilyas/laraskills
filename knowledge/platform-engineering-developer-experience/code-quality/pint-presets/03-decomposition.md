# Decomposition: pint presets

## Topic Overview

Laravel Pint provides four built-in presets that define the baseline code style rulesets: `laravel` (Laravel's own coding standards), `psr12` (PHP-FIG PSR-12 standard), `per` (PER coding style, successor to PSR-2), and `symfony` (Symfony framework conventions). The preset is selected via `"preset": "laravel"` in `pint.json`. Each preset enables a comprehensive set of PHP-CS-Fixer rules that cover: braces style, import ordering, spacing, trailing commas, string quotes, type declaration spacing...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
pint-presets/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### pint presets
- **Purpose:** Laravel Pint provides four built-in presets that define the baseline code style rulesets: `laravel` (Laravel's own coding standards), `psr12` (PHP-FIG PSR-12 standard), `per` (PER coding style, successor to PSR-2), and `symfony` (Symfony framework conventions). The preset is selected via `"preset": "laravel"` in `pint.json`. Each preset enables a comprehensive set of PHP-CS-Fixer rules that cover: braces style, import ordering, spacing, trailing commas, string quotes, type declaration spacing...
- **Difficulty:** Foundation
- **Dependencies:** laravel-pint, pint-configuration, and custom-pint-rules

## Dependency Graph
**Depends on:** laravel-pint, pint-configuration, and custom-pint-rules
**Depended on by:** Knowledge units that leverage or extend pint presets patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for pint presets.
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