# Decomposition: Synchronous vs queued event handling

## Topic Overview

Synchronous event handlers execute in the same request lifecycle. Queued handlers are deferred to a worker process.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
CPC-03-sync-vs-queued-events/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Synchronous vs queued event handling
- **Purpose:** Synchronous event handlers execute in the same request lifecycle. Queued handlers are deferred to a worker process.
- **Difficulty:** Advanced
- **Dependencies:** CPC-02 Domain events basics

## Dependency Graph

This KU depends on: CPC-02 Domain events basics
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** **Synchronous handling:** All listeners run sequentially before the response is sent. If a listener fails, the request fails. The listener has access to the same database transaction. **Queued handlin...
**Out of scope:** Specific implementation details covered in other KUs, framework-specific internals beyond Laravel, and adjacent architectural patterns covered in related KUs.

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