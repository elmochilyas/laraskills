# Decomposition: Localization in Views

## Topic Overview
__(), @lang, @choice, pluralization in Blade — translating strings in views using PHP array files or JSON files, with locale setting via App::setLocale() or locale middleware.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
localization-in-views/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Localization in Views
- **Purpose:** __(), @lang, pluralization in Blade
- **Difficulty:** Foundation
- **Dependencies:** Template Inheritance

## Dependency Graph
This KU depends on: Template Inheritance. It serves as prerequisite for multi-language application setup.

## Boundary Analysis
**In scope:** __() helper, @lang/@choice directives, PHP array vs JSON translation files, placeholder replacement, pluralization rules, locale detection strategies, fallback chain, Number/Date localization.
**Out of scope:** Application-level locale configuration (covered in Application Architecture), translation file management tools, model translatability (covered in Eloquent patterns).

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