# Decomposition: Channel Types: Public, Private, Presence

## Topic Overview

Laravel broadcasting defines three channel types with ascending access control: **public** (no authentication — anyone can listen), **private** (authenticated — user must be authorized to subscribe), and **presence** (authenticated + user state tracked — who's online). The channel type is determined by the naming convention in the event's `broadcastOn()`: `orders` (public), `private-orders.{orderId}` (private), `presence-orders.{orderId}` (presence).

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k032-channel-types/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Channel Types: Public, Private, Presence
- **Purpose:** Laravel broadcasting defines three channel types with ascending access control: **public** (no authentication — anyone can listen), **private** (authenticated — user must be authorized to subscribe), and **presence** (authenticated + user state tracked — who's online). The channel type is determined by the naming convention in the event's `broadcastOn()`: `orders` (public), `private-orders.{orderId}` (private), `presence-orders.{orderId}` (presence).
- **Difficulty:** Foundation
- **Dependencies:** - K030 Broadcasting System Overview

## Dependency Graph

This KU depends on: - K030 Broadcasting System Overview
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **Public channels**: No auth. Any client with the channel name can subscribe. Named without prefix (e.g., `orders`). - **Private channels**: User must be authenticated and authorized via a callback ...
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