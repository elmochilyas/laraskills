# Decomposition: laravel rector

## Topic Overview

Rector is an automated refactoring tool for PHP that applies AST-based transformations to upgrade and improve code. For Laravel applications, Rector provides sets of rules that automate: Laravel version upgrades (migrating deprecated methods, renamed classes, changed interfaces), code modernization (type declarations, match expressions, readonly properties), custom framework migrations (old patterns to new conventions), and code quality improvements. Rector operates on PHP files' Abstract Syn...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
laravel-rector/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### laravel rector
- **Purpose:** Rector is an automated refactoring tool for PHP that applies AST-based transformations to upgrade and improve code. For Laravel applications, Rector provides sets of rules that automate: Laravel version upgrades (migrating deprecated methods, renamed classes, changed interfaces), code modernization (type declarations, match expressions, readonly properties), custom framework migrations (old patterns to new conventions), and code quality improvements. Rector operates on PHP files' Abstract Syn...
- **Difficulty:** Foundation
- **Dependencies:** rector-rules-laravel-upgrades, laravel-shift, and phpstan-baseline-patterns

## Dependency Graph
**Depends on:** rector-rules-laravel-upgrades, laravel-shift, and phpstan-baseline-patterns
**Depended on by:** Knowledge units that leverage or extend laravel rector patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for laravel rector.
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