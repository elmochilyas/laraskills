# Decomposition: laravel fakes

## Topic Overview

Laravel built-in fakes (Bus, Event, Http, Mail, Notification, Queue, Storage) provide working in-memory implementations of framework services that record calls for later assertion. They replace real service interactions (HTTP calls, email sending, queue dispatching) with zero-side-effect alternatives. Fakes are preferred over mocks for Laravel applications because they provide more realistic behavior, require less setup, and are less brittle. The Laravel ecosystem convention is: "prefer fakes...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
laravel-fakes/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### laravel fakes
- **Purpose:** Laravel built-in fakes (Bus, Event, Http, Mail, Notification, Queue, Storage) provide working in-memory implementations of framework services that record calls for later assertion. They replace real service interactions (HTTP calls, email sending, queue dispatching) with zero-side-effect alternatives. Fakes are preferred over mocks for Laravel applications because they provide more realistic behavior, require less setup, and are less brittle. The Laravel ecosystem convention is: "prefer fakes...
- **Difficulty:** Foundation
- **Dependencies:** **Prerequisites**: Service container, Facade system, Test double taxonomy, **Related Topics**: HTTP Client faking, Mail/notification testing, Queue/job testing, Storage fake testing, **Advanced Follow-up**: Custom fake development, Fake vs mock decision matrix, and Partial faking patterns

## Dependency Graph
**Depends on:** **Prerequisites**: Service container, Facade system, Test double taxonomy, **Related Topics**: HTTP Client faking, Mail/notification testing, Queue/job testing, Storage fake testing, **Advanced Follow-up**: Custom fake development, Fake vs mock decision matrix, and Partial faking patterns
**Depended on by:** Knowledge units that leverage or extend laravel fakes patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for laravel fakes.
**Out of scope:** Adjacent topics covered in their own knowledge units; advanced or specialized use cases that extend beyond the core scope.

## Future Expansion Opportunities
None identified — the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization