# Decomposition: `ShouldBeDiscovered` Interface (Laravel 13.12+)

## Topic Overview

Introduced in Laravel 13.12, `ShouldBeDiscovered` is a marker interface that provides opt-in control over auto-discovery of event listeners. By default, all listeners in `app/Listeners` with `handle()` or `__invoke()` methods are auto-discovered.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k026-should-be-discovered-interface/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### `ShouldBeDiscovered` Interface (Laravel 13.12+)
- **Purpose:** Introduced in Laravel 13.12, `ShouldBeDiscovered` is a marker interface that provides opt-in control over auto-discovery of event listeners. By default, all listeners in `app/Listeners` with `handle()` or `__invoke()` methods are auto-discovered.
- **Difficulty:** Advanced
- **Dependencies:** - K025 Event Auto-Discovery (mechanism context)

## Dependency Graph

This KU depends on: - K025 Event Auto-Discovery (mechanism context)
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **Marker interface**: `ShouldBeDiscovered` has no methods. Its presence indicates the listener should be considered for auto-discovery. - **Opt-in behavior**: Only listeners implementing `ShouldBeDi...
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