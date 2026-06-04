# Decomposition: When to apply CQRS selectively per bounded context

## Topic Overview

CQRS should be applied selectively per bounded context, not as a system-wide architecture. Different contexts have different read/write symmetry.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
selective-cqrs-application/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### When to apply CQRS selectively per bounded context
- **Purpose:** CQRS should be applied selectively per bounded context, not as a system-wide architecture. Different contexts have different read/write symmetry.
- **Difficulty:** Advanced
- **Dependencies:** Bounded contexts, CQRS maturity levels |

## Dependency Graph

This KU depends on: Bounded contexts, CQRS maturity levels |
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - Context-specific CQRS depth: each bounded context independently - Read/write asymmetry: high asymmetry → higher CQRS level - Business value: only apply where read/write separation provides tangi...
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