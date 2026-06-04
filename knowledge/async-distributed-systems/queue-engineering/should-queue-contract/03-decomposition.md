# Decomposition: `ShouldQueue` Contract and Queueable Types

## Topic Overview

`ShouldQueue` is the marker interface that tells Laravel the job/listener/mail/notification should be processed asynchronously. It's an empty contract — no methods to implement.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k006-should-queue-contract/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### `ShouldQueue` Contract and Queueable Types
- **Purpose:** `ShouldQueue` is the marker interface that tells Laravel the job/listener/mail/notification should be processed asynchronously. It's an empty contract — no methods to implement.
- **Difficulty:** Foundation
- **Dependencies:** - K085 Queueable Mail, Notifications, and Broadcast Events (type-specific behavior)

## Dependency Graph

This KU depends on: - K085 Queueable Mail, Notifications, and Broadcast Events (type-specific behavior)
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **`ShouldQueue` interface**: An empty marker interface in `Illuminate\Contracts\Queue`. Its presence alone changes behavior from synchronous to async. - **Queueable types**: Objects that can be disp...
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