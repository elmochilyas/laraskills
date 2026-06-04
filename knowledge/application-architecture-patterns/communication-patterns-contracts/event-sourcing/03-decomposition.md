# Decomposition: Event sourcing fundamentals

## Topic Overview

Event sourcing stores state changes as a sequence of domain events, rather than a snapshot of current state. The current state is derived by replaying all events (or a snapshot + subsequent events).

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
CPC-09-event-sourcing/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Event sourcing fundamentals
- **Purpose:** Event sourcing stores state changes as a sequence of domain events, rather than a snapshot of current state. The current state is derived by replaying all events (or a snapshot + subsequent events).
- **Difficulty:** Expert
- **Dependencies:** CPC-02 Domain events basics

## Dependency Graph

This KU depends on: CPC-02 Domain events basics
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** **Event store:** An append-only log of events. Each event represents a state change. Events are stored in order. No deletes, no updates. **Aggregate in event sourcing:** Each aggregate has a sequence ...
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