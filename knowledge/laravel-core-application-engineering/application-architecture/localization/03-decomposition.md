# Decomposition: Localization

## Topic Overview
Laravel's localization system provides a translation layer between application source strings and user-facing output, supporting PHP array and JSON file formats, pluralization across 100+ languages, and locale detection via middleware.

## Decomposition Strategy
This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
`
localization/
  +-- 02-knowledge-unit.md
  +-- 03-decomposition.md
`

## Knowledge Unit Inventory

### Localization
- **Purpose:** Application locale setup, translation file strategy (PHP arrays vs JSON), pluralization, and locale detection.
- **Difficulty:** Intermediate
- **Dependencies:** Configuration Management

## Dependency Graph
This KU depends on: Configuration Management. It serves as prerequisite for no other KUs directly.

## Boundary Analysis
**In scope:** Locale detection strategies (URL prefix, session, user preference, browser); translation file formats (PHP arrays, JSON); Translator key resolution; pluralization via Symfony component; fallback locale cascade; package translation override.
**Out of scope:** Database-backed translations; RTL layout handling; date/number/currency formatting.

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