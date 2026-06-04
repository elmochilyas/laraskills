# Decomposition: `withEvents` for Custom Listener Directories

## Topic Overview

Laravel's auto-discovery scans `app/Listeners` by default. The `withEvents()` method on `EventServiceProvider` allows customization of the listener discovery path and the event directory path.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k084-with-events-custom-listener-directories/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### `withEvents` for Custom Listener Directories
- **Purpose:** Laravel's auto-discovery scans `app/Listeners` by default. The `withEvents()` method on `EventServiceProvider` allows customization of the listener discovery path and the event directory path.
- **Difficulty:** Intermediate
- **Dependencies:** - K025 Event Auto-Discovery (core discovery mechanism)

## Dependency Graph

This KU depends on: - K025 Event Auto-Discovery (core discovery mechanism)
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **`withEvents()`**: A method on `EventServiceProvider` that accepts a custom events path and/or listeners path. - **Default paths**: `app/Events` for events, `app/Listeners` for listeners. - **Custo...
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