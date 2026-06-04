# Decomposition: Event Subscribers and Manual Registration

## Topic Overview

Event subscribers are classes that group multiple event-listener mappings in a single `subscribe()` method. They provide an alternative to per-listener classes and manual `EventServiceProvider` registration.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k027-event-subscribers-registration/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Event Subscribers and Manual Registration
- **Purpose:** Event subscribers are classes that group multiple event-listener mappings in a single `subscribe()` method. They provide an alternative to per-listener classes and manual `EventServiceProvider` registration.
- **Difficulty:** Intermediate
- **Dependencies:** - K025 Event Auto-Discovery (alternative registration)

## Dependency Graph

This KU depends on: - K025 Event Auto-Discovery (alternative registration)
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **Subscriber class**: A class with a `subscribe(Dispatcher $events)` method that calls `$events->listen()` for each event. - **`$subscribe` array**: Property on `EventServiceProvider` listing subscr...
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