# Decomposition: Wildcard Event Listener Discovery

## Topic Overview

Laravel supports wildcard event patterns using `*` as a glob-style matcher in both event names and listener signatures. A listener with `handle(* $event)` catches ALL events.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k029-wildcard-event-listener-discovery/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Wildcard Event Listener Discovery
- **Purpose:** Laravel supports wildcard event patterns using `*` as a glob-style matcher in both event names and listener signatures. A listener with `handle(* $event)` catches ALL events.
- **Difficulty:** Intermediate
- **Dependencies:** - K025 Event Auto-Discovery (basis for method-level wildcard)

## Dependency Graph

This KU depends on: - K025 Event Auto-Discovery (basis for method-level wildcard)
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **Method-based wildcard**: A listener's `handle(* $event)` parameter type-hinted with `*` catches every dispatched event. - **Name-based wildcard**: `$events->listen('order.*', $handler)` registers ...
**Out of scope:** Specific implementation details covered in other KUs, framework-specific internals beyond Laravel, and adjacent queue/event patterns covered in related KUs.

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