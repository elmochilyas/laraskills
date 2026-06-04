# Decomposition: Default Laravel directory structure and its design rationale

## Topic Overview

Laravel's default directory structure is the framework's most consequential architectural opinion. It is deliberately minimal—`app/`, `bootstrap/`, `config/`, `database/`, `public/`, `resources/`, `routes/`, `storage/`, `tests/`, `vendor/`—prioritizing immediate productivity over strict layering.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
COS-01-default-laravel-structure/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Default Laravel directory structure and its design rationale
- **Purpose:** Laravel's default directory structure is the framework's most consequential architectural opinion. It is deliberately minimal—`app/`, `bootstrap/`, `config/`, `database/`, `public/`, `resources/`, `routes/`, `storage/`, `tests/`, `vendor/`—prioritizing immediate productivity over strict layering.
- **Difficulty:** Foundation
- **Dependencies:** PHP PSR-4 autoloading basics

## Dependency Graph

This KU depends on: PHP PSR-4 autoloading basics
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** The default structure optimizes for rapid onboarding and framework convention over custom architecture. Every top-level directory maps to a framework concern: - `app/` — Application code, auto-loade...
**Out of scope:** Specific implementation details covered in other KUs, framework-specific internals beyond Laravel, and adjacent architectural patterns covered in related KUs.

## Future Expansion Opportunities

None identified � the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization