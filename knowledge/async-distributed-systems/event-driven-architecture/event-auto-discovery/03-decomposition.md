# Decomposition: Event Auto-Discovery via Directory Scanning

## Topic Overview

Laravel auto-discovers event listeners by scanning the `app/Listeners` directory and checking each class for a `handle()` or `__invoke()` method. The parameter type-hint of these methods determines which event the listener handles.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k025-event-auto-discovery/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Event Auto-Discovery via Directory Scanning
- **Purpose:** Laravel auto-discovers event listeners by scanning the `app/Listeners` directory and checking each class for a `handle()` or `__invoke()` method. The parameter type-hint of these methods determines which event the listener handles.
- **Difficulty:** Intermediate
- **Dependencies:** - K026 `ShouldBeDiscovered` Interface (Laravel 13.12+)

## Dependency Graph

This KU depends on: - K026 `ShouldBeDiscovered` Interface (Laravel 13.12+)
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **Directory-based discovery**: Listener classes inside `app/Listeners` are automatically discovered. - **Method-based binding**: A listener's `handle(OrderShipped $event)` method signature determine...
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