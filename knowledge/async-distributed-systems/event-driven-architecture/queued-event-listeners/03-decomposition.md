# Decomposition: Queued Event Listeners

## Topic Overview

An event listener that implements `ShouldQueue` is automatically queued — the event is dispatched, the listener class is serialized (with the event), and pushed to the queue as a `CallQueuedListener` job. This allows listeners to perform I/O operations (API calls, email sending) without blocking the event dispatcher.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k028-queued-event-listeners/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Queued Event Listeners
- **Purpose:** An event listener that implements `ShouldQueue` is automatically queued — the event is dispatched, the listener class is serialized (with the event), and pushed to the queue as a `CallQueuedListener` job. This allows listeners to perform I/O operations (API calls, email sending) without blocking the event dispatcher.
- **Difficulty:** Intermediate
- **Dependencies:** - K006 `ShouldQueue` Contract (contract mechanics)

## Dependency Graph

This KU depends on: - K006 `ShouldQueue` Contract (contract mechanics)
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **`ShouldQueue` on listeners**: Marking a listener with `ShouldQueue` routes it through the queue system. - **`CallQueuedListener`**: The internal job class that wraps the listener and event. It cal...
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