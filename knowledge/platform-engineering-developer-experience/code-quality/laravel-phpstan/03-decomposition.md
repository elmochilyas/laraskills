# Decomposition: laravel phpstan

## Topic Overview

Laravel PHPStan (via the Larastan package) brings PHPStan's powerful static analysis to Laravel applications, detecting type errors, undefined methods, missing return types, incorrect facade calls, and hundreds of other potential bugs without running the code. Larastan provides Laravel-specific extensions that understand: facades (resolve `Cache::get()` return types), Eloquent models (recognize relationships, scopes, dynamic properties), `collect()` helper return types, `response()` and `redi...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
laravel-phpstan/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### laravel phpstan
- **Purpose:** Laravel PHPStan (via the Larastan package) brings PHPStan's powerful static analysis to Laravel applications, detecting type errors, undefined methods, missing return types, incorrect facade calls, and hundreds of other potential bugs without running the code. Larastan provides Laravel-specific extensions that understand: facades (resolve `Cache::get()` return types), Eloquent models (recognize relationships, scopes, dynamic properties), `collect()` helper return types, `response()` and `redi...
- **Difficulty:** Foundation
- **Dependencies:** phpstan-config-for-laravel, phpstan-neon-configuration, and phpstan-baseline-patterns

## Dependency Graph
**Depends on:** phpstan-config-for-laravel, phpstan-neon-configuration, and phpstan-baseline-patterns
**Depended on by:** Knowledge units that leverage or extend laravel phpstan patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for laravel phpstan.
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