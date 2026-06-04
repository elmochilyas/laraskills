# Decomposition: Queueable Mail, Notifications, and Broadcast Events

## Topic Overview

Beyond explicit job classes, Laravel supports queuing for mail, notifications, and broadcast events — each through a different internal mechanism but all sharing the same underlying queue infrastructure. Mail becomes a `SendMail` job, notifications become a `SendQueuedNotifications` job, and broadcast events become a `CallQueuedBroadcast` job.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k085-queueable-mail-notifications-broadcast/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Queueable Mail, Notifications, and Broadcast Events
- **Purpose:** Beyond explicit job classes, Laravel supports queuing for mail, notifications, and broadcast events — each through a different internal mechanism but all sharing the same underlying queue infrastructure. Mail becomes a `SendMail` job, notifications become a `SendQueuedNotifications` job, and broadcast events become a `CallQueuedBroadcast` job.
- **Difficulty:** Intermediate
- **Dependencies:** - K006 ShouldQueue Contract and Queueable Types (contract mechanics)

## Dependency Graph

This KU depends on: - K006 ShouldQueue Contract and Queueable Types (contract mechanics)
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **Queued mail**: `Mail::queue(new Mailable)` wraps the mailable in an `Illuminate\Mail\SendMail` job. The mailable is serialized with `SerializesModels` automatically. - **Queued notifications**: `N...
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