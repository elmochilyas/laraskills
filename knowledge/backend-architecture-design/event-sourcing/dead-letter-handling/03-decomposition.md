# Decomposition: Dead letter handling for failed projections

## Topic Overview

Dead letter queue (DLQ) stores events that consumers/projections failed to process, preventing message loss while allowing investigation and retry. In event sourcing, failed projections can cause read models to diverge from event history.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
dead-letter-handling/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Dead letter handling for failed projections
- **Purpose:** Dead letter queue (DLQ) stores events that consumers/projections failed to process, preventing message loss while allowing investigation and retry. In event sourcing, failed projections can cause read models to diverge from event history.
- **Difficulty:** Advanced
- **Dependencies:** Event sourcing projections, Message queuing |

## Dependency Graph

This KU depends on: Event sourcing projections, Message queuing |
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - Dead letter: event that repeatedly fails processing - Retry policy: immediate retry, exponential backoff, max retries - Manual intervention: inspect, fix cause, replay event
**Out of scope:** Specific implementation details covered in other KUs, framework-specific internals beyond Laravel, and adjacent design patterns covered in related KUs.

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