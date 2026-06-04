# Decomposition: Event bus patterns (in-process vs message broker)

## Topic Overview

Event bus distributes events from producers to consumers. Two fundamental patterns exist: in-process (synchronous, within same process) and message broker (asynchronous, across processes/services).

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
event-bus-patterns/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Event bus patterns (in-process vs message broker)
- **Purpose:** Event bus distributes events from producers to consumers. Two fundamental patterns exist: in-process (synchronous, within same process) and message broker (asynchronous, across processes/services).
- **Difficulty:** Intermediate
- **Dependencies:** Event-driven architecture basics, Laravel events/queues |

## Dependency Graph

This KU depends on: Event-driven architecture basics, Laravel events/queues |
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** event-bus-patterns is built on foundational concepts that govern its application in backend architecture. | Concept | Description | Relevance | |---------|-------------|-----------|
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