# Decomposition: architecture presets

## Topic Overview

Pest architecture presets provide pre-configured sets of architectural expectations for common Laravel project profiles. The built-in presets — `security`, `laravel`, `php`, `strict`, and `relaxed` — enforce coding standards, prevent regressions in structural decisions, and catch accidental violations of project conventions. Architecture presets reduce boilerplate by applying multiple arch() expectations in a single call, enabling teams to enforce consistent architectural rules across pro...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
architecture-presets/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### architecture presets
- **Purpose:** Pest architecture presets provide pre-configured sets of architectural expectations for common Laravel project profiles. The built-in presets — `security`, `laravel`, `php`, `strict`, and `relaxed` — enforce coding standards, prevent regressions in structural decisions, and catch accidental violations of project conventions. Architecture presets reduce boilerplate by applying multiple arch() expectations in a single call, enabling teams to enforce consistent architectural rules across pro...
- **Difficulty:** Foundation
- **Dependencies:** **Prerequisites**: Pest arch() fundamentals, PHP type system understanding, **Related Topics**: Pest arch fundamentals, Static analysis with PHPStan/Larastan, PHP code style with Pint, **Advanced Follow-up**: Custom architecture presets, Architecture baseline management, and Cross-project preset sharing

## Dependency Graph
**Depends on:** **Prerequisites**: Pest arch() fundamentals, PHP type system understanding, **Related Topics**: Pest arch fundamentals, Static analysis with PHPStan/Larastan, PHP code style with Pint, **Advanced Follow-up**: Custom architecture presets, Architecture baseline management, and Cross-project preset sharing
**Depended on by:** Knowledge units that leverage or extend architecture presets patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for architecture presets.
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