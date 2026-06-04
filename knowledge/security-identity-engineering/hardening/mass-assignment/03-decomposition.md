# Decomposition: mass assignment

## Topic Overview

Mass assignment protection in Laravel prevents attackers from setting unintended model attributes by defining a whitelist (`$fillable`) or blacklist (`$guarded`) of attributes that can be set via `create()` or `update()`. The `$fillable` whitelist approach is the recommended pattern — only listed attributes can be mass-assigned. The `$guarded` blacklist is less secure (new columns are automatically assignable until explicitly guarded). Using `$request->validated()` (from Form Request valida...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
mass-assignment/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### mass assignment
- **Purpose:** Mass assignment protection in Laravel prevents attackers from setting unintended model attributes by defining a whitelist (`$fillable`) or blacklist (`$guarded`) of attributes that can be set via `create()` or `update()`. The `$fillable` whitelist approach is the recommended pattern — only listed attributes can be mass-assigned. The `$guarded` blacklist is less secure (new columns are automatically assignable until explicitly guarded). Using `$request->validated()` (from Form Request valida...
- **Difficulty:** Foundation
- **Dependencies:** Prerequisites: Eloquent ORM basics, HTTP request lifecycle, Related: Form Request validation rules, SQL injection prevention (parameterized bindings), Advanced Follow-up: Mass assignment with nested relationships, forceFill patterns for internal APIs, and Security audit of mass assignment on all models

## Dependency Graph
**Depends on:** Prerequisites: Eloquent ORM basics, HTTP request lifecycle, Related: Form Request validation rules, SQL injection prevention (parameterized bindings), Advanced Follow-up: Mass assignment with nested relationships, forceFill patterns for internal APIs, and Security audit of mass assignment on all models
**Depended on by:** Knowledge units that leverage or extend mass assignment patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for mass assignment.
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