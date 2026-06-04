# Decomposition: Broadcasting System Overview (Pusher, Reverb, Ably)

## Topic Overview

Laravel's broadcasting system provides a pub/sub mechanism for pushing real-time events from the server to connected clients over WebSockets. The system is abstracted into three layers: the broadcasting driver (Pusher, Reverb, Ably), the event→channel mapping (via `ShouldBroadcast`), and the client-side consumption (Laravel Echo).

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k030-broadcasting-system-overview/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Broadcasting System Overview (Pusher, Reverb, Ably)
- **Purpose:** Laravel's broadcasting system provides a pub/sub mechanism for pushing real-time events from the server to connected clients over WebSockets. The system is abstracted into three layers: the broadcasting driver (Pusher, Reverb, Ably), the event→channel mapping (via `ShouldBroadcast`), and the client-side consumption (Laravel Echo).
- **Difficulty:** Foundation
- **Dependencies:** - K031 Laravel Reverb — WebSocket Server (deep dive)

## Dependency Graph

This KU depends on: - K031 Laravel Reverb — WebSocket Server (deep dive)
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **Drivers**: Pusher (SaaS WebSocket), Reverb (self-hosted, Laravel-native), Ably (SaaS real-time), `log` (debug), `null` (disable). - **`ShouldBroadcast`**: Interface marking an event for broadcasti...
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