# Decomposition: Application Organization Patterns

## Topic Overview
Application organization patterns determine how code is grouped within a Laravel project � technical-layer, domain-driven, modular, and hybrid approaches � each matching different team sizes, model counts, and bounded contexts.

## Decomposition Strategy
This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
`
application-organization-patterns/
  +-- 02-knowledge-unit.md
  +-- 03-decomposition.md
`

## Knowledge Unit Inventory

### Application Organization Patterns
- **Purpose:** Technical-layer, domain-driven, and modular pattern comparison for organizing Laravel project code.
- **Difficulty:** Intermediate
- **Dependencies:** Directory Conventions

## Dependency Graph
This KU depends on: Directory Conventions. It serves as prerequisite for Large Project Structure and Feature-based Structure decisions.

## Boundary Analysis
**In scope:** Technical-layer, domain-driven, modular, and hybrid pattern comparison; decision framework based on model count and team size; migration paths between patterns.
**Out of scope:** Feature-based structure details; cross-feature communication patterns; service provider organization per module.

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