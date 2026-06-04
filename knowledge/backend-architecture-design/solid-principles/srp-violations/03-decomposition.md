# Decomposition: SOLID principles in PHP: SRP violations

## Topic Overview

Single Responsibility Principle states a class should have only one reason to change. In Laravel, the most common SRP violation is the "God Model" — Eloquent models that handle authentication, authorization, billing, notifications, and reporting in addition to persistence.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
srp-violations/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### SOLID principles in PHP: SRP violations
- **Purpose:** Single Responsibility Principle states a class should have only one reason to change. In Laravel, the most common SRP violation is the "God Model" — Eloquent models that handle authentication, authorization, billing, notifications, and reporting in addition to persistence.
- **Difficulty:** Foundation
- **Dependencies:** Cohesion, Class design |

## Dependency Graph

This KU depends on: Cohesion, Class design |
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - One reason to change: class should be responsible to one actor/stakeholder - Responsibility axis: changes should stem from a single source - Symptom: class with multiple unrelated methods
**Out of scope:** Specific implementation details covered in other KUs, framework-specific internals beyond Laravel, and adjacent design patterns covered in related KUs.

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