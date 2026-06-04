# Decomposition: Domain events vs integration events distinction

## Topic Overview

Domain events record something meaningful that happened in the domain (within a bounded context), while integration events communicate state changes across bounded context boundaries. This distinction is critical for maintaining bounded context autonomy.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
domain-vs-integration-events/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Domain events vs integration events distinction
- **Purpose:** Domain events record something meaningful that happened in the domain (within a bounded context), while integration events communicate state changes across bounded context boundaries. This distinction is critical for maintaining bounded context autonomy.
- **Difficulty:** Intermediate
- **Dependencies:** Bounded contexts, Domain events |

## Dependency Graph

This KU depends on: Bounded contexts, Domain events |
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** | Characteristic | Domain Event | Integration Event | |---------------|--------------|-------------------| | Scope | Within bounded context | Across bounded contexts |
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